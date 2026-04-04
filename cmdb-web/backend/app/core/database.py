from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings
from pgbox import get_server

# 启动 pgbox PostgreSQL 服务器
server = get_server(settings.PGDATA_DIR)
# 获取连接 URI 并修改为使用 asyncpg 驱动
DATABASE_URL = server.get_uri().replace('postgresql://', 'postgresql+asyncpg://')

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
