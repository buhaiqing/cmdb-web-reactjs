from app.core.config import settings
from app.core.database import engine, Base
from app.api.routes import auth, users, roles, ci, audit, changes
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="CMDB 配置管理数据库后端 API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(users.router, prefix="/api/users", tags=["用户管理"])
app.include_router(roles.router, prefix="/api/roles", tags=["角色管理"])
app.include_router(ci.router, prefix="/api/ci", tags=["配置项管理"])
app.include_router(audit.router, prefix="/api/audit", tags=["审计日志"])
app.include_router(changes.router, prefix="/api/changes", tags=["变更管理"])


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "cmdb-backend"}
