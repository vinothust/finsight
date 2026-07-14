from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True)
    cluster_id: Mapped[int | None] = mapped_column(ForeignKey("clusters.id"), default=None)

    cluster: Mapped["Cluster | None"] = relationship(back_populates="accounts")
    projects: Mapped[list["Project"]] = relationship(back_populates="account")
