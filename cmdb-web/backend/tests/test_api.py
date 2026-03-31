import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from app.core.database import Base, engine, async_session, get_db
from app.core.security import get_password_hash
from app.models.user import User, Role
from app.main import app

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession


TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_cmdb.db"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSession = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with TestSession() as session:
        try:
            yield session
        finally:
            await session.close()


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(autouse=True)
async def setup_database():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def auth_token(client: AsyncClient):
    await seed_test_data(client)
    response = await client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    data = response.json()
    return data["data"]["token"]


@pytest_asyncio.fixture
async def auth_headers(auth_token: str):
    return {"Authorization": f"Bearer {auth_token}"}


async def seed_test_data(client: AsyncClient):
    session = TestSession()
    try:
        admin_role = Role(
            id="role-admin-001",
            name="管理员",
            code="admin",
            description="系统管理员",
            permissions="*",
        )
        session.add(admin_role)

        admin_user = User(
            id="user-admin-001",
            username="admin",
            email="admin@example.com",
            hashed_password=get_password_hash("admin123"),
            role_id="role-admin-001",
        )
        session.add(admin_user)
        await session.commit()
    finally:
        await session.close()


class TestAuth:
    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient):
        await seed_test_data(client)
        response = await client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "token" in data["data"]
        assert data["data"]["user"]["username"] == "admin"

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client: AsyncClient):
        await seed_test_data(client)
        response = await client.post("/api/auth/login", json={"username": "admin", "password": "wrong"})
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_me(self, client: AsyncClient, auth_headers: dict):
        response = await client.get("/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["username"] == "admin"

    @pytest.mark.asyncio
    async def test_get_me_unauthorized(self, client: AsyncClient):
        response = await client.get("/api/auth/me")
        assert response.status_code == 403


class TestUsers:
    @pytest.mark.asyncio
    async def test_list_users(self, client: AsyncClient, auth_headers: dict):
        response = await client.get("/api/users", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "items" in data["data"]

    @pytest.mark.asyncio
    async def test_create_user(self, client: AsyncClient, auth_headers: dict):
        response = await client.post("/api/users", headers=auth_headers, json={
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "password123",
        })
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True


class TestCI:
    @pytest.mark.asyncio
    async def test_list_ci(self, client: AsyncClient, auth_headers: dict):
        response = await client.get("/api/ci", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    @pytest.mark.asyncio
    async def test_create_ci(self, client: AsyncClient, auth_headers: dict):
        response = await client.post("/api/ci", headers=auth_headers, json={
            "name": "test-server-01",
            "type": "server",
            "ip": "192.168.1.100",
            "cpu": "8核",
            "memory": "16GB",
        })
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True

    @pytest.mark.asyncio
    async def test_get_ci(self, client: AsyncClient, auth_headers: dict):
        create_resp = await client.post("/api/ci", headers=auth_headers, json={
            "name": "test-server-02",
            "type": "server",
        })
        ci_id = create_resp.json()["data"]["id"]

        response = await client.get(f"/api/ci/{ci_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["data"]["name"] == "test-server-02"


class TestAuditLog:
    @pytest.mark.asyncio
    async def test_list_audit_logs(self, client: AsyncClient, auth_headers: dict):
        response = await client.get("/api/audit", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
