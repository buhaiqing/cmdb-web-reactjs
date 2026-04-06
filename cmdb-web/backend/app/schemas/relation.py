from datetime import datetime
from pydantic import BaseModel


class RelationCreate(BaseModel):
    source_ci_id: str
    target_ci_id: str
    relation_type: str
    description: str | None = None


class RelationUpdate(BaseModel):
    relation_type: str | None = None
    description: str | None = None


class RelationNode(BaseModel):
    id: str
    name: str
    type: str
    status: str
    ip: str | None = None
    project: str | None = None
    environment: str | None = None
    description: str | None = None


class RelationEdge(BaseModel):
    id: str
    source: str
    target: str
    relation_type: str
    description: str | None = None


class RelationGraphData(BaseModel):
    nodes: list[RelationNode]
    edges: list[RelationEdge]


class ImpactAnalysisResult(BaseModel):
    upstream: list[RelationNode]
    downstream: list[RelationNode]
    direct_relations: list[dict]
