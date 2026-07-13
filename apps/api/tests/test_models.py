from datetime import date

from app.models.account import Account
from app.models.financial_record import FinancialRecord
from app.models.program import Program


def test_account_program_financial_record_relationship(db_session):
    account = Account(name="Acme Corp", area_director="Jane Doe")
    db_session.add(account)
    db_session.flush()

    program = Program(name="Modernization", account_id=account.id, program_manager="John Smith")
    db_session.add(program)
    db_session.flush()

    record = FinancialRecord(program_id=program.id, period=date(2026, 1, 1), revenue=100000, cost=70000)
    db_session.add(record)
    db_session.commit()

    assert account.programs[0].name == "Modernization"
    assert round(record.margin, 2) == 0.3
