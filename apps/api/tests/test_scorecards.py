from datetime import date

from app.deps import RoleScope
from app.models.account import Account
from app.models.financial_record import FinancialRecord
from app.models.program import Program
from app.services.scorecards import program_scorecards


def test_program_scorecards_assigns_rag_status(db_session):
    account = Account(name="Acme Corp")
    db_session.add(account)
    db_session.flush()

    green = Program(name="Healthy", account_id=account.id)
    red = Program(name="At Risk", account_id=account.id)
    db_session.add_all([green, red])
    db_session.flush()

    db_session.add_all(
        [
            FinancialRecord(program_id=green.id, period=date(2026, 1, 1), revenue=100000, cost=70000),
            FinancialRecord(program_id=red.id, period=date(2026, 1, 1), revenue=100000, cost=95000),
        ]
    )
    db_session.commit()

    results = {r["program_name"]: r for r in program_scorecards(db_session, RoleScope(role="area_director"))}
    assert results["Healthy"]["rag_status"] == "green"
    assert results["At Risk"]["rag_status"] == "red"
