from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True)
    area_director: Mapped[str] = mapped_column(String(200), default="unassigned")

    programs: Mapped[list["Program"]] = relationship(back_populates="account")
