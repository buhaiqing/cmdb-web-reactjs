import uuid
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.change import Change
from app.models.audit import AuditLog
from app.schemas.change import ChangeCreate, ChangeUpdate
from app.schemas.common import BaseResponse

router = APIRouter()


@router.get("", response_model=BaseResponse)
async def list_changes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = None,
    type: str | None = None,
    priority: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    query = select(Change)
    count_query = select(func.count(Change.id))

    if status:
        query = query.where(Change.status == status)
        count_query = count_query.where(Change.status == status)
    if type:
        query = query.where(Change.type == type)
        count_query = count_query.where(Change.type == type)
    if priority:
        query = query.where(Change.priority == priority)
        count_query = count_query.where(Change.priority == priority)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.offset((page - 1) * page_size).limit(page_size).order_by(Change.created_at.desc())
    result = await db.execute(query)
    items = result.scalars().all()

    change_list = []
    for c in items:
        ci_ids = json.loads(c.ci_ids) if c.ci_ids else []
        change_list.append({
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "type": c.type,
            "status": c.status,
            "priority": c.priority,
            "applicantId": c.applicant_id,
            "applicantName": c.applicant_name,
            "assigneeId": c.assignee_id,
            "assigneeName": c.assignee_name,
            "ciIds": ci_ids,
            "plannedStart": c.planned_start.strftime("%Y-%m-%d %H:%M:%S") if c.planned_start else None,
            "plannedEnd": c.planned_end.strftime("%Y-%m-%d %H:%M:%S") if c.planned_end else None,
            "actualStart": c.actual_start.strftime("%Y-%m-%d %H:%M:%S") if c.actual_start else None,
            "actualEnd": c.actual_end.strftime("%Y-%m-%d %H:%M:%S") if c.actual_end else None,
            "result": c.result,
            "createdAt": c.created_at.strftime("%Y-%m-%d %H:%M:%S") if c.created_at else "",
            "updatedAt": c.updated_at.strftime("%Y-%m-%d %H:%M:%S") if c.updated_at else "",
        })

    return BaseResponse(data={"items": change_list, "total": total})


@router.post("", response_model=BaseResponse, status_code=201)
async def create_change(
    body: ChangeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    change = Change(
        id=str(uuid.uuid4()),
        title=body.title,
        description=body.description,
        type=body.type,
        priority=body.priority,
        applicant_id=current_user["user_id"],
        applicant_name=current_user["username"],
        assignee_id=body.assignee_id,
        assignee_name=body.assignee_name,
        ci_ids=json.dumps(body.ci_ids) if body.ci_ids else None,
    )
    db.add(change)
    await db.commit()

    return BaseResponse(message="变更创建成功", data={"id": change.id})


@router.get("/{change_id}", response_model=BaseResponse)
async def get_change(
    change_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = await db.execute(select(Change).where(Change.id == change_id))
    change = result.scalar_one_or_none()
    if not change:
        raise HTTPException(status_code=404, detail="变更不存在")

    ci_ids = json.loads(change.ci_ids) if change.ci_ids else []
    return BaseResponse(data={
        "id": change.id,
        "title": change.title,
        "description": change.description,
        "type": change.type,
        "status": change.status,
        "priority": change.priority,
        "applicantId": change.applicant_id,
        "applicantName": change.applicant_name,
        "assigneeId": change.assignee_id,
        "assigneeName": change.assignee_name,
        "ciIds": ci_ids,
        "plannedStart": change.planned_start.strftime("%Y-%m-%d %H:%M:%S") if change.planned_start else None,
        "plannedEnd": change.planned_end.strftime("%Y-%m-%d %H:%M:%S") if change.planned_end else None,
        "actualStart": change.actual_start.strftime("%Y-%m-%d %H:%M:%S") if change.actual_start else None,
        "actualEnd": change.actual_end.strftime("%Y-%m-%d %H:%M:%S") if change.actual_end else None,
        "result": change.result,
        "createdAt": change.created_at.strftime("%Y-%m-%d %H:%M:%S") if change.created_at else "",
        "updatedAt": change.updated_at.strftime("%Y-%m-%d %H:%M:%S") if change.updated_at else "",
    })


@router.put("/{change_id}", response_model=BaseResponse)
async def update_change(
    change_id: str,
    body: ChangeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = await db.execute(select(Change).where(Change.id == change_id))
    change = result.scalar_one_or_none()
    if not change:
        raise HTTPException(status_code=404, detail="变更不存在")

    update_data = body.model_dump(exclude_none=True)
    for key, value in update_data.items():
        setattr(change, key, value)

    if body.status in ("approved", "rejected"):
        change.actual_start = datetime.now(timezone.utc)
    if body.status == "completed":
        change.actual_end = datetime.now(timezone.utc)

    await db.commit()
    return BaseResponse(message="变更更新成功")


@router.get("/recent", response_model=BaseResponse)
async def get_recent_changes(
    limit: int = Query(5, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """获取最近的变更记录"""
    query = select(Change).order_by(Change.created_at.desc()).limit(limit)
    result = await db.execute(query)
    changes = result.scalars().all()

    recent_changes = []
    for change in changes:
        ci_ids = json.loads(change.ci_ids) if change.ci_ids else []
        recent_changes.append({
            "id": change.id,
            "title": change.title,
            "type": change.type,
            "status": change.status,
            "priority": change.priority,
            "applicantName": change.applicant_name,
            "createdAt": change.created_at.strftime("%Y-%m-%d %H:%M:%S") if change.created_at else "",
        })

    return BaseResponse(data=recent_changes)


@router.delete("/{change_id}", response_model=BaseResponse)
async def delete_change(
    change_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = await db.execute(select(Change).where(Change.id == change_id))
    change = result.scalar_one_or_none()
    if not change:
        raise HTTPException(status_code=404, detail="变更不存在")

    if change.status not in ("pending", "rejected"):
        raise HTTPException(status_code=400, detail="只能删除待审批或已拒绝的变更")

    await db.delete(change)
    await db.commit()
    return BaseResponse(message="变更删除成功")


@router.post("/{change_id}/approve", response_model=BaseResponse)
async def approve_change(
    change_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = await db.execute(select(Change).where(Change.id == change_id))
    change = result.scalar_one_or_none()
    if not change:
        raise HTTPException(status_code=404, detail="变更不存在")

    if change.status != "pending":
        raise HTTPException(status_code=400, detail="只能批准待审批的变更")

    change.status = "approved"
    change.actual_start = datetime.now(timezone.utc)
    await db.commit()

    return BaseResponse(message="变更已批准", data={"id": change.id, "status": "approved"})


@router.post("/{change_id}/reject", response_model=BaseResponse)
async def reject_change(
    change_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = await db.execute(select(Change).where(Change.id == change_id))
    change = result.scalar_one_or_none()
    if not change:
        raise HTTPException(status_code=404, detail="变更不存在")

    if change.status != "pending":
        raise HTTPException(status_code=400, detail="只能拒绝待审批的变更")

    change.status = "rejected"
    await db.commit()

    return BaseResponse(message="变更已拒绝", data={"id": change.id, "status": "rejected"})
