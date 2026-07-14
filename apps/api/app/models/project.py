from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id"))
    status: Mapped[str] = mapped_column(String(30), default="active")

    account: Mapped["Account"] = relationship(back_populates="projects")
