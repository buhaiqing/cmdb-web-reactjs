import uuid
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.ci import CI
from app.models.audit import AuditLog
from app.schemas.ci import CICreate, CIUpdate
from app.schemas.common import BaseResponse

router = APIRouter()


@router.get("", response_model=BaseResponse)
async def list_ci(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    type: str | None = None,
    status: str | None = None,
    keyword: str | None = None,
    project: str | None = None,
    environment: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    query = select(CI)
    count_query = select(func.count(CI.id))

    if type:
        query = query.where(CI.type == type)
        count_query = count_query.where(CI.type == type)
    if status:
        query = query.where(CI.status == status)
        count_query = count_query.where(CI.status == status)
    if keyword:
        query = query.where(CI.name.ilike(f"%{keyword}%"))
        count_query = count_query.where(CI.name.ilike(f"%{keyword}%"))
    if project:
        query = query.where(CI.project == project)
        count_query = count_query.where(CI.project == project)
    if environment:
        query = query.where(CI.environment == environment)
        count_query = count_query.where(CI.environment == environment)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.offset((page - 1) * pageSize).limit(pageSize).order_by(CI.created_at.desc())
    result = await db.execute(query)
    items = result.scalars().all()

    ci_list = []
    for ci in items:
        tags = json.loads(ci.tags) if ci.tags else []
        ci_list.append({
            "id": ci.id,
            "name": ci.name,
            "type": ci.type,
            "status": ci.status,
            "ip": ci.ip,
            "cpu": ci.cpu,
            "memory": ci.memory,
            "disk": ci.disk,
            "os": ci.os,
            "project": ci.project,
            "environment": ci.environment,
            "tags": tags,
            "createdAt": ci.created_at.strftime("%Y-%m-%d %H:%M:%S") if ci.created_at else "",
            "updatedAt": ci.updated_at.strftime("%Y-%m-%d %H:%M:%S") if ci.updated_at else "",
        })

    return BaseResponse(data={"items": ci_list, "total": total})


@router.post("", response_model=BaseResponse, status_code=status.HTTP_201_CREATED)
async def create_ci(
    body: CICreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    ci = CI(
        id=str(uuid.uuid4()),
        name=body.name,
        type=body.type,
        ip=body.ip,
        cpu=body.cpu,
        memory=body.memory,
        disk=body.disk,
        os=body.os,
        project=body.project,
        environment=body.environment,
        tags=json.dumps(body.tags) if body.tags else None,
        description=body.description,
    )
    db.add(ci)

    audit = AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user["user_id"],
        username=current_user["username"],
        action="create",
        resource_type="ci",
        resource_id=ci.id,
        resource_name=ci.name,
        new_value=json.dumps(body.model_dump(exclude_none=True), ensure_ascii=False),
    )
    db.add(audit)
    await db.commit()

    return BaseResponse(message="配置项创建成功", data={"id": ci.id})


@router.get("/{ci_id}", response_model=BaseResponse)
async def get_ci(
    ci_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = await db.execute(select(CI).where(CI.id == ci_id))
    ci = result.scalar_one_or_none()
    if not ci:
        raise HTTPException(status_code=404, detail="配置项不存在")

    tags = json.loads(ci.tags) if ci.tags else []
    return BaseResponse(data={
        "id": ci.id,
        "name": ci.name,
        "type": ci.type,
        "status": ci.status,
        "ip": ci.ip,
        "cpu": ci.cpu,
        "memory": ci.memory,
        "disk": ci.disk,
        "os": ci.os,
        "project": ci.project,
        "environment": ci.environment,
        "tags": tags,
        "description": ci.description,
        "createdAt": ci.created_at.strftime("%Y-%m-%d %H:%M:%S") if ci.created_at else "",
        "updatedAt": ci.updated_at.strftime("%Y-%m-%d %H:%M:%S") if ci.updated_at else "",
    })


@router.put("/{ci_id}", response_model=BaseResponse)
async def update_ci(
    ci_id: str,
    body: CIUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = await db.execute(select(CI).where(CI.id == ci_id))
    ci = result.scalar_one_or_none()
    if not ci:
        raise HTTPException(status_code=404, detail="配置项不存在")

    old_value = {
        "name": ci.name, "type": ci.type, "status": ci.status,
        "ip": ci.ip, "cpu": ci.cpu, "memory": ci.memory, "disk": ci.disk,
        "os": ci.os, "project": ci.project, "environment": ci.environment,
    }

    update_data = body.model_dump(exclude_none=True)
    for key, value in update_data.items():
        if key == "tags" and value is not None:
            value = json.dumps(value)
        setattr(ci, key, value)

    audit = AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user["user_id"],
        username=current_user["username"],
        action="update",
        resource_type="ci",
        resource_id=ci.id,
        resource_name=ci.name,
        old_value=json.dumps(old_value, ensure_ascii=False),
        new_value=json.dumps(update_data, ensure_ascii=False),
    )
    db.add(audit)
    await db.commit()

    return BaseResponse(message="配置项更新成功")


@router.delete("/{ci_id}", response_model=BaseResponse)
async def delete_ci(
    ci_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = await db.execute(select(CI).where(CI.id == ci_id))
    ci = result.scalar_one_or_none()
    if not ci:
        raise HTTPException(status_code=404, detail="配置项不存在")

    audit = AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user["user_id"],
        username=current_user["username"],
        action="delete",
        resource_type="ci",
        resource_id=ci.id,
        resource_name=ci.name,
    )
    db.add(audit)
    await db.delete(ci)
    await db.commit()

    return BaseResponse(message="配置项删除成功")
