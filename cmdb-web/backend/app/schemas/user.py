from pydantic import BaseModel, ConfigDict, EmailStr


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role_id: str | None = None


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    role_id: str | None = None
    is_active: bool | None = None


class UserOut(BaseModel):
    id: str
    username: str
    email: str
    role: str | None = None
    status: str
    created_at: str

    model_config = ConfigDict(from_attributes=True)


class UserListResponse(BaseModel):
    success: bool = True
    data: dict
