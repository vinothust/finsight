import csv
import io

import pytest

from app.services.pnl_export import EXPORT_COLUMNS, export_rows

SAMPLE_ROWS = [
    {
        "id": 1,
        "cluster_id": 1,
        "cluster": "North America",
        "account_id": 1,
        "account": "Acme Corp",
        "project_id": 1,
        "project": "Modernization",
        "year": 2026,
        "month": "January",
        "revenue": 100000.0,
        "cost": 70000.0,
        "gross_profit": 30000.0,
        "margin": 0.3,
        "headcount": 2,
        "utilization": 85.0,
    }
]


def test_export_csv_contains_header_and_row():
    response = export_rows(SAMPLE_ROWS, "csv")
    text = response.body.decode()
    reader = csv.reader(io.StringIO(text))
    rows = list(reader)
    assert rows[0] == EXPORT_COLUMNS
    assert rows[1][EXPORT_COLUMNS.index("project")] == "Modernization"


def test_export_xlsx_returns_binary_content_with_correct_media_type():
    response = export_rows(SAMPLE_ROWS, "xlsx")
    assert response.media_type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    assert len(response.body) > 0


def test_export_rejects_unsupported_format():
    with pytest.raises(ValueError):
        export_rows(SAMPLE_ROWS, "pdf")
