import uuid
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, get_password_hash
from app.models.user import User, Role
from app.schemas.user import UserCreate, UserUpdate
from app.schemas.common import BaseResponse

router = APIRouter()


@router.get("", response_model=BaseResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    query = select(User)
    count_query = select(func.count(User.id))

    if keyword:
        query = query.where(User.username.ilike(f"%{keyword}%") | User.email.ilike(f"%{keyword}%"))
        count_query = count_query.where(User.username.ilike(f"%{keyword}%") | User.email.ilike(f"%{keyword}%"))

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.offset((page - 1) * page_size).limit(page_size).order_by(User.created_at.desc())
    result = await db.execute(query)
    users = result.scalars().all()

    items = []
    for u in users:
        role_name = u.role.code if u.role else "user"
        items.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": role_name,
            "status": "active" if u.is_active else "disabled",
            "createdAt": u.created_at.strftime("%Y-%m-%d %H:%M:%S") if u.created_at else "",
        })

    return BaseResponse(data={"items": items, "total": total})


@router.post("", response_model=BaseResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    body: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    existing = await db.execute(select(User).where(User.username == body.username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="用户名已存在")

    existing_email = await db.execute(select(User).where(User.email == body.email))
    if existing_email.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="邮箱已存在")

    user = User(
        id=str(uuid.uuid4()),
        username=body.username,
        email=body.email,
        hashed_password=get_password_hash(body.password),
        role_id=body.role_id,
    )
    db.add(user)
    await db.commit()

    return BaseResponse(message="用户创建成功", data={"id": user.id})


@router.get("/{user_id}", response_model=BaseResponse)
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    return BaseResponse(data={
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role_id": user.role_id,
        "role": user.role.code if user.role else "user",
        "status": "active" if user.is_active else "disabled",
        "createdAt": user.created_at.strftime("%Y-%m-%d %H:%M:%S") if user.created_at else "",
    })


@router.put("/{user_id}", response_model=BaseResponse)
async def update_user(
    user_id: str,
    body: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    if body.email is not None:
        user.email = body.email
    if body.role_id is not None:
        user.role_id = body.role_id
    if body.is_active is not None:
        user.is_active = body.is_active

    await db.commit()
    return BaseResponse(message="用户更新成功")


@router.delete("/{user_id}", response_model=BaseResponse)
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    await db.delete(user)
    await db.commit()
    return BaseResponse(message="用户删除成功")
