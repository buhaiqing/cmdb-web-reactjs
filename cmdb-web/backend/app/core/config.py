from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "CMDB Backend"
    DATABASE_URL: str = "sqlite+aiosqlite:///./cmdb.db"
    SECRET_KEY: str = "cmdb-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3001"]
    PGDATA_DIR: str = "./pgdata"

    class Config:
        env_file = ".env"


settings = Settings()
