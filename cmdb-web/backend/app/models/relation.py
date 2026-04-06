from datetime import datetime

from sqlalchemy import String, Text, DateTime, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Relation(Base):
    __tablename__ = "relations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    source_ci_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("configuration_items.id"), nullable=False, index=True
    )
    target_ci_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("configuration_items.id"), nullable=False, index=True
    )
    relation_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
