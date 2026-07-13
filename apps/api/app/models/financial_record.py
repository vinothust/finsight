from datetime import date

from sqlalchemy import Date, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class FinancialRecord(Base):
    __tablename__ = "financial_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    program_id: Mapped[int] = mapped_column(ForeignKey("programs.id"))
    period: Mapped[date] = mapped_column(Date)
    revenue: Mapped[float] = mapped_column(Numeric(14, 2))
    cost: Mapped[float] = mapped_column(Numeric(14, 2))

    @property
    def margin(self) -> float:
        if not self.revenue:
            return 0.0
        return (float(self.revenue) - float(self.cost)) / float(self.revenue)
