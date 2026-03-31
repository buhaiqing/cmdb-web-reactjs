from pydantic import BaseModel, ConfigDict


class BaseResponse(BaseModel):
    success: bool = True
    message: str = "ok"
    data: dict | None = None
    model_config = ConfigDict(from_attributes=True)


class PaginatedResponse(BaseResponse):
    total: int = 0
    page: int = 1
    page_size: int = 20


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseResponse):
    pass


class UserInfoResponse(BaseResponse):
    pass
