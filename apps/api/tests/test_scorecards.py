from datetime import date

from app.deps import RoleScope
from app.models.account import Account
from app.models.cluster import Cluster
from app.models.financial_record import FinancialRecord
from app.models.project import Project
from app.services.scorecards import project_scorecards


def test_project_scorecards_assigns_rag_status(db_session):
    cluster = Cluster(name="North America")
    db_session.add(cluster)
    db_session.flush()

    account = Account(name="Acme Corp", cluster_id=cluster.id)
    db_session.add(account)
    db_session.flush()

    green = Project(name="Healthy", account_id=account.id)
    red = Project(name="At Risk", account_id=account.id)
    db_session.add_all([green, red])
    db_session.flush()

    db_session.add_all(
        [
            FinancialRecord(project_id=green.id, period=date(2026, 1, 1), revenue=100000, cost=70000),
            FinancialRecord(project_id=red.id, period=date(2026, 1, 1), revenue=100000, cost=95000),
        ]
    )
    db_session.commit()

    results = {r["project_name"]: r for r in project_scorecards(db_session, RoleScope(role="area_director"))}
    assert results["Healthy"]["rag_status"] == "green"
    assert results["At Risk"]["rag_status"] == "red"
