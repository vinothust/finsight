from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.deps import CurrentUser, get_current_user
from app.services import pnl as pnl_service
from app.services.pnl_export import export_rows

router = APIRouter(prefix="/pnl", tags=["pnl"])


def _parse_int_list(value: str | None) -> list[int] | None:
    if not value:
        return None
    return [int(v) for v in value.split(",")]


@router.get("")
def list_pnl(
    cluster_ids: str | None = None,
    account_ids: str | None = None,
    project_ids: str | None = None,
    years: str | None = None,
    months: str | None = None,
    min_margin: float | None = None,
    page: int = 1,
    page_size: int = 50,
    sort: str = "period:asc",
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    rows, total = pnl_service.list_pnl_rows(
        db,
        user,
        _parse_int_list(cluster_ids),
        _parse_int_list(account_ids),
        _parse_int_list(project_ids),
        _parse_int_list(years),
        _parse_int_list(months),
        min_margin,
        page,
        page_size,
        sort,
    )
    return {"data": rows, "total": total, "page": page, "page_size": page_size}


@router.get("/summary/kpis")
def summary_kpis(
    cluster_ids: str | None = None,
    account_ids: str | None = None,
    years: str | None = None,
    months: str | None = None,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    return pnl_service.get_kpis(
        db, user, _parse_int_list(cluster_ids), _parse_int_list(account_ids), _parse_int_list(years), _parse_int_list(months)
    )


@router.get("/summary/revenue-trend")
def summary_revenue_trend(
    cluster_ids: str | None = None,
    account_ids: str | None = None,
    project_ids: str | None = None,
    years: str | None = None,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    data = pnl_service.get_revenue_trend(
        db, user, _parse_int_list(cluster_ids), _parse_int_list(account_ids), _parse_int_list(project_ids), _parse_int_list(years)
    )
    return {"data": data}


@router.get("/summary/revenue-by-cluster")
def summary_revenue_by_cluster(
    years: str | None = None,
    months: str | None = None,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    data = pnl_service.get_revenue_by_cluster(db, user, _parse_int_list(years), _parse_int_list(months))
    return {"data": data}


@router.get("/summary/margin-by-account")
def summary_margin_by_account(
    cluster_ids: str | None = None,
    years: str | None = None,
    months: str | None = None,
    limit: int = 10,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    data = pnl_service.get_margin_by_account(
        db, user, _parse_int_list(cluster_ids), _parse_int_list(years), _parse_int_list(months), limit
    )
    return {"data": data}


@router.get("/summary/utilization-trend")
def summary_utilization_trend(
    cluster_ids: str | None = None,
    account_ids: str | None = None,
    years: str | None = None,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    data = pnl_service.get_utilization_trend(db, user, _parse_int_list(cluster_ids), _parse_int_list(account_ids), _parse_int_list(years))
    return {"data": data}


@router.get("/export")
def export_pnl(
    cluster_ids: str | None = None,
    account_ids: str | None = None,
    project_ids: str | None = None,
    format: str = "json",
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    rows, _ = pnl_service.list_pnl_rows(
        db,
        user,
        _parse_int_list(cluster_ids),
        _parse_int_list(account_ids),
        _parse_int_list(project_ids),
        None,
        None,
        None,
        1,
        1_000_000,
        "period:asc",
    )
    if format == "json":
        return {"data": rows}
    return export_rows(rows, format)


@router.get("/{pnl_id}")
def get_pnl(pnl_id: int, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    row = pnl_service.get_pnl_row(db, user, pnl_id)
    if row is None:
        raise HTTPException(status_code=404, detail="pnl record not found")
    return {"data": row}
