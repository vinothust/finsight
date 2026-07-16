from datetime import date

from app.deps import CurrentUser
from app.models.account import Account
from app.models.cluster import Cluster
from app.models.financial_record import FinancialRecord
from app.models.project import Project
from app.models.utilization_record import UtilizationRecord
from app.services import ai_insights

ADMIN = CurrentUser(id=1, email="admin@test.dev", name="Admin", role="admin", project_ids=None)


class FakeClient:
    def complete(self, prompt, system=None, tier="simple"):
        return "Revenue grew steadily."


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
            FinancialRecord(project_id=project.id, period=date(2026, 2, 1), revenue=120000, cost=72000),
            UtilizationRecord(project_id=project.id, resource_name="Jane", period=date(2026, 1, 1), allocation_pct=80, on_bench=False),
            UtilizationRecord(project_id=project.id, resource_name="Jane", period=date(2026, 2, 1), allocation_pct=90, on_bench=False),
        ]
    )
    db_session.commit()


def test_generate_insights_returns_three_cards_by_default(db_session, monkeypatch):
    _seed(db_session)
    monkeypatch.setattr(ai_insights, "get_llm_client", lambda db: FakeClient())

    insights = ai_insights.generate_insights(db_session, ADMIN, None, None, None, None, None)
    assert [i["metric"] for i in insights] == ["revenue", "margin", "utilization"]
    assert all(i["description"] for i in insights)


def test_generate_insights_computes_revenue_change(db_session, monkeypatch):
    _seed(db_session)
    monkeypatch.setattr(ai_insights, "get_llm_client", lambda db: FakeClient())

    insights = ai_insights.generate_insights(db_session, ADMIN, None, None, None, None, "revenue")
    assert len(insights) == 1
    assert insights[0]["change"] == (120000.0 - 100000.0) / 100000.0


def test_generate_insights_computes_utilization_change(db_session, monkeypatch):
    _seed(db_session)
    monkeypatch.setattr(ai_insights, "get_llm_client", lambda db: FakeClient())

    insights = ai_insights.generate_insights(db_session, ADMIN, None, None, None, None, "utilization")
    assert insights[0]["change"] == 90.0 - 80.0


def test_generate_insights_change_is_zero_with_single_period(db_session, monkeypatch):
    account = Account(name="Solo Corp")
    db_session.add(account)
    db_session.flush()
    project = Project(name="Solo Project", account_id=account.id)
    db_session.add(project)
    db_session.flush()
    db_session.add(FinancialRecord(project_id=project.id, period=date(2026, 1, 1), revenue=50000, cost=40000))
    db_session.commit()

    monkeypatch.setattr(ai_insights, "get_llm_client", lambda db: FakeClient())
    insights = ai_insights.generate_insights(db_session, ADMIN, None, None, None, None, "revenue")
    assert insights[0]["change"] == 0.0
