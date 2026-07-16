from datetime import date

from app.models.account import Account
from app.models.cluster import Cluster
from app.models.financial_record import FinancialRecord
from app.models.project import Project
from app.models.utilization_record import UtilizationRecord


def _seed(db_session):
    cluster = Cluster(name="North America")
    db_session.add(cluster)
    db_session.flush()
    account = Account(name="Acme Corp", cluster_id=cluster.id)
    db_session.add(account)
    db_session.flush()
    project = Project(name="Modernization", account_id=account.id)
    db_session.add(project)
    db_session.flush()
    db_session.add_all(
        [
            FinancialRecord(project_id=project.id, period=date(2026, 1, 1), revenue=100000, cost=70000),
            UtilizationRecord(project_id=project.id, resource_name="Jane", period=date(2026, 1, 1), allocation_pct=90, on_bench=False),
        ]
    )
    db_session.commit()
    return cluster, account, project


def test_list_pnl_requires_authentication(client):
    response = client.get("/pnl")
    assert response.status_code == 401


def test_list_pnl_returns_seeded_rows(authed_client, db_session):
    client, _ = authed_client(role="admin")
    _seed(db_session)

    response = client.get("/pnl")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["data"][0]["project"] == "Modernization"
    assert body["data"][0]["headcount"] == 1


def test_get_pnl_by_id_returns_404_for_unknown_id(authed_client):
    client, _ = authed_client(role="admin")
    response = client.get("/pnl/999")
    assert response.status_code == 404


def test_get_pnl_by_id_returns_row(authed_client, db_session):
    client, _ = authed_client(role="admin")
    _cluster, _account, project = _seed(db_session)
    record_id = db_session.query(FinancialRecord).filter_by(project_id=project.id).first().id

    response = client.get(f"/pnl/{record_id}")
    assert response.status_code == 200
    assert response.json()["data"]["project"] == "Modernization"


def test_summary_kpis(authed_client, db_session):
    client, _ = authed_client(role="admin")
    _seed(db_session)

    response = client.get("/pnl/summary/kpis")
    assert response.status_code == 200
    assert response.json()["revenue"] == 100000.0


def test_summary_revenue_trend(authed_client, db_session):
    client, _ = authed_client(role="admin")
    _seed(db_session)

    response = client.get("/pnl/summary/revenue-trend")
    assert response.status_code == 200
    assert response.json()["data"] == [{"month": "January 2026", "revenue": 100000.0, "cost": 70000.0, "profit": 30000.0}]


def test_summary_revenue_by_cluster(authed_client, db_session):
    client, _ = authed_client(role="admin")
    _seed(db_session)

    response = client.get("/pnl/summary/revenue-by-cluster")
    assert response.status_code == 200
    assert response.json()["data"] == [{"name": "North America", "value": 100000.0}]


def test_summary_margin_by_account(authed_client, db_session):
    client, _ = authed_client(role="admin")
    _seed(db_session)

    response = client.get("/pnl/summary/margin-by-account")
    assert response.status_code == 200
    assert response.json()["data"] == [{"name": "Acme Corp", "margin": 0.3}]


def test_summary_utilization_trend(authed_client, db_session):
    client, _ = authed_client(role="admin")
    _seed(db_session)

    response = client.get("/pnl/summary/utilization-trend")
    assert response.status_code == 200
    assert response.json()["data"] == [{"month": "January 2026", "utilization": 90.0, "headcount": 1}]
