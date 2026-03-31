from pydantic import BaseModel


class ChangeCreate(BaseModel):
    title: str
    description: str | None = None
    type: str
    priority: str = "medium"
    assignee_id: str | None = None
    assignee_name: str | None = None
    ci_ids: list[str] | None = None
    planned_start: str | None = None
    planned_end: str | None = None


class ChangeUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    assignee_id: str | None = None
    assignee_name: str | None = None
    result: str | None = None
