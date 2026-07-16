import calendar

from sqlalchemy import extract
from sqlalchemy.orm import Session

from app.deps import CurrentUser
from app.models.account import Account
from app.models.cluster import Cluster
from app.models.financial_record import FinancialRecord
from app.models.project import Project
from app.models.utilization_record import UtilizationRecord

MONTH_NAMES = list(calendar.month_name)  # index 0 is "", 1-12 are month names


def _row_dict(db: Session, record: FinancialRecord, project: Project, account: Account, cluster: Cluster | None) -> dict:
    revenue = float(record.revenue)
    cost = float(record.cost)
    gross_profit = revenue - cost
    margin = gross_profit / revenue if revenue else 0.0

    util_records = (
        db.query(UtilizationRecord).filter_by(project_id=project.id, period=record.period).all()
    )
    resource_names = {u.resource_name for u in util_records}
    headcount = len(resource_names)
    utilization = (
        sum(float(u.allocation_pct) for u in util_records) / len(util_records) if util_records else 0.0
    )

    return {
        "id": record.id,
        "cluster_id": cluster.id if cluster else None,
        "cluster": cluster.name if cluster else None,
        "account_id": account.id,
        "account": account.name,
        "project_id": project.id,
        "project": project.name,
        "year": record.period.year,
        "month": MONTH_NAMES[record.period.month],
        "revenue": revenue,
        "cost": cost,
        "gross_profit": gross_profit,
        "margin": margin,
        "headcount": headcount,
        "utilization": utilization,
    }


def _all_rows(
    db: Session,
    user: CurrentUser,
    cluster_ids: list[int] | None,
    account_ids: list[int] | None,
    project_ids: list[int] | None,
    years: list[int] | None,
    months: list[int] | None,
) -> list[dict]:
    query = (
        db.query(FinancialRecord, Project, Account, Cluster)
        .join(Project, FinancialRecord.project_id == Project.id)
        .join(Account, Project.account_id == Account.id)
        .outerjoin(Cluster, Account.cluster_id == Cluster.id)
    )
    if user.project_ids is not None:
        query = query.filter(FinancialRecord.project_id.in_(user.project_ids))
    if cluster_ids:
        query = query.filter(Account.cluster_id.in_(cluster_ids))
    if account_ids:
        query = query.filter(Project.account_id.in_(account_ids))
    if project_ids:
        query = query.filter(FinancialRecord.project_id.in_(project_ids))
    if years:
        query = query.filter(extract("year", FinancialRecord.period).in_(years))
    if months:
        query = query.filter(extract("month", FinancialRecord.period).in_(months))

    return [_row_dict(db, record, project, account, cluster) for record, project, account, cluster in query.all()]


def list_pnl_rows(
    db: Session,
    user: CurrentUser,
    cluster_ids: list[int] | None,
    account_ids: list[int] | None,
    project_ids: list[int] | None,
    years: list[int] | None,
    months: list[int] | None,
    min_margin: float | None,
    page: int,
    page_size: int,
    sort: str,
) -> tuple[list[dict], int]:
    rows = _all_rows(db, user, cluster_ids, account_ids, project_ids, years, months)
    if min_margin is not None:
        rows = [r for r in rows if r["margin"] >= min_margin]

    field, _, direction = sort.partition(":")
    reverse = direction == "desc"
    if field == "period":
        rows.sort(key=lambda r: (r["year"], MONTH_NAMES.index(r["month"])), reverse=reverse)
    else:
        rows.sort(key=lambda r: r[field], reverse=reverse)

    total = len(rows)
    start = (page - 1) * page_size
    return rows[start : start + page_size], total


def get_pnl_row(db: Session, user: CurrentUser, record_id: int) -> dict | None:
    record = db.get(FinancialRecord, record_id)
    if record is None:
        return None
    if user.project_ids is not None and record.project_id not in user.project_ids:
        return None
    project = db.get(Project, record.project_id)
    account = db.get(Account, project.account_id)
    cluster = db.get(Cluster, account.cluster_id) if account.cluster_id else None
    return _row_dict(db, record, project, account, cluster)


