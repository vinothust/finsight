from datetime import date

from app.deps import CurrentUser
from app.models.account import Account
from app.models.cluster import Cluster
from app.models.financial_record import FinancialRecord
from app.models.project import Project
from app.models.utilization_record import UtilizationRecord
from app.services import pnl


def _seed(db_session):
    cluster = Cluster(name="North America")
    db_session.add(cluster)
    db_session.flush()
    account = Account(name="Acme Corp", cluster_id=cluster.id)
    db_session.add(account)
    db_session.flush()
    p1 = Project(name="Modernization", account_id=account.id)
    p2 = Project(name="Migration", account_id=account.id)
    db_session.add_all([p1, p2])
    db_session.flush()

    db_session.add_all(
        [
            FinancialRecord(project_id=p1.id, period=date(2026, 1, 1), revenue=100000, cost=70000),
            FinancialRecord(project_id=p2.id, period=date(2026, 2, 1), revenue=50000, cost=45000),
            UtilizationRecord(project_id=p1.id, resource_name="Jane", period=date(2026, 1, 1), allocation_pct=90, on_bench=False),
            UtilizationRecord(project_id=p1.id, resource_name="John", period=date(2026, 1, 1), allocation_pct=80, on_bench=False),
        ]
    )
    db_session.commit()
    return cluster, account, p1, p2


ADMIN = CurrentUser(id=1, email="admin@test.dev", name="Admin", role="admin", project_ids=None)


def test_list_pnl_rows_computes_margin_and_headcount(db_session):
    _seed(db_session)
    rows, total = pnl.list_pnl_rows(db_session, ADMIN, None, None, None, None, None, None, 1, 50, "period:asc")
    assert total == 2
    jan_row = rows[0]
    assert jan_row["revenue"] == 100000.0
    assert jan_row["margin"] == 0.3
    assert jan_row["headcount"] == 2
    assert jan_row["utilization"] == 85.0
    assert jan_row["cluster"] == "North America"
    assert jan_row["account"] == "Acme Corp"
    assert jan_row["project"] == "Modernization"
    assert jan_row["year"] == 2026
    assert jan_row["month"] == "January"


def test_list_pnl_rows_row_with_no_utilization_has_zero_headcount(db_session):
    _seed(db_session)
    rows, _ = pnl.list_pnl_rows(db_session, ADMIN, None, None, None, None, None, None, 1, 50, "period:asc")
    feb_row = rows[1]
    assert feb_row["headcount"] == 0
    assert feb_row["utilization"] == 0.0


def test_list_pnl_rows_filters_by_min_margin(db_session):
    _seed(db_session)
    rows, total = pnl.list_pnl_rows(db_session, ADMIN, None, None, None, None, None, 0.2, 1, 50, "period:asc")
    assert total == 1
    assert rows[0]["project"] == "Modernization"


def test_list_pnl_rows_scopes_to_project_manager(db_session):
    _cluster, _account, p1, _p2 = _seed(db_session)
    pm = CurrentUser(id=2, email="pm@test.dev", name="PM", role="project_manager", project_ids=[p1.id])
    rows, total = pnl.list_pnl_rows(db_session, pm, None, None, None, None, None, None, 1, 50, "period:asc")
    assert total == 1
    assert rows[0]["project"] == "Modernization"


def test_list_pnl_rows_sorts_by_revenue_desc(db_session):
    _seed(db_session)
    rows, _ = pnl.list_pnl_rows(db_session, ADMIN, None, None, None, None, None, None, 1, 50, "revenue:desc")
    assert [r["revenue"] for r in rows] == [100000.0, 50000.0]


def test_list_pnl_rows_paginates(db_session):
    _seed(db_session)
    rows, total = pnl.list_pnl_rows(db_session, ADMIN, None, None, None, None, None, None, 1, 1, "period:asc")
    assert total == 2
    assert len(rows) == 1


def test_get_pnl_row_returns_none_for_out_of_scope_record(db_session):
    _cluster, _account, p1, _p2 = _seed(db_session)
    pm = CurrentUser(id=2, email="pm@test.dev", name="PM", role="project_manager", project_ids=[p1.id])
    rows, _ = pnl.list_pnl_rows(db_session, ADMIN, None, None, None, None, None, None, 1, 50, "period:asc")
    p2_record_id = next(r["id"] for r in rows if r["project"] == "Migration")
    assert pnl.get_pnl_row(db_session, pm, p2_record_id) is None


def test_get_kpis_aggregates_across_rows(db_session):
    _seed(db_session)
    kpis = pnl.get_kpis(db_session, ADMIN, None, None, None, None)
    assert kpis["revenue"] == 150000.0
    assert kpis["cost"] == 115000.0
    assert kpis["headcount"] == 2
    assert round(kpis["revenue_per_head"], 2) == 75000.0


def test_get_revenue_trend_groups_by_month(db_session):
    _seed(db_session)
    trend = pnl.get_revenue_trend(db_session, ADMIN, None, None, None, None)
    assert trend == [
        {"month": "January 2026", "revenue": 100000.0, "cost": 70000.0, "profit": 30000.0},
        {"month": "February 2026", "revenue": 50000.0, "cost": 45000.0, "profit": 5000.0},
    ]


def test_get_revenue_by_cluster_sums_revenue_per_cluster(db_session):
    _seed(db_session)
    result = pnl.get_revenue_by_cluster(db_session, ADMIN, None, None)
    assert result == [{"name": "North America", "value": 150000.0}]


def test_get_margin_by_account_ranks_by_revenue(db_session):
    _seed(db_session)
    result = pnl.get_margin_by_account(db_session, ADMIN, None, None, None, 10)
    assert result == [{"name": "Acme Corp", "margin": (150000.0 - 115000.0) / 150000.0}]


def test_get_utilization_trend_groups_by_month(db_session):
    _seed(db_session)
    trend = pnl.get_utilization_trend(db_session, ADMIN, None, None, None)
    assert trend[0] == {"month": "January 2026", "utilization": 85.0, "headcount": 2}
    assert trend[1] == {"month": "February 2026", "utilization": 0.0, "headcount": 0}
