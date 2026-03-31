import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_password_hash, get_current_user
from app.models.user import User, Role
from app.schemas.common import LoginRequest, LoginResponse, UserInfoResponse, BaseResponse

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(request: Request, body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == body.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户名或密码错误")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="用户已被禁用")

    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()

    role_name = user.role.name if user.role else "user"
    permissions = []
    if user.role and user.role.permissions:
        permissions = user.role.permissions.split(",")

    token = create_access_token({
        "sub": user.id,
        "username": user.username,
        "role": role_name,
    })

    return LoginResponse(data={
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": role_name,
            "permissions": permissions,
        },
    })


@router.get("/me", response_model=UserInfoResponse)
async def get_me(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == current_user["user_id"]))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")

    role_name = user.role.name if user.role else "user"
    permissions = []
    if user.role and user.role.permissions:
        permissions = user.role.permissions.split(",")

    return UserInfoResponse(data={
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": role_name,
        "permissions": permissions,
    })


@router.post("/logout", response_model=BaseResponse)
async def logout(current_user: dict = Depends(get_current_user)):
    return BaseResponse(message="登出成功")