def get_kpis(
    db: Session,
    user: CurrentUser,
    cluster_ids: list[int] | None,
    account_ids: list[int] | None,
    years: list[int] | None,
    months: list[int] | None,
) -> dict:
    rows = _all_rows(db, user, cluster_ids, account_ids, None, years, months)
    revenue = sum(r["revenue"] for r in rows)
    cost = sum(r["cost"] for r in rows)
    gross_profit = revenue - cost
    margin = gross_profit / revenue if revenue else 0.0
    headcount = sum(r["headcount"] for r in rows)
    utilization = sum(r["utilization"] for r in rows) / len(rows) if rows else 0.0
    revenue_per_head = revenue / headcount if headcount else 0.0
    cost_per_head = cost / headcount if headcount else 0.0
    return {
        "revenue": revenue,
        "cost": cost,
        "gross_profit": gross_profit,
        "margin": margin,
        "headcount": headcount,
        "utilization": utilization,
        "revenue_per_head": revenue_per_head,
        "cost_per_head": cost_per_head,
    }


def get_revenue_trend(
    db: Session,
    user: CurrentUser,
    cluster_ids: list[int] | None,
    account_ids: list[int] | None,
    project_ids: list[int] | None,
    years: list[int] | None,
) -> list[dict]:
    rows = _all_rows(db, user, cluster_ids, account_ids, project_ids, years, None)
    buckets: dict[tuple[int, int], dict] = {}
    for r in rows:
        key = (r["year"], MONTH_NAMES.index(r["month"]))
        bucket = buckets.setdefault(key, {"revenue": 0.0, "cost": 0.0})
        bucket["revenue"] += r["revenue"]
        bucket["cost"] += r["cost"]

    result = []
    for year, month_num in sorted(buckets):
        bucket = buckets[(year, month_num)]
        result.append(
            {
                "month": f"{MONTH_NAMES[month_num]} {year}",
                "revenue": bucket["revenue"],
                "cost": bucket["cost"],
                "profit": bucket["revenue"] - bucket["cost"],
            }
        )
    return result


def get_revenue_by_cluster(
    db: Session, user: CurrentUser, years: list[int] | None, months: list[int] | None
) -> list[dict]:
    rows = _all_rows(db, user, None, None, None, years, months)
    totals: dict[str, float] = {}
    for r in rows:
        name = r["cluster"] or "Unassigned"
        totals[name] = totals.get(name, 0.0) + r["revenue"]
    return [{"name": name, "value": value} for name, value in sorted(totals.items(), key=lambda kv: -kv[1])]


def get_margin_by_account(
    db: Session,
    user: CurrentUser,
    cluster_ids: list[int] | None,
    years: list[int] | None,
    months: list[int] | None,
    limit: int,
) -> list[dict]:
    rows = _all_rows(db, user, cluster_ids, None, None, years, months)
    by_account: dict[str, dict] = {}
    for r in rows:
        bucket = by_account.setdefault(r["account"], {"revenue": 0.0, "cost": 0.0})
        bucket["revenue"] += r["revenue"]
        bucket["cost"] += r["cost"]

    accounts = []
    for name, bucket in by_account.items():
        margin = (bucket["revenue"] - bucket["cost"]) / bucket["revenue"] if bucket["revenue"] else 0.0
        accounts.append({"name": name, "margin": margin, "_revenue": bucket["revenue"]})
    accounts.sort(key=lambda a: -a["_revenue"])
    return [{"name": a["name"], "margin": a["margin"]} for a in accounts[:limit]]


def get_utilization_trend(
    db: Session, user: CurrentUser, cluster_ids: list[int] | None, account_ids: list[int] | None, years: list[int] | None
) -> list[dict]:
    rows = _all_rows(db, user, cluster_ids, account_ids, None, years, None)
    buckets: dict[tuple[int, int], dict] = {}
    for r in rows:
        key = (r["year"], MONTH_NAMES.index(r["month"]))
        bucket = buckets.setdefault(key, {"utilization_sum": 0.0, "headcount": 0, "count": 0})
        bucket["utilization_sum"] += r["utilization"]
        bucket["headcount"] += r["headcount"]
        bucket["count"] += 1

    result = []
    for year, month_num in sorted(buckets):
        bucket = buckets[(year, month_num)]
        avg_utilization = bucket["utilization_sum"] / bucket["count"] if bucket["count"] else 0.0
        result.append(
            {"month": f"{MONTH_NAMES[month_num]} {year}", "utilization": avg_utilization, "headcount": bucket["headcount"]}
        )
    return result
