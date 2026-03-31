import uuid
import json
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, Role
from app.schemas.role import RoleCreate, RoleUpdate
from app.schemas.common import BaseResponse

router = APIRouter()


@router.get("", response_model=BaseResponse)
async def list_roles(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    count_query = select(func.count(Role.id))
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = select(Role).offset((page - 1) * page_size).limit(page_size).order_by(Role.created_at.desc())
    result = await db.execute(query)
    roles = result.scalars().all()

    items = []
    for r in roles:
        user_count_result = await db.execute(select(func.count(User.id)).where(User.role_id == r.id))
        user_count = user_count_result.scalar() or 0
        items.append({
            "id": r.id,
            "name": r.name,
            "code": r.code,
            "description": r.description,
            "userCount": user_count,
            "createdAt": r.created_at.strftime("%Y-%m-%d %H:%M:%S") if r.created_at else "",
        })

    return BaseResponse(data={"items": items, "total": total})


@router.post("", response_model=BaseResponse, status_code=status.HTTP_201_CREATED)
async def create_role(
    body: RoleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    existing = await db.execute(select(Role).where(Role.code == body.code))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="角色代码已存在")

    role = Role(
        id=str(uuid.uuid4()),
        name=body.name,
        code=body.code,
        description=body.description,
        permissions=",".join(body.permissions) if body.permissions else None,
    )
    db.add(role)
    await db.commit()

    return BaseResponse(message="角色创建成功", data={"id": role.id})


@router.get("/{role_id}", response_model=BaseResponse)
async def get_role(
    role_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="角色不存在")

    permissions = role.permissions.split(",") if role.permissions else []

    return BaseResponse(data={
        "id": role.id,
        "name": role.name,
        "code": role.code,
        "description": role.description,
        "permissions": permissions,
        "isActive": role.is_active,
        "createdAt": role.created_at.strftime("%Y-%m-%d %H:%M:%S") if role.created_at else "",
    })


@router.put("/{role_id}", response_model=BaseResponse)
async def update_role(
    role_id: str,
    body: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="角色不存在")

    if body.name is not None:
        role.name = body.name
    if body.description is not None:
        role.description = body.description
    if body.permissions is not None:
        role.permissions = ",".join(body.permissions)
    if body.is_active is not None:
        role.is_active = body.is_active

    await db.commit()
    return BaseResponse(message="角色更新成功")


@router.delete("/{role_id}", response_model=BaseResponse)
async def delete_role(
    role_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="角色不存在")

    user_count_result = await db.execute(select(func.count(User.id)).where(User.role_id == role_id))
    user_count = user_count_result.scalar() or 0
    if user_count > 0:
        raise HTTPException(status_code=400, detail=f"该角色下有 {user_count} 个用户，无法删除")

    await db.delete(role)
    await db.commit()
    return BaseResponse(message="角色删除成功")
