from app.services.ingestion import ingest_financial, ingest_utilization


def test_ingest_financial_creates_records(db_session):
    csv_content = (
        b"account_name,program_name,period,revenue,cost\n"
        b"Acme Corp,Modernization,2026-01-01,100000,70000\n"
    )
    created, errors = ingest_financial(db_session, "data.csv", csv_content)
    assert created == 1
    assert errors == []


def test_ingest_financial_missing_columns(db_session):
    csv_content = b"account_name,program_name\nAcme,Modernization\n"
    created, errors = ingest_financial(db_session, "data.csv", csv_content)
    assert created == 0
    assert "missing columns" in errors[0]["error"]


def test_ingest_utilization_rejects_unknown_program(db_session):
    csv_content = (
        b"program_name,resource_name,period,allocation_pct,on_bench\n"
        b"Unknown Program,Jane Doe,2026-01-01,80,False\n"
    )
    created, errors = ingest_utilization(db_session, "data.csv", csv_content)
    assert created == 0
    assert len(errors) == 1


def test_ingest_financial_malformed_content_returns_structured_error(db_session):
    garbage_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
    created, errors = ingest_financial(db_session, "data.xlsx", garbage_content)
    assert created == 0
    assert len(errors) == 1
    assert errors[0]["row"] == 0
    assert "error" in errors[0]


def test_ingest_utilization_empty_file_returns_structured_error(db_session):
    empty_content = b""
    created, errors = ingest_utilization(db_session, "data.csv", empty_content)
    assert created == 0
    assert len(errors) == 1
    assert errors[0]["row"] == 0
    assert "error" in errors[0]


from app.services.ingestion import (
    insert_financial_records,
    insert_utilization_records,
    parse_financial,
    parse_utilization,
)


def test_parse_financial_returns_rows_without_inserting_records(db_session):
    from app.models.financial_record import FinancialRecord

    csv_content = (
        b"account_name,program_name,period,revenue,cost\n"
        b"Acme Corp,Modernization,2026-01-01,100000,70000\n"
    )
    rows, errors = parse_financial(db_session, "data.csv", csv_content)
    assert errors == []
    assert rows == [{"project_id": rows[0]["project_id"], "period": "2026-01-01", "revenue": 100000.0, "cost": 70000.0}]
    assert db_session.query(FinancialRecord).count() == 0


def test_insert_financial_records_creates_rows_from_parsed_data(db_session):
    from app.models.financial_record import FinancialRecord

    csv_content = (
        b"account_name,program_name,period,revenue,cost\n"
        b"Acme Corp,Modernization,2026-01-01,100000,70000\n"
    )
    rows, _ = parse_financial(db_session, "data.csv", csv_content)
    created = insert_financial_records(db_session, rows)
    assert created == 1
    assert db_session.query(FinancialRecord).count() == 1


def test_parse_utilization_returns_rows_without_inserting_records(db_session):
    from app.models.account import Account
    from app.models.project import Project
    from app.models.utilization_record import UtilizationRecord

    account = Account(name="Acme Corp")
    db_session.add(account)
    db_session.flush()
    project = Project(name="Modernization", account_id=account.id)
    db_session.add(project)
    db_session.commit()

    csv_content = (
        b"program_name,resource_name,period,allocation_pct,on_bench\n"
        b"Modernization,Jane Doe,2026-01-01,80,False\n"
    )
    rows, errors = parse_utilization(db_session, "data.csv", csv_content)
    assert errors == []
    assert rows == [
        {"project_id": project.id, "resource_name": "Jane Doe", "period": "2026-01-01", "allocation_pct": 80.0, "on_bench": False}
    ]
    assert db_session.query(UtilizationRecord).count() == 0


def test_insert_utilization_records_creates_rows_from_parsed_data(db_session):
    from app.models.account import Account
    from app.models.project import Project
    from app.models.utilization_record import UtilizationRecord

    account = Account(name="Acme Corp")
    db_session.add(account)
    db_session.flush()
    project = Project(name="Modernization", account_id=account.id)
    db_session.add(project)
    db_session.commit()

    csv_content = (
        b"program_name,resource_name,period,allocation_pct,on_bench\n"
        b"Modernization,Jane Doe,2026-01-01,80,False\n"
    )
    rows, _ = parse_utilization(db_session, "data.csv", csv_content)
    created = insert_utilization_records(db_session, rows)
    assert created == 1
    assert db_session.query(UtilizationRecord).count() == 1
