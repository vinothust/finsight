import io

import pandas as pd
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.financial_record import FinancialRecord
from app.models.project import Project
from app.models.utilization_record import UtilizationRecord

FINANCIAL_COLUMNS = {"account_name", "program_name", "period", "revenue", "cost"}
UTILIZATION_COLUMNS = {"program_name", "resource_name", "period", "allocation_pct", "on_bench"}


def _read_dataframe(filename: str, content: bytes) -> pd.DataFrame:
    if filename.lower().endswith(".csv"):
        return pd.read_csv(io.BytesIO(content))
    return pd.read_excel(io.BytesIO(content))


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


def ingest_financial(db: Session, filename: str, content: bytes) -> tuple[int, list[dict]]:
    try:
        df = _read_dataframe(filename, content)
    except Exception as exc:  # noqa: BLE001 - malformed/unparseable file, report as structured error
        return 0, [{"row": 0, "error": f"could not parse file: {exc}"}]
    missing = FINANCIAL_COLUMNS - set(df.columns)
    if missing:
        return 0, [{"row": 0, "error": f"missing columns: {sorted(missing)}"}]

    created = 0
    errors: list[dict] = []
    for idx, row in df.iterrows():
        try:
            account = _get_or_create_account(db, str(row["account_name"]))
            project = _get_or_create_project(db, str(row["program_name"]), account)
            db.add(
                FinancialRecord(
                    project_id=project.id,
                    period=pd.to_datetime(row["period"]).date(),
                    revenue=float(row["revenue"]),
                    cost=float(row["cost"]),
                )
            )
            created += 1
        except Exception as exc:  # noqa: BLE001 - collect per-row errors, don't fail the batch
            errors.append({"row": idx + 2, "error": str(exc)})
    db.commit()
    return created, errors


def ingest_utilization(db: Session, filename: str, content: bytes) -> tuple[int, list[dict]]:
    try:
        df = _read_dataframe(filename, content)
    except Exception as exc:  # noqa: BLE001 - malformed/unparseable file, report as structured error
        return 0, [{"row": 0, "error": f"could not parse file: {exc}"}]
    missing = UTILIZATION_COLUMNS - set(df.columns)
    if missing:
        return 0, [{"row": 0, "error": f"missing columns: {sorted(missing)}"}]

    created = 0
    errors: list[dict] = []
    for idx, row in df.iterrows():
        try:
            project = db.query(Project).filter_by(name=str(row["program_name"])).first()
            if project is None:
                raise ValueError(f"unknown program: {row['program_name']}")
            db.add(
                UtilizationRecord(
                    project_id=project.id,
                    resource_name=str(row["resource_name"]),
                    period=pd.to_datetime(row["period"]).date(),
                    allocation_pct=float(row["allocation_pct"]),
                    on_bench=bool(row["on_bench"]),
                )
            )
            created += 1
        except Exception as exc:  # noqa: BLE001
            errors.append({"row": idx + 2, "error": str(exc)})
    db.commit()
    return created, errors
