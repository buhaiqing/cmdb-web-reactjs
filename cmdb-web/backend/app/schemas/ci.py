from pydantic import BaseModel, ConfigDict


class CICreate(BaseModel):
    name: str
    type: str
    ip: str | None = None
    cpu: str | None = None
    memory: str | None = None
    disk: str | None = None
    os: str | None = None
    project: str | None = None
    environment: str | None = None
    tags: list[str] | None = None
    description: str | None = None


class CIUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    status: str | None = None
    ip: str | None = None
    cpu: str | None = None
    memory: str | None = None
    disk: str | None = None
    os: str | None = None
    project: str | None = None
    environment: str | None = None
    tags: list[str] | None = None
    description: str | None = None


class CIOut(BaseModel):
    id: str
    name: str
    type: str
    status: str
    ip: str | None = None
    cpu: str | None = None
    memory: str | None = None
    disk: str | None = None
    os: str | None = None
    project: str | None = None
    environment: str | None = None
    tags: list[str] | None = None
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)
