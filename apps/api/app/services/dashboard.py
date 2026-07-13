from collections import defaultdict

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.deps import RoleScope
from app.models.financial_record import FinancialRecord
from app.models.program import Program
from app.models.utilization_record import UtilizationRecord


def _scoped_program_ids(db: Session, scope: RoleScope) -> list[int] | None:
    if scope.role == "area_director":
        return None
    if scope.role == "account_director" and scope.scope_id is not None:
        return [i for (i,) in db.query(Program.id).filter(Program.account_id == scope.scope_id).all()]
    if scope.role == "pm" and scope.scope_id is not None:
        return [scope.scope_id]
    return None


def revenue_margin_summary(db: Session, scope: RoleScope) -> list[dict]:
    program_ids = _scoped_program_ids(db, scope)
    query = (
        db.query(
            FinancialRecord.period,
            func.sum(FinancialRecord.revenue).label("revenue"),
            func.sum(FinancialRecord.cost).label("cost"),
        )
        .group_by(FinancialRecord.period)
        .order_by(FinancialRecord.period)
    )
    if program_ids is not None:
        query = query.filter(FinancialRecord.program_id.in_(program_ids))

    results = []
    for period, revenue, cost in query.all():
        revenue, cost = float(revenue or 0), float(cost or 0)
        margin = (revenue - cost) / revenue if revenue else 0.0
        results.append({"period": period.isoformat(), "revenue": revenue, "cost": cost, "margin": margin})
    return results


def utilization_summary(db: Session, scope: RoleScope) -> list[dict]:
    program_ids = _scoped_program_ids(db, scope)
    query = db.query(UtilizationRecord)
    if program_ids is not None:
        query = query.filter(UtilizationRecord.program_id.in_(program_ids))

    by_period: dict = defaultdict(lambda: {"allocations": [], "bench_count": 0, "total": 0})
    for record in query.all():
        bucket = by_period[record.period]
        bucket["allocations"].append(float(record.allocation_pct))
        bucket["total"] += 1
        if record.on_bench:
            bucket["bench_count"] += 1

    results = []
    for period in sorted(by_period):
        bucket = by_period[period]
        avg_allocation = sum(bucket["allocations"]) / len(bucket["allocations"]) if bucket["allocations"] else 0.0
        bench_pct = bucket["bench_count"] / bucket["total"] if bucket["total"] else 0.0
        results.append({"period": period.isoformat(), "avg_allocation_pct": avg_allocation, "bench_pct": bench_pct})
    return results
