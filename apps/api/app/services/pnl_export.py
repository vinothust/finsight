import io

import pandas as pd
from fastapi import Response

EXPORT_COLUMNS = [
    "id",
    "cluster_id",
    "cluster",
    "account_id",
    "account",
    "project_id",
    "project",
    "year",
    "month",
    "revenue",
    "cost",
    "gross_profit",
    "margin",
    "headcount",
    "utilization",
]

FINANCIAL_TEMPLATE_COLUMNS = ["account_name", "program_name", "period", "revenue", "cost"]
UTILIZATION_TEMPLATE_COLUMNS = ["program_name", "resource_name", "period", "allocation_pct", "on_bench"]

XLSX_MEDIA_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


def export_rows(rows: list[dict], fmt: str) -> Response:
    df = pd.DataFrame(rows, columns=EXPORT_COLUMNS)
    buffer = io.BytesIO()
    if fmt == "csv":
        df.to_csv(buffer, index=False)
        media_type, filename = "text/csv", "pnl_export.csv"
    elif fmt == "xlsx":
        df.to_excel(buffer, index=False)
        media_type, filename = XLSX_MEDIA_TYPE, "pnl_export.xlsx"
    else:
        raise ValueError(f"unsupported export format: {fmt}")

    buffer.seek(0)
    return Response(
        content=buffer.getvalue(),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


def build_template(columns: list[str], filename: str) -> Response:
    df = pd.DataFrame(columns=columns)
    buffer = io.BytesIO()
    df.to_excel(buffer, index=False)
    buffer.seek(0)
    return Response(
        content=buffer.getvalue(),
        media_type=XLSX_MEDIA_TYPE,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
