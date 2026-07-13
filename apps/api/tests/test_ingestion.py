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
