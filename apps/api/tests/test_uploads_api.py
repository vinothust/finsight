def test_upload_financial_endpoint(client):
    csv_content = (
        b"account_name,program_name,period,revenue,cost\n"
        b"Acme Corp,Modernization,2026-01-01,100000,70000\n"
    )
    response = client.post(
        "/uploads?dataset=financial",
        files={"file": ("data.csv", csv_content, "text/csv")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["created_rows"] == 1
    assert body["errors"] == []


def test_upload_unknown_dataset_returns_400(client):
    response = client.post(
        "/uploads?dataset=bogus",
        files={"file": ("data.csv", b"x", "text/csv")},
    )
    assert response.status_code == 400


def test_preview_financial_upload_creates_no_financial_records(client):
    csv_content = (
        b"account_name,program_name,period,revenue,cost\n"
        b"Acme Corp,Modernization,2026-01-01,100000,70000\n"
    )
    response = client.post(
        "/uploads/financial/preview",
        files={"file": ("data.csv", csv_content, "text/csv")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["row_count"] == 1
    assert body["errors"] == []
    assert "upload_id" in body


def test_commit_after_preview_inserts_financial_records(client, db_session):
    from app.models.financial_record import FinancialRecord

    csv_content = (
        b"account_name,program_name,period,revenue,cost\n"
        b"Acme Corp,Modernization,2026-01-01,100000,70000\n"
    )
    preview_response = client.post(
        "/uploads/financial/preview",
        files={"file": ("data.csv", csv_content, "text/csv")},
    )
    upload_id = preview_response.json()["upload_id"]
    assert db_session.query(FinancialRecord).count() == 0

    commit_response = client.post(f"/uploads/{upload_id}/commit")
    assert commit_response.status_code == 200
    body = commit_response.json()
    assert body["success"] is True
    assert body["rows_inserted"] == 1
    assert db_session.query(FinancialRecord).count() == 1


def test_double_commit_returns_409(client):
    csv_content = (
        b"account_name,program_name,period,revenue,cost\n"
        b"Acme Corp,Modernization,2026-01-01,100000,70000\n"
    )
    preview_response = client.post(
        "/uploads/financial/preview",
        files={"file": ("data.csv", csv_content, "text/csv")},
    )
    upload_id = preview_response.json()["upload_id"]
    client.post(f"/uploads/{upload_id}/commit")

    second_commit = client.post(f"/uploads/{upload_id}/commit")
    assert second_commit.status_code == 409


def test_get_upload_by_id_reflects_pending_then_committed_status(client):
    csv_content = (
        b"account_name,program_name,period,revenue,cost\n"
        b"Acme Corp,Modernization,2026-01-01,100000,70000\n"
    )
    preview_response = client.post(
        "/uploads/financial/preview",
        files={"file": ("data.csv", csv_content, "text/csv")},
    )
    upload_id = preview_response.json()["upload_id"]

    pending = client.get(f"/uploads/{upload_id}")
    assert pending.json()["status"] == "pending_commit"

    client.post(f"/uploads/{upload_id}/commit")

    committed = client.get(f"/uploads/{upload_id}")
    assert committed.json()["status"] == "committed"


def test_preview_unknown_dataset_returns_400(client):
    response = client.post(
        "/uploads/bogus/preview",
        files={"file": ("data.csv", b"x", "text/csv")},
    )
    assert response.status_code == 400


def test_commit_unknown_upload_returns_404(client):
    response = client.post("/uploads/999/commit")
    assert response.status_code == 404
