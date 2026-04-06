import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.relation import Relation
from app.models.ci import CI
from app.schemas.relation import RelationCreate, RelationUpdate
from app.schemas.common import BaseResponse

router = APIRouter()


@router.get("", response_model=BaseResponse)
async def list_relations(
    ci_id: str | None = None,
    relation_type: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    query = select(Relation)

    if ci_id:
        query = query.where(
            or_(Relation.source_ci_id == ci_id, Relation.target_ci_id == ci_id)
        )
    if relation_type:
        query = query.where(Relation.relation_type == relation_type)

    query = query.order_by(Relation.created_at.desc())
    result = await db.execute(query)
    items = result.scalars().all()

    relation_list = []
    for r in items:
        relation_list.append(
            {
                "id": r.id,
                "sourceCI": r.source_ci_id,
                "targetCI": r.target_ci_id,
                "relationType": r.relation_type,
                "description": r.description,
                "createdAt": r.created_at.strftime("%Y-%m-%d %H:%M:%S")
                if r.created_at
                else "",
                "updatedAt": r.updated_at.strftime("%Y-%m-%d %H:%M:%S")
                if r.updated_at
                else "",
            }
        )

    return BaseResponse(data=relation_list)


@router.post("", response_model=BaseResponse, status_code=201)
async def create_relation(
    body: RelationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    relation = Relation(
        id=str(uuid.uuid4()),
        source_ci_id=body.source_ci_id,
        target_ci_id=body.target_ci_id,
        relation_type=body.relation_type,
        description=body.description,
    )
    db.add(relation)
    await db.commit()

    return BaseResponse(message="关系创建成功", data={"id": relation.id})


@router.get("/graph", response_model=BaseResponse)
async def get_relation_graph(
    ci_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    query = select(Relation)
    if ci_id:
        query = query.where(
            or_(Relation.source_ci_id == ci_id, Relation.target_ci_id == ci_id)
        )

    result = await db.execute(query)
    relations = result.scalars().all()

    ci_ids = set()
    for r in relations:
        ci_ids.add(r.source_ci_id)
        ci_ids.add(r.target_ci_id)

    if ci_id and not ci_ids:
        ci_ids.add(ci_id)

    ci_query = select(CI).where(CI.id.in_(ci_ids))
    ci_result = await db.execute(ci_query)
    cis = ci_result.scalars().all()

    nodes = []
    for ci in cis:
        nodes.append(
            {
                "id": ci.id,
                "name": ci.name,
                "type": ci.type,
                "status": ci.status,
                "ip": ci.ip,
                "project": ci.project,
                "environment": ci.environment,
                "description": ci.description,
            }
        )

    edges = []
    for r in relations:
        edges.append(
            {
                "id": r.id,
                "source": r.source_ci_id,
                "target": r.target_ci_id,
                "relationType": r.relation_type,
                "description": r.description,
            }
        )

    return BaseResponse(data={"nodes": nodes, "edges": edges})


@router.get("/impact/{ci_id}", response_model=BaseResponse)
async def analyze_impact(
    ci_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    upstream_query = select(Relation).where(Relation.target_ci_id == ci_id)
    upstream_result = await db.execute(upstream_query)
    upstream_relations = upstream_result.scalars().all()

    downstream_query = select(Relation).where(Relation.source_ci_id == ci_id)
    downstream_result = await db.execute(downstream_query)
    downstream_relations = downstream_result.scalars().all()

    ci_ids = set()
    for r in upstream_relations:
        ci_ids.add(r.source_ci_id)
    for r in downstream_relations:
        ci_ids.add(r.target_ci_id)

    ci_query = select(CI).where(CI.id.in_(ci_ids))
    ci_result = await db.execute(ci_query)
    cis = ci_result.scalars().all()
    ci_map = {ci.id: ci for ci in cis}

    upstream = []
    for r in upstream_relations:
        if r.source_ci_id in ci_map:
            ci = ci_map[r.source_ci_id]
            upstream.append(
                {
                    "id": ci.id,
                    "name": ci.name,
                    "type": ci.type,
                    "status": ci.status,
                }
            )

    downstream = []
    for r in downstream_relations:
        if r.target_ci_id in ci_map:
            ci = ci_map[r.target_ci_id]
            downstream.append(
                {
                    "id": ci.id,
                    "name": ci.name,
                    "type": ci.type,
                    "status": ci.status,
                }
            )

    direct_relations = []
    all_relations = list(upstream_relations) + list(downstream_relations)
    for r in all_relations:
        direct_relations.append(
            {
                "id": r.id,
                "sourceCI": r.source_ci_id,
                "targetCI": r.target_ci_id,
                "relationType": r.relation_type,
                "description": r.description,
            }
        )

    return BaseResponse(
        data={
            "upstream": upstream,
            "downstream": downstream,
            "directRelations": direct_relations,
        }
    )


@router.get("/{relation_id}", response_model=BaseResponse)
async def get_relation(
    relation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    query = select(Relation).where(Relation.id == relation_id)
    result = await db.execute(query)
    relation = result.scalar_one_or_none()

    if not relation:
        raise HTTPException(status_code=404, detail="关系不存在")

    return BaseResponse(
        data={
            "id": relation.id,
            "sourceCI": relation.source_ci_id,
            "targetCI": relation.target_ci_id,
            "relationType": relation.relation_type,
            "description": relation.description,
            "createdAt": relation.created_at.strftime("%Y-%m-%d %H:%M:%S")
            if relation.created_at
            else "",
            "updatedAt": relation.updated_at.strftime("%Y-%m-%d %H:%M:%S")
            if relation.updated_at
            else "",
        }
    )


@router.put("/{relation_id}", response_model=BaseResponse)
async def update_relation(
    relation_id: str,
    body: RelationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    query = select(Relation).where(Relation.id == relation_id)
    result = await db.execute(query)
    relation = result.scalar_one_or_none()

    if not relation:
        raise HTTPException(status_code=404, detail="关系不存在")

    if body.relation_type is not None:
        relation.relation_type = body.relation_type
    if body.description is not None:
        relation.description = body.description

    await db.commit()

    return BaseResponse(message="关系更新成功")


@router.delete("/{relation_id}", response_model=BaseResponse)
async def delete_relation(
    relation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    query = select(Relation).where(Relation.id == relation_id)
    result = await db.execute(query)
    relation = result.scalar_one_or_none()

    if not relation:
        raise HTTPException(status_code=404, detail="关系不存在")

    await db.delete(relation)
    await db.commit()

    return BaseResponse(message="关系删除成功")
