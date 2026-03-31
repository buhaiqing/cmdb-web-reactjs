from datetime import datetime

from sqlalchemy import String, Text, Integer, Float, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class CI(Base):
    __tablename__ = "configuration_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), default="active", index=True)
    ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    cpu: Mapped[str | None] = mapped_column(String(50), nullable=True)
    memory: Mapped[str | None] = mapped_column(String(50), nullable=True)
    disk: Mapped[str | None] = mapped_column(String(50), nullable=True)
    os: Mapped[str | None] = mapped_column(String(100), nullable=True)
    project: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    environment: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    tags: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
