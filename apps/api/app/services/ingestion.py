import io
from datetime import date

import pandas as pd
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.financial_record import FinancialRecord
from app.models.project import Project
from app.models.utilization_record import UtilizationRecord
from app.services.hc_pnl_ingestion import is_hc_pnl_workbook, parse_hc_pnl_financial, parse_hc_pnl_utilization

FINANCIAL_COLUMNS = {"account_name", "program_name", "period", "revenue", "cost"}
UTILIZATION_COLUMNS = {"program_name", "resource_name", "period", "allocation_pct", "on_bench"}


def _read_dataframe(filename: str, content: bytes, dataset: str | None = None) -> pd.DataFrame:
    if filename.lower().endswith(".csv"):
        return pd.read_csv(io.BytesIO(content))
    if dataset and is_hc_pnl_workbook(filename, content):
        return parse_hc_pnl_financial(content) if dataset == "financial" else parse_hc_pnl_utilization(content)
    return pd.read_excel(io.BytesIO(content))


def get_columns(filename: str, content: bytes, dataset: str | None = None) -> list[str]:
    return list(_read_dataframe(filename, content, dataset).columns)


def _get_or_create_account(db: Session, name: str) -> Account:
    account = db.query(Account).filter_by(name=name).first()
    if account is None:
        account = Account(name=name)
        db.add(account)
        db.flush()
    return account


def _get_or_create_project(db: Session, name: str, account: Account) -> Project:
    project = db.query(Project).filter_by(name=name, account_id=account.id).first()
    if project is None:
        project = Project(name=name, account_id=account.id)
        db.add(project)
        db.flush()
    return project


def parse_financial(
    db: Session, filename: str, content: bytes, column_mapping: dict[str, str] | None = None
) -> tuple[list[dict], list[dict]]:
    try:
        df = _read_dataframe(filename, content, dataset="financial")
    except Exception as exc:  # noqa: BLE001 - malformed/unparseable file, report as structured error
        return [], [{"row": 0, "error": f"could not parse file: {exc}"}]

    if column_mapping:
        rename = {source: canonical for canonical, source in column_mapping.items() if source}
        df = df.rename(columns=rename)

    missing = FINANCIAL_COLUMNS - set(df.columns)
    if missing:
        return [], [{"row": 0, "error": f"missing columns: {sorted(missing)}"}]

    rows: list[dict] = []
    errors: list[dict] = []
    for idx, row in df.iterrows():
        try:
            account = _get_or_create_account(db, str(row["account_name"]))
            project = _get_or_create_project(db, str(row["program_name"]), account)
            rows.append(
                {
                    "project_id": project.id,
                    "period": pd.to_datetime(row["period"]).date().isoformat(),
                    "revenue": float(row["revenue"]),
                    "cost": float(row["cost"]),
                }
            )
        except Exception as exc:  # noqa: BLE001 - collect per-row errors, don't fail the batch
            errors.append({"row": idx + 2, "error": str(exc)})
    db.commit()  # commits get_or_create'd accounts/projects even if some rows errored
    return rows, errors


def insert_financial_records(db: Session, rows: list[dict]) -> int:
    for row in rows:
        db.add(
            FinancialRecord(
                project_id=row["project_id"],
                period=date.fromisoformat(row["period"]),
                revenue=row["revenue"],
                cost=row["cost"],
            )
        )
    db.commit()
    return len(rows)


def ingest_financial(
    db: Session, filename: str, content: bytes, column_mapping: dict[str, str] | None = None
) -> tuple[int, list[dict]]:
    rows, errors = parse_financial(db, filename, content, column_mapping=column_mapping)
    created = insert_financial_records(db, rows)
    return created, errors


def parse_utilization(
    db: Session, filename: str, content: bytes, column_mapping: dict[str, str] | None = None
) -> tuple[list[dict], list[dict]]:
    try:
        df = _read_dataframe(filename, content, dataset="utilization")
    except Exception as exc:  # noqa: BLE001 - malformed/unparseable file, report as structured error
        return [], [{"row": 0, "error": f"could not parse file: {exc}"}]

    if column_mapping:
        rename = {source: canonical for canonical, source in column_mapping.items() if source}
        df = df.rename(columns=rename)

    missing = UTILIZATION_COLUMNS - set(df.columns)
    if missing:
        return [], [{"row": 0, "error": f"missing columns: {sorted(missing)}"}]

    rows: list[dict] = []
    errors: list[dict] = []
    for idx, row in df.iterrows():
        try:
            project = db.query(Project).filter_by(name=str(row["program_name"])).first()
            if project is None:
                raise ValueError(f"unknown program: {row['program_name']}")
            rows.append(
                {
                    "project_id": project.id,
                    "resource_name": str(row["resource_name"]),
                    "period": pd.to_datetime(row["period"]).date().isoformat(),
                    "allocation_pct": float(row["allocation_pct"]),
                    "on_bench": bool(row["on_bench"]),
                }
            )
        except Exception as exc:  # noqa: BLE001
            errors.append({"row": idx + 2, "error": str(exc)})
    return rows, errors


def insert_utilization_records(db: Session, rows: list[dict]) -> int:
    for row in rows:
        db.add(
            UtilizationRecord(
                project_id=row["project_id"],
                resource_name=row["resource_name"],
                period=date.fromisoformat(row["period"]),
                allocation_pct=row["allocation_pct"],
                on_bench=row["on_bench"],
            )
        )
    db.commit()
    return len(rows)


def ingest_utilization(
    db: Session, filename: str, content: bytes, column_mapping: dict[str, str] | None = None
) -> tuple[int, list[dict]]:
    rows, errors = parse_utilization(db, filename, content, column_mapping=column_mapping)
    created = insert_utilization_records(db, rows)
    return created, errors
