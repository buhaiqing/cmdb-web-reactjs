from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.common import BaseResponse

router = APIRouter()


@router.get("/stats", response_model=BaseResponse)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    """获取仪表板统计数据"""
    stats = {
        "ci_count": 100,
        "change_count": 20,
        "user_count": 15,
        "recent_changes": 5
    }
    return BaseResponse(
        code=200,
        message="获取仪表板统计数据成功",
        data=stats
    )
