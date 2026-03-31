import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.user import User, Role
from app.core.security import get_password_hash
from app.core.database import Base

async def seed_test_data():
    """初始化测试数据"""
    # 使用内存数据库进行测试
    test_engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async_session = sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)
    
    # 创建所有表
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # 创建测试数据
    async with async_session() as session:
        # 创建角色
        admin_role = Role(
            id="1",
            name="管理员",
            code="admin",
            description="系统管理员",
            permissions="*"
        )
        
        user_role = Role(
            id="2",
            name="普通用户",
            code="user",
            description="普通用户",
            permissions="ci:view,change:view"
        )
        
        session.add(admin_role)
        session.add(user_role)
        await session.commit()
        
        # 创建管理员用户
        admin_user = User(
            id="1",
            username="admin",
            email="admin@example.com",
            hashed_password=get_password_hash("admin123"),
            role_id="1",
            is_active=True
        )
        
        # 创建普通用户
        user_user = User(
            id="2",
            username="user",
            email="user@example.com",
            hashed_password=get_password_hash("user123"),
            role_id="2",
            is_active=True
        )
        
        session.add(admin_user)
        session.add(user_user)
        await session.commit()
        
        print("测试数据初始化完成")
        print(f"管理员用户: admin/admin123")
        print(f"普通用户: user/user123")

if __name__ == "__main__":
    asyncio.run(seed_test_data())
