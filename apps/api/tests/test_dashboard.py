from datetime import date

from app.deps import RoleScope
from app.models.account import Account
from app.models.cluster import Cluster
from app.models.financial_record import FinancialRecord
from app.models.project import Project
from app.models.utilization_record import UtilizationRecord
from app.services.dashboard import revenue_margin_summary, utilization_summary


def _seed(db_session):
    cluster = Cluster(name="North America")
    db_session.add(cluster)
    db_session.flush()

    a1 = Account(name="Acme Corp", cluster_id=cluster.id)
    a2 = Account(name="Globex", cluster_id=cluster.id)
    db_session.add_all([a1, a2])
    db_session.flush()

    p1 = Project(name="Modernization", account_id=a1.id)
    p2 = Project(name="Migration", account_id=a2.id)
    db_session.add_all([p1, p2])
    db_session.flush()

    db_session.add_all(
        [
            FinancialRecord(project_id=p1.id, period=date(2026, 1, 1), revenue=100000, cost=70000),
            FinancialRecord(project_id=p2.id, period=date(2026, 1, 1), revenue=50000, cost=40000),
            UtilizationRecord(
                project_id=p1.id, resource_name="Jane", period=date(2026, 1, 1), allocation_pct=90, on_bench=False
            ),
            UtilizationRecord(
                project_id=p2.id, resource_name="John", period=date(2026, 1, 1), allocation_pct=0, on_bench=True
            ),
        ]
    )
    db_session.commit()
    return p1, p2


def test_revenue_margin_summary_aggregates_across_all_projects(db_session):
    _seed(db_session)
    result = revenue_margin_summary(db_session, RoleScope(role="area_director"))
    expected_margin = (150000.0 - 110000.0) / 150000.0
    assert result == [{"period": "2026-01-01", "revenue": 150000.0, "cost": 110000.0, "margin": expected_margin}]


def test_revenue_margin_summary_scoped_to_single_project(db_session):
    p1, _ = _seed(db_session)
    result = revenue_margin_summary(db_session, RoleScope(role="pm", scope_id=p1.id))
    assert result == [{"period": "2026-01-01", "revenue": 100000.0, "cost": 70000.0, "margin": 0.3}]


def test_utilization_summary_computes_bench_pct(db_session):
    _seed(db_session)
    result = utilization_summary(db_session, RoleScope(role="area_director"))
    assert result[0]["bench_pct"] == 0.5
    assert result[0]["avg_allocation_pct"] == 45.0
