from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class UtilizationRecord(Base):
    __tablename__ = "utilization_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    program_id: Mapped[int] = mapped_column(ForeignKey("programs.id"))
    resource_name: Mapped[str] = mapped_column(String(200))
    period: Mapped[date] = mapped_column(Date)
    allocation_pct: Mapped[float] = mapped_column(Numeric(5, 2))
    on_bench: Mapped[bool] = mapped_column(Boolean, default=False)
