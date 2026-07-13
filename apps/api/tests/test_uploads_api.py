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
