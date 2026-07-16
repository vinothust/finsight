from datetime import datetime

from sqlalchemy import JSON, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class Upload(Base):
    __tablename__ = "uploads"

    id: Mapped[int] = mapped_column(primary_key=True)
    filename: Mapped[str] = mapped_column(String(300))
    dataset: Mapped[str | None] = mapped_column(String(30), default=None)
    status: Mapped[str] = mapped_column(String(30), default="processed")
    row_errors: Mapped[list] = mapped_column(JSON, default=list)
    preview: Mapped[list | None] = mapped_column(JSON, default=None)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    committed_at: Mapped[datetime | None] = mapped_column(DateTime, default=None)
