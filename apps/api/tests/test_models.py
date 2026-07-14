from datetime import date

from app.models.account import Account
from app.models.cluster import Cluster
from app.models.financial_record import FinancialRecord
from app.models.project import Project


def test_account_project_financial_record_relationship(db_session):
    cluster = Cluster(name="North America")
    db_session.add(cluster)
    db_session.flush()

    account = Account(name="Acme Corp", cluster_id=cluster.id)
    db_session.add(account)
    db_session.flush()

    project = Project(name="Modernization", account_id=account.id)
    db_session.add(project)
    db_session.flush()

    record = FinancialRecord(project_id=project.id, period=date(2026, 1, 1), revenue=100000, cost=70000)
    db_session.add(record)
    db_session.commit()

    assert account.projects[0].name == "Modernization"
    assert account.cluster.name == "North America"
    assert round(record.margin, 2) == 0.3
