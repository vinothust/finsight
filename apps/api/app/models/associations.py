from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class ClusterHead(Base):
    __tablename__ = "cluster_heads"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    cluster_id: Mapped[int] = mapped_column(ForeignKey("clusters.id"), primary_key=True)


class AccountDirector(Base):
    __tablename__ = "account_directors"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id"), primary_key=True)


class ProjectManager(Base):
    __tablename__ = "project_managers"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), primary_key=True)
