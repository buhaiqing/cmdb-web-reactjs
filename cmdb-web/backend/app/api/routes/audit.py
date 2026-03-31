from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.audit import AuditLog
from app.schemas.common import BaseResponse

router = APIRouter()


@router.get("", response_model=BaseResponse)
async def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    username: str | None = None,
    action: str | None = None,
    resource_type: str | None = None,
    status: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    query = select(AuditLog)
    count_query = select(func.count(AuditLog.id))

    if username:
        query = query.where(AuditLog.username == username)
        count_query = count_query.where(AuditLog.username == username)
    if action:
        query = query.where(AuditLog.action == action)
        count_query = count_query.where(AuditLog.action == action)
    if resource_type:
        query = query.where(AuditLog.resource_type == resource_type)
        count_query = count_query.where(AuditLog.resource_type == resource_type)
    if status:
        query = query.where(AuditLog.status == status)
        count_query = count_query.where(AuditLog.status == status)
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            query = query.where(AuditLog.created_at >= start_dt)
            count_query = count_query.where(AuditLog.created_at >= start_dt)
        except ValueError:
            pass
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            query = query.where(AuditLog.created_at <= end_dt)
            count_query = count_query.where(AuditLog.created_at <= end_dt)
        except ValueError:
            pass

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.offset((page - 1) * page_size).limit(page_size).order_by(AuditLog.created_at.desc())
    result = await db.execute(query)
    items = result.scalars().all()

    action_map = {
        "create": "创建", "update": "更新", "delete": "删除",
        "login": "登录", "logout": "登出", "export": "导出",
        "import": "导入", "approve": "审批", "reject": "拒绝",
    }
    resource_type_map = {
        "ci": "配置项", "change": "变更", "user": "用户",
        "role": "角色", "permission": "权限", "system": "系统",
    }

    log_list = []
    for log in items:
        log_list.append({
            "id": log.id,
            "user": log.username,
            "userId": log.user_id,
            "action": log.action,
            "actionName": action_map.get(log.action, log.action),
            "resource": log.resource_name,
            "resourceType": resource_type_map.get(log.resource_type, log.resource_type or ""),
            "resourceId": log.resource_id,
            "ip": log.ip,
            "userAgent": log.user_agent,
            "status": log.status,
            "details": log.details,
            "oldValue": log.old_value,
            "newValue": log.new_value,
            "createdAt": log.created_at.strftime("%Y-%m-%d %H:%M:%S") if log.created_at else "",
        })

    return BaseResponse(data={"items": log_list, "total": total})


@router.get("/export", response_model=BaseResponse)
async def export_audit_logs(
    username: str | None = None,
    action: str | None = None,
    resource_type: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    query = select(AuditLog)

    if username:
        query = query.where(AuditLog.username == username)
    if action:
        query = query.where(AuditLog.action == action)
    if resource_type:
        query = query.where(AuditLog.resource_type == resource_type)
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            query = query.where(AuditLog.created_at >= start_dt)
        except ValueError:
            pass
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            query = query.where(AuditLog.created_at <= end_dt)
        except ValueError:
            pass

    query = query.order_by(AuditLog.created_at.desc()).limit(1000)
    result = await db.execute(query)
    items = result.scalars().all()

    export_data = []
    for log in items:
        export_data.append({
            "id": log.id,
            "username": log.username,
            "action": log.action,
            "resourceType": log.resource_type,
            "resourceName": log.resource_name,
            "ip": log.ip,
            "status": log.status,
            "createdAt": log.created_at.strftime("%Y-%m-%d %H:%M:%S") if log.created_at else "",
        })

    return BaseResponse(data={"items": export_data, "total": len(export_data)})
