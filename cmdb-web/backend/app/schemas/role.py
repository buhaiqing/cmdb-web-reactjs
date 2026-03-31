from pydantic import BaseModel, ConfigDict


class RoleCreate(BaseModel):
    name: str
    code: str
    description: str | None = None
    permissions: list[str] | None = None


class RoleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    permissions: list[str] | None = None
    is_active: bool | None = None


class RoleOut(BaseModel):
    id: str
    name: str
    code: str
    description: str | None = None
    user_count: int = 0
    created_at: str

    model_config = ConfigDict(from_attributes=True)
