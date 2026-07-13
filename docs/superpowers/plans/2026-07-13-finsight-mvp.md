# FinSight MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the FinSight MVP — a FastAPI + PostgreSQL backend and a Vite/React/Tailwind/Radix frontend delivering revenue/margin dashboards, utilization tracking, RAG health scorecards, AI narrative insights, and an NL2SQL "Ask FinSight" query agent, scoped by a no-auth role switcher (PM / Account Director / Area Director).

**Architecture:** Monorepo with plain folder split — `apps/api` (FastAPI, SQLAlchemy 2.0, service-layer business logic, router-layer HTTP) and `apps/web` (Vite + React + TS, Tailwind + Radix UI, Recharts for charts). Role scoping is done via `X-Role`/`X-Scope-Id` headers, no real auth. LLM access goes through a provider-agnostic client interface (Anthropic default, OpenAI alternative) used by both the insights narrative feature and the NL2SQL agent.

**Tech Stack:** Python 3.11+, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, pandas/openpyxl, pytest, httpx; Node 20+, Vite, React 18, TypeScript, TailwindCSS, Radix UI, Recharts, react-router-dom, Vitest + React Testing Library.

## Global Constraints

- No authentication in MVP — role scoping via `X-Role` (`pm`|`account_director`|`area_director`) and optional `X-Scope-Id` headers only.
- NL2SQL agent MUST reject any non-`SELECT` SQL before execution (guard against INSERT/UPDATE/DELETE/DROP/ALTER/CREATE/TRUNCATE/ATTACH/stacked statements).
- LLM provider must be pluggable via `LLM_PROVIDER` env var (`anthropic` default, `openai` alternative) — no hardcoded provider calls outside `app/core/llm/`.
- Production DB is PostgreSQL; tests use in-memory SQLite via dependency override — no test requires a running Postgres instance.
- Charts use Recharts exclusively.
- Frontend layout/styling decisions during page-building tasks should apply the `ui-ux-pro-max` skill's guidance (palette, spacing, chart styling) rather than ad-hoc choices.
- Monorepo has no shared build tool — `apps/api` and `apps/web` each manage their own dependencies independently.

---

## Task 1: Backend Project Scaffold

**Files:**
- Create: `apps/api/requirements.txt`
- Create: `apps/api/app/__init__.py`
- Create: `apps/api/app/core/__init__.py`
- Create: `apps/api/app/core/config.py`
- Create: `apps/api/app/core/db.py`
- Create: `apps/api/app/main.py`
- Create: `apps/api/tests/__init__.py`
- Create: `apps/api/tests/conftest.py`
- Test: `apps/api/tests/test_health.py`

**Interfaces:**
- Produces: `settings` (module-level `Settings` instance, `app/core/config.py`) with fields `database_url: str`, `llm_provider: str`, `anthropic_api_key: str`, `openai_api_key: str`
- Produces: `Base` (SQLAlchemy `DeclarativeBase`, `app/core/db.py`), `get_db()` generator dependency, `engine`, `SessionLocal`
- Produces: `app` (FastAPI instance, `app/main.py`)
- Produces: pytest fixtures `db_session`, `client` (`tests/conftest.py`) — used by every later backend task

- [ ] **Step 1: Create requirements.txt**

```text
fastapi==0.115.0
uvicorn[standard]==0.32.0
sqlalchemy==2.0.35
psycopg[binary]==3.2.3
alembic==1.13.3
pydantic==2.9.2
pydantic-settings==2.6.0
pandas==2.2.3
openpyxl==3.1.5
anthropic==0.39.0
openai==1.54.0
pytest==8.3.3
httpx==0.27.2
```

- [ ] **Step 2: Write config.py**

```python
# apps/api/app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://finsight:finsight@localhost:5432/finsight"
    llm_provider: str = "anthropic"
    anthropic_api_key: str = ""
    openai_api_key: str = ""


settings = Settings()
```

- [ ] **Step 3: Write db.py**

```python
# apps/api/app/core/db.py
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 4: Write main.py**

```python
# apps/api/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="FinSight API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 5: Write conftest.py**

```python
# apps/api/tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.db import Base, get_db
from app.main import app


@pytest.fixture()
def db_session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(bind=engine)
    Base.metadata.create_all(engine)
    session = TestingSessionLocal()
    yield session
    session.close()


@pytest.fixture()
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
```

- [ ] **Step 6: Write the failing test**

```python
# apps/api/tests/test_health.py
def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

- [ ] **Step 7: Install deps and run test to verify it passes**

Run (from `apps/api`):
```bash
pip install -r requirements.txt
pytest tests/test_health.py -v
```
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add apps/api
git commit -m "feat(api): scaffold FastAPI app with config, db session, health endpoint"
```

---

## Task 2: Database Models

**Files:**
- Create: `apps/api/app/models/__init__.py`
- Create: `apps/api/app/models/account.py`
- Create: `apps/api/app/models/program.py`
- Create: `apps/api/app/models/financial_record.py`
- Create: `apps/api/app/models/utilization_record.py`
- Create: `apps/api/app/models/upload.py`
- Test: `apps/api/tests/test_models.py`

**Interfaces:**
- Consumes: `Base` from `app.core.db` (Task 1)
- Produces: `Account(id, name, area_director)`, `Program(id, name, account_id, program_manager)`, `FinancialRecord(id, program_id, period, revenue, cost)` with `.margin` property, `UtilizationRecord(id, program_id, resource_name, period, allocation_pct, on_bench)`, `Upload(id, filename, status, row_errors, uploaded_at)` — all consumed by every later backend task

- [ ] **Step 1: Write account.py**

```python
# apps/api/app/models/account.py
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True)
    area_director: Mapped[str] = mapped_column(String(200), default="unassigned")

    programs: Mapped[list["Program"]] = relationship(back_populates="account")
```

- [ ] **Step 2: Write program.py**

```python
# apps/api/app/models/program.py
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class Program(Base):
    __tablename__ = "programs"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id"))
    program_manager: Mapped[str] = mapped_column(String(200), default="unassigned")

    account: Mapped["Account"] = relationship(back_populates="programs")
```

- [ ] **Step 3: Write financial_record.py**

```python
# apps/api/app/models/financial_record.py
from datetime import date

from sqlalchemy import Date, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class FinancialRecord(Base):
    __tablename__ = "financial_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    program_id: Mapped[int] = mapped_column(ForeignKey("programs.id"))
    period: Mapped[date] = mapped_column(Date)
    revenue: Mapped[float] = mapped_column(Numeric(14, 2))
    cost: Mapped[float] = mapped_column(Numeric(14, 2))

    @property
    def margin(self) -> float:
        if not self.revenue:
            return 0.0
        return (float(self.revenue) - float(self.cost)) / float(self.revenue)
```

- [ ] **Step 4: Write utilization_record.py**

```python
# apps/api/app/models/utilization_record.py
from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class UtilizationRecord(Base):
    __tablename__ = "utilization_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    program_id: Mapped[int] = mapped_column(ForeignKey("programs.id"))
    resource_name: Mapped[str] = mapped_column(String(200))
    period: Mapped[date] = mapped_column(Date)
    allocation_pct: Mapped[float] = mapped_column(Numeric(5, 2))
    on_bench: Mapped[bool] = mapped_column(Boolean, default=False)
```

- [ ] **Step 5: Write upload.py**

```python
# apps/api/app/models/upload.py
from datetime import datetime

from sqlalchemy import JSON, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class Upload(Base):
    __tablename__ = "uploads"

    id: Mapped[int] = mapped_column(primary_key=True)
    filename: Mapped[str] = mapped_column(String(300))
    status: Mapped[str] = mapped_column(String(30), default="processed")
    row_errors: Mapped[list] = mapped_column(JSON, default=list)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
```

- [ ] **Step 6: Write models/__init__.py so Base.metadata sees every table**

```python
# apps/api/app/models/__init__.py
from app.models.account import Account
from app.models.financial_record import FinancialRecord
from app.models.program import Program
from app.models.upload import Upload
from app.models.utilization_record import UtilizationRecord

__all__ = ["Account", "Program", "FinancialRecord", "UtilizationRecord", "Upload"]
```

- [ ] **Step 7: Import models in conftest.py so tables are registered before create_all**

Modify `apps/api/tests/conftest.py` — add `import app.models  # noqa: F401` directly below the existing `from app.core.db import Base, get_db` line.

- [ ] **Step 8: Write the failing test**

```python
# apps/api/tests/test_models.py
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
```

- [ ] **Step 9: Run test to verify it passes**

Run: `pytest tests/test_models.py -v`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add apps/api
git commit -m "feat(api): add Account, Program, FinancialRecord, UtilizationRecord, Upload models"
```

---

## Task 3: Role Scoping Dependency

**Files:**
- Create: `apps/api/app/deps.py`
- Test: `apps/api/tests/test_deps.py`

**Interfaces:**
- Produces: `RoleScope(role: str, scope_id: int | None)` dataclass, `get_role_scope(x_role, x_scope_id) -> RoleScope` FastAPI dependency — consumed by dashboard, scorecards, insights, nlq routers/services

- [ ] **Step 1: Write the failing test**

```python
# apps/api/tests/test_deps.py
from app.deps import get_role_scope


def test_defaults_role_when_missing():
    scope = get_role_scope(x_role="area_director", x_scope_id=None)
    assert scope.role == "area_director"
    assert scope.scope_id is None


def test_invalid_role_falls_back_to_area_director():
    scope = get_role_scope(x_role="bogus", x_scope_id=None)
    assert scope.role == "area_director"


def test_pm_scope_with_id():
    scope = get_role_scope(x_role="pm", x_scope_id=42)
    assert scope.role == "pm"
    assert scope.scope_id == 42
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_deps.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.deps'`

- [ ] **Step 3: Write deps.py**

```python
# apps/api/app/deps.py
from dataclasses import dataclass

from fastapi import Header

VALID_ROLES = {"pm", "account_director", "area_director"}


@dataclass
class RoleScope:
    role: str
    scope_id: int | None = None


def get_role_scope(
    x_role: str = Header(default="area_director", alias="X-Role"),
    x_scope_id: int | None = Header(default=None, alias="X-Scope-Id"),
) -> RoleScope:
    role = x_role.lower()
    if role not in VALID_ROLES:
        role = "area_director"
    return RoleScope(role=role, scope_id=x_scope_id)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_deps.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api
git commit -m "feat(api): add role-scoping dependency (X-Role/X-Scope-Id headers)"
```

---

## Task 4: Ingestion Service + Uploads Router

**Files:**
- Create: `apps/api/app/services/__init__.py`
- Create: `apps/api/app/services/ingestion.py`
- Create: `apps/api/app/schemas/__init__.py`
- Create: `apps/api/app/schemas/upload.py`
- Create: `apps/api/app/routers/__init__.py`
- Create: `apps/api/app/routers/uploads.py`
- Modify: `apps/api/app/main.py`
- Test: `apps/api/tests/test_ingestion.py`
- Test: `apps/api/tests/test_uploads_api.py`

**Interfaces:**
- Consumes: `Account`, `Program`, `FinancialRecord`, `UtilizationRecord`, `Upload` models (Task 2)
- Produces: `ingest_financial(db, filename, content) -> tuple[int, list[dict]]`, `ingest_utilization(db, filename, content) -> tuple[int, list[dict]]` (`app/services/ingestion.py`) — not consumed elsewhere but required by the uploads router
- Produces: `router` (`app/routers/uploads.py`), mounted at `/uploads`

- [ ] **Step 1: Write the failing tests**

```python
# apps/api/tests/test_ingestion.py
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest tests/test_ingestion.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.services'`

- [ ] **Step 3: Write ingestion.py**

```python
# apps/api/app/services/ingestion.py
import io

import pandas as pd
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.financial_record import FinancialRecord
from app.models.program import Program
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


def _get_or_create_program(db: Session, name: str, account: Account) -> Program:
    program = db.query(Program).filter_by(name=name, account_id=account.id).first()
    if program is None:
        program = Program(name=name, account_id=account.id)
        db.add(program)
        db.flush()
    return program


def ingest_financial(db: Session, filename: str, content: bytes) -> tuple[int, list[dict]]:
    df = _read_dataframe(filename, content)
    missing = FINANCIAL_COLUMNS - set(df.columns)
    if missing:
        return 0, [{"row": 0, "error": f"missing columns: {sorted(missing)}"}]

    created = 0
    errors: list[dict] = []
    for idx, row in df.iterrows():
        try:
            account = _get_or_create_account(db, str(row["account_name"]))
            program = _get_or_create_program(db, str(row["program_name"]), account)
            db.add(
                FinancialRecord(
                    program_id=program.id,
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
    df = _read_dataframe(filename, content)
    missing = UTILIZATION_COLUMNS - set(df.columns)
    if missing:
        return 0, [{"row": 0, "error": f"missing columns: {sorted(missing)}"}]

    created = 0
    errors: list[dict] = []
    for idx, row in df.iterrows():
        try:
            program = db.query(Program).filter_by(name=str(row["program_name"])).first()
            if program is None:
                raise ValueError(f"unknown program: {row['program_name']}")
            db.add(
                UtilizationRecord(
                    program_id=program.id,
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pytest tests/test_ingestion.py -v`
Expected: PASS

- [ ] **Step 5: Write schemas/upload.py**

```python
# apps/api/app/schemas/upload.py
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UploadOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    status: str
    row_errors: list
    uploaded_at: datetime
```

- [ ] **Step 6: Write the failing router test**

```python
# apps/api/tests/test_uploads_api.py
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
```

- [ ] **Step 7: Run test to verify it fails**

Run: `pytest tests/test_uploads_api.py -v`
Expected: FAIL with 404 (route not registered)

- [ ] **Step 8: Write uploads.py router**

```python
# apps/api/app/routers/uploads.py
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.upload import Upload
from app.schemas.upload import UploadOut
from app.services.ingestion import ingest_financial, ingest_utilization

router = APIRouter(prefix="/uploads", tags=["uploads"])

DATASET_HANDLERS = {
    "financial": ingest_financial,
    "utilization": ingest_utilization,
}


@router.post("")
async def create_upload(dataset: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    handler = DATASET_HANDLERS.get(dataset)
    if handler is None:
        raise HTTPException(400, f"unknown dataset type: {dataset}")

    content = await file.read()
    created, errors = handler(db, file.filename, content)

    upload = Upload(
        filename=file.filename,
        status="processed" if not errors else "processed_with_errors",
        row_errors=errors,
    )
    db.add(upload)
    db.commit()
    db.refresh(upload)

    return {"upload_id": upload.id, "created_rows": created, "errors": errors}


@router.get("", response_model=list[UploadOut])
def list_uploads(db: Session = Depends(get_db)):
    return db.query(Upload).order_by(Upload.uploaded_at.desc()).all()
```

- [ ] **Step 9: Register router in main.py**

Modify `apps/api/app/main.py` — add after the `app = FastAPI(...)` block:

```python
from app.routers import uploads

app.include_router(uploads.router)
```

- [ ] **Step 10: Run tests to verify they pass**

Run: `pytest tests/test_uploads_api.py -v`
Expected: PASS

- [ ] **Step 11: Commit**

```bash
git add apps/api
git commit -m "feat(api): add CSV/XLSX ingestion service and uploads router"
```

---

## Task 5: Dashboard Aggregation Service + Router

**Files:**
- Create: `apps/api/app/services/dashboard.py`
- Create: `apps/api/app/routers/dashboard.py`
- Modify: `apps/api/app/main.py`
- Test: `apps/api/tests/test_dashboard.py`

**Interfaces:**
- Consumes: `RoleScope` (Task 3), `Program`, `FinancialRecord`, `UtilizationRecord` (Task 2)
- Produces: `_scoped_program_ids(db, scope) -> list[int] | None` (also consumed by Task 6's scorecards service), `revenue_margin_summary(db, scope) -> list[dict]`, `utilization_summary(db, scope) -> list[dict]`
- Produces: `router` (`app/routers/dashboard.py`), mounted at `/dashboard`

- [ ] **Step 1: Write the failing test**

```python
# apps/api/tests/test_dashboard.py
from datetime import date

from app.deps import RoleScope
from app.models.account import Account
from app.models.financial_record import FinancialRecord
from app.models.program import Program
from app.models.utilization_record import UtilizationRecord
from app.services.dashboard import revenue_margin_summary, utilization_summary


def _seed(db_session):
    a1 = Account(name="Acme Corp")
    a2 = Account(name="Globex")
    db_session.add_all([a1, a2])
    db_session.flush()

    p1 = Program(name="Modernization", account_id=a1.id)
    p2 = Program(name="Migration", account_id=a2.id)
    db_session.add_all([p1, p2])
    db_session.flush()

    db_session.add_all(
        [
            FinancialRecord(program_id=p1.id, period=date(2026, 1, 1), revenue=100000, cost=70000),
            FinancialRecord(program_id=p2.id, period=date(2026, 1, 1), revenue=50000, cost=40000),
            UtilizationRecord(
                program_id=p1.id, resource_name="Jane", period=date(2026, 1, 1), allocation_pct=90, on_bench=False
            ),
            UtilizationRecord(
                program_id=p2.id, resource_name="John", period=date(2026, 1, 1), allocation_pct=0, on_bench=True
            ),
        ]
    )
    db_session.commit()
    return p1, p2


def test_revenue_margin_summary_aggregates_across_all_programs(db_session):
    _seed(db_session)
    result = revenue_margin_summary(db_session, RoleScope(role="area_director"))
    expected_margin = (150000.0 - 110000.0) / 150000.0
    assert result == [{"period": "2026-01-01", "revenue": 150000.0, "cost": 110000.0, "margin": expected_margin}]


def test_revenue_margin_summary_scoped_to_single_program(db_session):
    p1, _ = _seed(db_session)
    result = revenue_margin_summary(db_session, RoleScope(role="pm", scope_id=p1.id))
    assert result == [{"period": "2026-01-01", "revenue": 100000.0, "cost": 70000.0, "margin": 0.3}]


def test_utilization_summary_computes_bench_pct(db_session):
    _seed(db_session)
    result = utilization_summary(db_session, RoleScope(role="area_director"))
    assert result[0]["bench_pct"] == 0.5
    assert result[0]["avg_allocation_pct"] == 45.0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_dashboard.py -v`
Expected: FAIL with `ModuleNotFoundError`

- [ ] **Step 3: Write dashboard.py service**

```python
# apps/api/app/services/dashboard.py
from collections import defaultdict

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.deps import RoleScope
from app.models.financial_record import FinancialRecord
from app.models.program import Program
from app.models.utilization_record import UtilizationRecord


def _scoped_program_ids(db: Session, scope: RoleScope) -> list[int] | None:
    if scope.role == "area_director":
        return None
    if scope.role == "account_director" and scope.scope_id is not None:
        return [i for (i,) in db.query(Program.id).filter(Program.account_id == scope.scope_id).all()]
    if scope.role == "pm" and scope.scope_id is not None:
        return [scope.scope_id]
    return None


def revenue_margin_summary(db: Session, scope: RoleScope) -> list[dict]:
    program_ids = _scoped_program_ids(db, scope)
    query = (
        db.query(
            FinancialRecord.period,
            func.sum(FinancialRecord.revenue).label("revenue"),
            func.sum(FinancialRecord.cost).label("cost"),
        )
        .group_by(FinancialRecord.period)
        .order_by(FinancialRecord.period)
    )
    if program_ids is not None:
        query = query.filter(FinancialRecord.program_id.in_(program_ids))

    results = []
    for period, revenue, cost in query.all():
        revenue, cost = float(revenue or 0), float(cost or 0)
        margin = (revenue - cost) / revenue if revenue else 0.0
        results.append({"period": period.isoformat(), "revenue": revenue, "cost": cost, "margin": margin})
    return results


def utilization_summary(db: Session, scope: RoleScope) -> list[dict]:
    program_ids = _scoped_program_ids(db, scope)
    query = db.query(UtilizationRecord)
    if program_ids is not None:
        query = query.filter(UtilizationRecord.program_id.in_(program_ids))

    by_period: dict = defaultdict(lambda: {"allocations": [], "bench_count": 0, "total": 0})
    for record in query.all():
        bucket = by_period[record.period]
        bucket["allocations"].append(float(record.allocation_pct))
        bucket["total"] += 1
        if record.on_bench:
            bucket["bench_count"] += 1

    results = []
    for period in sorted(by_period):
        bucket = by_period[period]
        avg_allocation = sum(bucket["allocations"]) / len(bucket["allocations"]) if bucket["allocations"] else 0.0
        bench_pct = bucket["bench_count"] / bucket["total"] if bucket["total"] else 0.0
        results.append({"period": period.isoformat(), "avg_allocation_pct": avg_allocation, "bench_pct": bench_pct})
    return results
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_dashboard.py -v`
Expected: PASS

- [ ] **Step 5: Write dashboard.py router**

```python
# apps/api/app/routers/dashboard.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.deps import RoleScope, get_role_scope
from app.services.dashboard import revenue_margin_summary, utilization_summary

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/revenue-margin")
def get_revenue_margin(db: Session = Depends(get_db), scope: RoleScope = Depends(get_role_scope)):
    return revenue_margin_summary(db, scope)


@router.get("/utilization")
def get_utilization(db: Session = Depends(get_db), scope: RoleScope = Depends(get_role_scope)):
    return utilization_summary(db, scope)
```

- [ ] **Step 6: Register router in main.py**

Modify `apps/api/app/main.py` — add alongside the uploads import:

```python
from app.routers import dashboard, uploads

app.include_router(uploads.router)
app.include_router(dashboard.router)
```

- [ ] **Step 7: Commit**

```bash
git add apps/api
git commit -m "feat(api): add revenue/margin and utilization dashboard aggregation"
```

---

## Task 6: Scorecards Service + Router

**Files:**
- Create: `apps/api/app/services/scorecards.py`
- Create: `apps/api/app/routers/scorecards.py`
- Modify: `apps/api/app/main.py`
- Test: `apps/api/tests/test_scorecards.py`

**Interfaces:**
- Consumes: `_scoped_program_ids` (Task 5), `RoleScope` (Task 3), `Program`, `FinancialRecord` (Task 2)
- Produces: `program_scorecards(db, scope) -> list[dict]` with `rag_status: "green"|"yellow"|"red"`
- Produces: `router` (`app/routers/scorecards.py`), mounted at `/scorecards`

- [ ] **Step 1: Write the failing test**

```python
# apps/api/tests/test_scorecards.py
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_scorecards.py -v`
Expected: FAIL with `ModuleNotFoundError`

- [ ] **Step 3: Write scorecards.py service**

```python
# apps/api/app/services/scorecards.py
from sqlalchemy.orm import Session

from app.deps import RoleScope
from app.models.financial_record import FinancialRecord
from app.models.program import Program
from app.services.dashboard import _scoped_program_ids

MARGIN_GREEN = 0.25
MARGIN_YELLOW = 0.15


def _rag_for_margin(margin: float) -> str:
    if margin >= MARGIN_GREEN:
        return "green"
    if margin >= MARGIN_YELLOW:
        return "yellow"
    return "red"


def program_scorecards(db: Session, scope: RoleScope) -> list[dict]:
    program_ids = _scoped_program_ids(db, scope)
    query = db.query(Program)
    if program_ids is not None:
        query = query.filter(Program.id.in_(program_ids))

    results = []
    for program in query.all():
        records = db.query(FinancialRecord).filter_by(program_id=program.id).all()
        total_revenue = sum(float(r.revenue) for r in records)
        total_cost = sum(float(r.cost) for r in records)
        margin = (total_revenue - total_cost) / total_revenue if total_revenue else 0.0
        results.append(
            {
                "program_id": program.id,
                "program_name": program.name,
                "margin": margin,
                "rag_status": _rag_for_margin(margin),
            }
        )
    return results
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_scorecards.py -v`
Expected: PASS

- [ ] **Step 5: Write scorecards.py router**

```python
# apps/api/app/routers/scorecards.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.deps import RoleScope, get_role_scope
from app.services.scorecards import program_scorecards

router = APIRouter(prefix="/scorecards", tags=["scorecards"])


@router.get("")
def get_scorecards(db: Session = Depends(get_db), scope: RoleScope = Depends(get_role_scope)):
    return program_scorecards(db, scope)
```

- [ ] **Step 6: Register router in main.py**

Modify `apps/api/app/main.py`:

```python
from app.routers import dashboard, scorecards, uploads

app.include_router(uploads.router)
app.include_router(dashboard.router)
app.include_router(scorecards.router)
```

- [ ] **Step 7: Commit**

```bash
git add apps/api
git commit -m "feat(api): add program health scorecards (RAG status) service and router"
```

---

## Task 7: Pluggable LLM Client

**Files:**
- Create: `apps/api/app/core/llm/__init__.py`
- Create: `apps/api/app/core/llm/base.py`
- Create: `apps/api/app/core/llm/anthropic_client.py`
- Create: `apps/api/app/core/llm/openai_client.py`
- Create: `apps/api/app/core/llm/factory.py`
- Test: `apps/api/tests/test_llm_factory.py`

**Interfaces:**
- Produces: `LLMClient` ABC with `complete(prompt, system=None) -> str` (`app/core/llm/base.py`), `AnthropicClient`, `OpenAIClient`, `get_llm_client() -> LLMClient` (`app/core/llm/factory.py`) — consumed by Task 8 (insights) and Task 9 (nl2sql)

- [ ] **Step 1: Write base.py**

```python
# apps/api/app/core/llm/base.py
from abc import ABC, abstractmethod


class LLMClient(ABC):
    @abstractmethod
    def complete(self, prompt: str, system: str | None = None) -> str:
        ...
```

- [ ] **Step 2: Write anthropic_client.py**

```python
# apps/api/app/core/llm/anthropic_client.py
import anthropic

from app.core.config import settings
from app.core.llm.base import LLMClient


class AnthropicClient(LLMClient):
    def __init__(self) -> None:
        self._client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    def complete(self, prompt: str, system: str | None = None) -> str:
        response = self._client.messages.create(
            model="claude-sonnet-5",
            max_tokens=1024,
            system=system or "",
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text
```

- [ ] **Step 3: Write openai_client.py**

```python
# apps/api/app/core/llm/openai_client.py
from openai import OpenAI

from app.core.config import settings
from app.core.llm.base import LLMClient


class OpenAIClient(LLMClient):
    def __init__(self) -> None:
        self._client = OpenAI(api_key=settings.openai_api_key)

    def complete(self, prompt: str, system: str | None = None) -> str:
        response = self._client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system or ""},
                {"role": "user", "content": prompt},
            ],
        )
        return response.choices[0].message.content
```

- [ ] **Step 4: Write factory.py**

```python
# apps/api/app/core/llm/factory.py
from functools import lru_cache

from app.core.config import settings
from app.core.llm.base import LLMClient


@lru_cache
def get_llm_client() -> LLMClient:
    if settings.llm_provider == "openai":
        from app.core.llm.openai_client import OpenAIClient

        return OpenAIClient()
    from app.core.llm.anthropic_client import AnthropicClient

    return AnthropicClient()
```

- [ ] **Step 5: Write the failing test**

```python
# apps/api/tests/test_llm_factory.py
from app.core.llm import factory


def test_factory_returns_anthropic_by_default(monkeypatch):
    factory.get_llm_client.cache_clear()
    monkeypatch.setattr("app.core.config.settings.llm_provider", "anthropic")
    monkeypatch.setattr("app.core.llm.anthropic_client.AnthropicClient.__init__", lambda self: None)
    client = factory.get_llm_client()
    assert client.__class__.__name__ == "AnthropicClient"


def test_factory_returns_openai_when_configured(monkeypatch):
    factory.get_llm_client.cache_clear()
    monkeypatch.setattr("app.core.config.settings.llm_provider", "openai")
    monkeypatch.setattr("app.core.llm.openai_client.OpenAIClient.__init__", lambda self: None)
    client = factory.get_llm_client()
    assert client.__class__.__name__ == "OpenAIClient"
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pytest tests/test_llm_factory.py -v`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/api
git commit -m "feat(api): add pluggable LLM client (Anthropic default, OpenAI alternative)"
```

---

## Task 8: AI Narrative Insights Router

**Files:**
- Create: `apps/api/app/services/insights.py`
- Create: `apps/api/app/routers/insights.py`
- Modify: `apps/api/app/main.py`
- Test: `apps/api/tests/test_insights.py`

**Interfaces:**
- Consumes: `get_llm_client` (Task 7), `revenue_margin_summary`, `utilization_summary` (Task 5), `RoleScope` (Task 3)
- Produces: `generate_narrative(db, scope) -> str`, `router` (`app/routers/insights.py`), mounted at `/insights`

- [ ] **Step 1: Write the failing test**

```python
# apps/api/tests/test_insights.py
from app.deps import RoleScope
from app.services import insights


class FakeClient:
    def complete(self, prompt, system=None):
        return "Revenue grew steadily with stable margins."


def test_generate_narrative_uses_llm_client(db_session, monkeypatch):
    monkeypatch.setattr(insights, "get_llm_client", lambda: FakeClient())
    result = insights.generate_narrative(db_session, RoleScope(role="area_director"))
    assert "Revenue grew" in result
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_insights.py -v`
Expected: FAIL with `ModuleNotFoundError`

- [ ] **Step 3: Write insights.py service**

```python
# apps/api/app/services/insights.py
from sqlalchemy.orm import Session

from app.core.llm.factory import get_llm_client
from app.deps import RoleScope
from app.services.dashboard import revenue_margin_summary, utilization_summary


def generate_narrative(db: Session, scope: RoleScope) -> str:
    revenue = revenue_margin_summary(db, scope)
    utilization = utilization_summary(db, scope)

    prompt = (
        "You are a financial analyst for a services company. "
        "Summarize the trend and flag risks in 3-4 sentences.\n\n"
        f"Revenue/margin by period: {revenue}\n"
        f"Utilization by period: {utilization}"
    )
    client = get_llm_client()
    return client.complete(prompt, system="Be concise and specific with numbers.")
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_insights.py -v`
Expected: PASS

- [ ] **Step 5: Write insights.py router**

```python
# apps/api/app/routers/insights.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.deps import RoleScope, get_role_scope
from app.services.insights import generate_narrative

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("")
def get_insight(db: Session = Depends(get_db), scope: RoleScope = Depends(get_role_scope)):
    return {"narrative": generate_narrative(db, scope)}
```

- [ ] **Step 6: Register router in main.py**

Modify `apps/api/app/main.py`:

```python
from app.routers import dashboard, insights, scorecards, uploads

app.include_router(uploads.router)
app.include_router(dashboard.router)
app.include_router(scorecards.router)
app.include_router(insights.router)
```

- [ ] **Step 7: Commit**

```bash
git add apps/api
git commit -m "feat(api): add AI narrative insights endpoint"
```

---

## Task 9: NL2SQL Agent ("Ask FinSight")

**Files:**
- Create: `apps/api/app/services/nl2sql.py`
- Create: `apps/api/app/routers/nlq.py`
- Modify: `apps/api/app/main.py`
- Test: `apps/api/tests/test_nl2sql_guard.py`
- Test: `apps/api/tests/test_nl2sql_run_query.py`

**Interfaces:**
- Consumes: `get_llm_client` (Task 7)
- Produces: `UnsafeSQLError`, `validate_select_only(sql) -> str`, `question_to_sql(question) -> str`, `run_query(db, question) -> dict` with keys `sql`, `rows`, `explanation`
- Produces: `router` (`app/routers/nlq.py`), mounted at `/nlq`

- [ ] **Step 1: Write the failing safety-guard tests**

```python
# apps/api/tests/test_nl2sql_guard.py
import pytest

from app.services.nl2sql import UnsafeSQLError, _extract_sql, validate_select_only


def test_validate_select_only_accepts_select():
    assert validate_select_only("SELECT * FROM accounts") == "SELECT * FROM accounts"


def test_validate_select_only_rejects_delete():
    with pytest.raises(UnsafeSQLError):
        validate_select_only("DELETE FROM accounts")


def test_validate_select_only_rejects_stacked_statement():
    with pytest.raises(UnsafeSQLError):
        validate_select_only("SELECT * FROM accounts; DROP TABLE accounts")


def test_validate_select_only_rejects_non_select_start():
    with pytest.raises(UnsafeSQLError):
        validate_select_only("UPDATE accounts SET name = 'x'")


def test_extract_sql_pulls_code_block():
    llm_output = "Here you go:\n```sql\nSELECT 1\n```"
    assert _extract_sql(llm_output) == "SELECT 1"


def test_extract_sql_falls_back_to_raw_text_when_no_code_block():
    assert _extract_sql("SELECT 1") == "SELECT 1"
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest tests/test_nl2sql_guard.py -v`
Expected: FAIL with `ModuleNotFoundError`

- [ ] **Step 3: Write nl2sql.py**

```python
# apps/api/app/services/nl2sql.py
import re

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.llm.factory import get_llm_client

SCHEMA_DESCRIPTION = """
Tables:
- accounts(id, name, area_director)
- programs(id, name, account_id, program_manager)
- financial_records(id, program_id, period, revenue, cost)
- utilization_records(id, program_id, resource_name, period, allocation_pct, on_bench)
"""

FORBIDDEN_KEYWORDS = ("insert", "update", "delete", "drop", "alter", "create", "truncate", "attach", ";")


class UnsafeSQLError(ValueError):
    pass


def _extract_sql(llm_output: str) -> str:
    match = re.search(r"```sql\s*(.*?)```", llm_output, re.DOTALL | re.IGNORECASE)
    return (match.group(1) if match else llm_output).strip()


def validate_select_only(sql: str) -> str:
    lowered = sql.strip().lower()
    if not lowered.startswith("select"):
        raise UnsafeSQLError("only SELECT statements are allowed")
    for keyword in FORBIDDEN_KEYWORDS:
        if keyword in lowered:
            raise UnsafeSQLError(f"disallowed keyword detected: {keyword}")
    return sql.strip()


def question_to_sql(question: str) -> str:
    client = get_llm_client()
    prompt = (
        f"Given this schema:\n{SCHEMA_DESCRIPTION}\n"
        f"Write a single read-only PostgreSQL SELECT statement to answer: {question}\n"
        "Return only the SQL in a ```sql code block."
    )
    raw = client.complete(prompt, system="You only write safe, read-only SQL.")
    return validate_select_only(_extract_sql(raw))


def run_query(db: Session, question: str) -> dict:
    sql = question_to_sql(question)
    rows = [dict(row) for row in db.execute(text(sql)).mappings().all()]

    client = get_llm_client()
    explanation = client.complete(
        f"Question: {question}\nSQL used: {sql}\nResult rows: {rows}\n"
        "Explain the result in 2-3 plain-English sentences."
    )

    return {"sql": sql, "rows": rows, "explanation": explanation}
```

- [ ] **Step 4: Run guard tests to verify they pass**

Run: `pytest tests/test_nl2sql_guard.py -v`
Expected: PASS

- [ ] **Step 5: Write the failing run_query test**

```python
# apps/api/tests/test_nl2sql_run_query.py
from app.models.account import Account
from app.services import nl2sql


class FakeClient:
    def __init__(self, sql_response: str) -> None:
        self.sql_response = sql_response

    def complete(self, prompt, system=None):
        if "Explain" in prompt:
            return "There is one account named Acme."
        return f"```sql\n{self.sql_response}\n```"


def test_run_query_executes_generated_sql(db_session, monkeypatch):
    db_session.add(Account(name="Acme"))
    db_session.commit()

    monkeypatch.setattr(nl2sql, "get_llm_client", lambda: FakeClient("SELECT name FROM accounts"))

    result = nl2sql.run_query(db_session, "List all accounts")
    assert result["sql"] == "SELECT name FROM accounts"
    assert result["rows"] == [{"name": "Acme"}]
    assert "Acme" in result["explanation"]
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pytest tests/test_nl2sql_run_query.py -v`
Expected: PASS

- [ ] **Step 7: Write nlq.py router**

```python
# apps/api/app/routers/nlq.py
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.services.nl2sql import run_query

router = APIRouter(prefix="/nlq", tags=["nlq"])


class NLQRequest(BaseModel):
    question: str


@router.post("")
def ask_question(payload: NLQRequest, db: Session = Depends(get_db)):
    return run_query(db, payload.question)
```

- [ ] **Step 8: Register router in main.py**

Modify `apps/api/app/main.py`:

```python
from app.routers import dashboard, insights, nlq, scorecards, uploads

app.include_router(uploads.router)
app.include_router(dashboard.router)
app.include_router(scorecards.router)
app.include_router(insights.router)
app.include_router(nlq.router)
```

- [ ] **Step 9: Commit**

```bash
git add apps/api
git commit -m "feat(api): add NL2SQL 'Ask FinSight' agent with SELECT-only safety guard"
```

---

## Task 10: Frontend Scaffold + Role Context

**Files:**
- Create: `apps/web/` (via Vite scaffold command)
- Create: `apps/web/tailwind.config.js`
- Create: `apps/web/postcss.config.js`
- Modify: `apps/web/src/index.css`
- Create: `apps/web/src/lib/api.ts`
- Create: `apps/web/src/context/RoleContext.tsx`
- Create: `apps/web/src/components/RoleSwitcher.tsx`
- Test: `apps/web/src/components/RoleSwitcher.test.tsx`

**Interfaces:**
- Produces: `RoleProvider`, `useRole() -> { role, scopeId, setRole }` (`context/RoleContext.tsx`) — consumed by every page component and `RoleSwitcher`
- Produces: `getRevenueMargin`, `getUtilization`, `getScorecards`, `getInsight`, `askQuestion`, `uploadDataset` and types `RevenueMarginPoint`, `UtilizationPoint`, `ScorecardEntry`, `NLQResult` (`lib/api.ts`) — consumed by Tasks 11-13
- Produces: `RoleSwitcher` component — consumed by Task 14's `App.tsx`

- [ ] **Step 1: Scaffold the Vite project**

Run (from repo root):
```bash
npm create vite@latest apps/web -- --template react-ts
cd apps/web
npm install
npm install -D tailwindcss postcss autoprefixer vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install @radix-ui/react-select recharts react-router-dom
npx tailwindcss init -p
```

- [ ] **Step 2: Configure Tailwind**

```js
// apps/web/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
```

Replace contents of `apps/web/src/index.css` with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 3: Write RoleContext.tsx**

```tsx
// apps/web/src/context/RoleContext.tsx
import { createContext, useContext, useState, type ReactNode } from "react";

export type Role = "pm" | "account_director" | "area_director";

interface RoleContextValue {
  role: Role;
  scopeId: number | null;
  setRole: (role: Role) => void;
}

const STORAGE_KEY = "finsight_role";

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(
    () => (localStorage.getItem(STORAGE_KEY) as Role) || "area_director"
  );

  const setRole = (next: Role) => {
    localStorage.setItem(STORAGE_KEY, next);
    setRoleState(next);
  };

  return <RoleContext.Provider value={{ role, scopeId: null, setRole }}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
```

- [ ] **Step 4: Write the failing test for RoleSwitcher**

```tsx
// apps/web/src/components/RoleSwitcher.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, beforeEach } from "vitest";
import { RoleProvider } from "../context/RoleContext";
import { RoleSwitcher } from "./RoleSwitcher";

describe("RoleSwitcher", () => {
  beforeEach(() => localStorage.clear());

  it("defaults to Area Director", () => {
    render(
      <RoleProvider>
        <RoleSwitcher />
      </RoleProvider>
    );
    expect(screen.getByText("Area Director")).toBeInTheDocument();
  });

  it("persists role selection to localStorage", async () => {
    render(
      <RoleProvider>
        <RoleSwitcher />
      </RoleProvider>
    );
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(await screen.findByText("Program Manager"));
    expect(localStorage.getItem("finsight_role")).toBe("pm");
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run (from `apps/web`): `npx vitest run src/components/RoleSwitcher.test.tsx`
Expected: FAIL — `RoleSwitcher` module does not exist

- [ ] **Step 6: Write RoleSwitcher.tsx**

```tsx
// apps/web/src/components/RoleSwitcher.tsx
import * as Select from "@radix-ui/react-select";
import { useRole, type Role } from "../context/RoleContext";

const ROLE_LABELS: Record<Role, string> = {
  pm: "Program Manager",
  account_director: "Account Director",
  area_director: "Area Director",
};

export function RoleSwitcher() {
  const { role, setRole } = useRole();

  return (
    <Select.Root value={role} onValueChange={(value) => setRole(value as Role)}>
      <Select.Trigger aria-label="Role" className="px-3 py-2 rounded-md border border-slate-300 bg-white text-sm">
        <Select.Value>{ROLE_LABELS[role]}</Select.Value>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="bg-white border border-slate-200 rounded-md shadow-md">
          <Select.Viewport>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <Select.Item key={value} value={value} className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-100">
                <Select.ItemText>{label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
```

- [ ] **Step 7: Add a vitest setup file and script**

```ts
// apps/web/src/setupTests.ts
import "@testing-library/jest-dom";
```

Add to `apps/web/vite.config.ts` a `test` block:
```ts
test: {
  environment: "jsdom",
  setupFiles: "./src/setupTests.ts",
},
```

Add to `apps/web/package.json` `scripts`: `"test": "vitest run"`.

- [ ] **Step 8: Run test to verify it passes**

Run: `npm run test -- src/components/RoleSwitcher.test.tsx`
Expected: PASS

- [ ] **Step 9: Write api.ts client**

```ts
// apps/web/src/lib/api.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export interface RequestOptions {
  role: string;
  scopeId?: number | null;
}

async function request<T>(path: string, options: RequestOptions, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Role": options.role,
    ...(init.headers as Record<string, string> | undefined),
  };
  if (options.scopeId != null) headers["X-Scope-Id"] = String(options.scopeId);

  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!response.ok) throw new Error(`API error ${response.status}: ${await response.text()}`);
  return response.json() as Promise<T>;
}

export interface RevenueMarginPoint {
  period: string;
  revenue: number;
  cost: number;
  margin: number;
}
export function getRevenueMargin(options: RequestOptions) {
  return request<RevenueMarginPoint[]>("/dashboard/revenue-margin", options);
}

export interface UtilizationPoint {
  period: string;
  avg_allocation_pct: number;
  bench_pct: number;
}
export function getUtilization(options: RequestOptions) {
  return request<UtilizationPoint[]>("/dashboard/utilization", options);
}

export interface ScorecardEntry {
  program_id: number;
  program_name: string;
  margin: number;
  rag_status: "green" | "yellow" | "red";
}
export function getScorecards(options: RequestOptions) {
  return request<ScorecardEntry[]>("/scorecards", options);
}

export function getInsight(options: RequestOptions) {
  return request<{ narrative: string }>("/insights", options);
}

export interface NLQResult {
  sql: string;
  rows: Record<string, unknown>[];
  explanation: string;
}
export function askQuestion(question: string, options: RequestOptions) {
  return request<NLQResult>("/nlq", options, { method: "POST", body: JSON.stringify({ question }) });
}

export async function uploadDataset(dataset: "financial" | "utilization", file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE}/uploads?dataset=${dataset}`, { method: "POST", body: formData });
  if (!response.ok) throw new Error(`Upload failed: ${await response.text()}`);
  return response.json();
}
```

- [ ] **Step 10: Commit**

```bash
git add apps/web
git commit -m "feat(web): scaffold Vite+React+Tailwind app with role context and API client"
```

---

## Task 11: Dashboard + Utilization Pages

**Files:**
- Create: `apps/web/src/pages/Dashboard.tsx`
- Create: `apps/web/src/pages/Dashboard.test.tsx`
- Create: `apps/web/src/pages/Utilization.tsx`

**Interfaces:**
- Consumes: `useRole` (Task 10), `getRevenueMargin`, `getUtilization`, `RevenueMarginPoint`, `UtilizationPoint` (Task 10)
- Produces: `Dashboard`, `Utilization` page components — consumed by Task 14's route table

> Apply the `ui-ux-pro-max` skill's dashboard/chart styling guidance (spacing, palette, typography) when refining these pages beyond the baseline below.

- [ ] **Step 1: Write the failing test**

```tsx
// apps/web/src/pages/Dashboard.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { RoleProvider } from "../context/RoleContext";
import { Dashboard } from "./Dashboard";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ period: "2026-01-01", revenue: 100000, cost: 70000, margin: 0.3 }],
    })
  );
});

describe("Dashboard", () => {
  it("renders the revenue & margin heading after fetching data", async () => {
    render(
      <RoleProvider>
        <Dashboard />
      </RoleProvider>
    );
    await waitFor(() => expect(screen.getByText("Revenue & Margin")).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/pages/Dashboard.test.tsx`
Expected: FAIL — module does not exist

- [ ] **Step 3: Write Dashboard.tsx**

```tsx
// apps/web/src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useRole } from "../context/RoleContext";
import { getRevenueMargin, type RevenueMarginPoint } from "../lib/api";

export function Dashboard() {
  const { role, scopeId } = useRole();
  const [data, setData] = useState<RevenueMarginPoint[]>([]);

  useEffect(() => {
    getRevenueMargin({ role, scopeId }).then(setData).catch(() => setData([]));
  }, [role, scopeId]);

  return (
    <section className="p-6">
      <h1 className="text-xl font-semibold mb-4">Revenue & Margin</h1>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="revenue" stroke="#2563eb" name="Revenue" />
          <Line type="monotone" dataKey="margin" stroke="#16a34a" name="Margin" />
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/pages/Dashboard.test.tsx`
Expected: PASS

- [ ] **Step 5: Write Utilization.tsx**

```tsx
// apps/web/src/pages/Utilization.tsx
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useRole } from "../context/RoleContext";
import { getUtilization, type UtilizationPoint } from "../lib/api";

export function Utilization() {
  const { role, scopeId } = useRole();
  const [data, setData] = useState<UtilizationPoint[]>([]);

  useEffect(() => {
    getUtilization({ role, scopeId }).then(setData).catch(() => setData([]));
  }, [role, scopeId]);

  return (
    <section className="p-6">
      <h1 className="text-xl font-semibold mb-4">Utilization & Bench</h1>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="avg_allocation_pct" fill="#2563eb" name="Avg Allocation %" />
          <Bar dataKey="bench_pct" fill="#f59e0b" name="Bench %" />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/web
git commit -m "feat(web): add Dashboard and Utilization pages with Recharts"
```

---

## Task 12: Scorecards + Insights Pages

**Files:**
- Create: `apps/web/src/pages/Scorecards.tsx`
- Create: `apps/web/src/pages/Scorecards.test.tsx`
- Create: `apps/web/src/pages/Insights.tsx`

**Interfaces:**
- Consumes: `useRole` (Task 10), `getScorecards`, `getInsight`, `ScorecardEntry` (Task 10)
- Produces: `Scorecards`, `Insights` page components — consumed by Task 14's route table

> Apply the `ui-ux-pro-max` skill's guidance for RAG-status color treatment and card layout.

- [ ] **Step 1: Write the failing test**

```tsx
// apps/web/src/pages/Scorecards.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { RoleProvider } from "../context/RoleContext";
import { Scorecards } from "./Scorecards";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ program_id: 1, program_name: "Modernization", margin: 0.3, rag_status: "green" }],
    })
  );
});

describe("Scorecards", () => {
  it("renders a card per program with margin", async () => {
    render(
      <RoleProvider>
        <Scorecards />
      </RoleProvider>
    );
    await waitFor(() => expect(screen.getByText("Modernization")).toBeInTheDocument());
    expect(screen.getByText("Margin: 30.0%")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/pages/Scorecards.test.tsx`
Expected: FAIL — module does not exist

- [ ] **Step 3: Write Scorecards.tsx**

```tsx
// apps/web/src/pages/Scorecards.tsx
import { useEffect, useState } from "react";
import { useRole } from "../context/RoleContext";
import { getScorecards, type ScorecardEntry } from "../lib/api";

const RAG_COLORS: Record<ScorecardEntry["rag_status"], string> = {
  green: "bg-emerald-100 text-emerald-800",
  yellow: "bg-amber-100 text-amber-800",
  red: "bg-rose-100 text-rose-800",
};

export function Scorecards() {
  const { role, scopeId } = useRole();
  const [entries, setEntries] = useState<ScorecardEntry[]>([]);

  useEffect(() => {
    getScorecards({ role, scopeId }).then(setEntries).catch(() => setEntries([]));
  }, [role, scopeId]);

  return (
    <section className="p-6">
      <h1 className="text-xl font-semibold mb-4">Program Health Scorecards</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {entries.map((entry) => (
          <div key={entry.program_id} className={`rounded-lg p-4 ${RAG_COLORS[entry.rag_status]}`}>
            <p className="font-medium">{entry.program_name}</p>
            <p className="text-sm">Margin: {(entry.margin * 100).toFixed(1)}%</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/pages/Scorecards.test.tsx`
Expected: PASS

- [ ] **Step 5: Write Insights.tsx**

```tsx
// apps/web/src/pages/Insights.tsx
import { useEffect, useState } from "react";
import { useRole } from "../context/RoleContext";
import { getInsight } from "../lib/api";

export function Insights() {
  const { role, scopeId } = useRole();
  const [narrative, setNarrative] = useState("");

  useEffect(() => {
    getInsight({ role, scopeId })
      .then((res) => setNarrative(res.narrative))
      .catch(() => setNarrative(""));
  }, [role, scopeId]);

  return (
    <section className="p-6">
      <h1 className="text-xl font-semibold mb-4">AI Insights</h1>
      <p className="text-sm leading-relaxed bg-slate-50 border border-slate-200 rounded-lg p-4">
        {narrative || "No insight available yet."}
      </p>
    </section>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/web
git commit -m "feat(web): add Scorecards and Insights pages"
```

---

## Task 13: Ask FinSight (NL2SQL) + Uploads Pages

**Files:**
- Create: `apps/web/src/pages/AskFinSight.tsx`
- Create: `apps/web/src/pages/AskFinSight.test.tsx`
- Create: `apps/web/src/pages/Uploads.tsx`

**Interfaces:**
- Consumes: `useRole` (Task 10), `askQuestion`, `uploadDataset`, `NLQResult` (Task 10)
- Produces: `AskFinSight`, `Uploads` page components — consumed by Task 14's route table

- [ ] **Step 1: Write the failing test**

```tsx
// apps/web/src/pages/AskFinSight.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { RoleProvider } from "../context/RoleContext";
import { AskFinSight } from "./AskFinSight";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        sql: "SELECT name FROM accounts",
        rows: [{ name: "Acme" }],
        explanation: "There is one account named Acme.",
      }),
    })
  );
});

describe("AskFinSight", () => {
  it("shows the explanation after asking a question", async () => {
    render(
      <RoleProvider>
        <AskFinSight />
      </RoleProvider>
    );
    await userEvent.type(screen.getByPlaceholderText(/lowest margin/i), "List all accounts");
    await userEvent.click(screen.getByRole("button", { name: /ask/i }));
    await waitFor(() => expect(screen.getByText(/There is one account named Acme/)).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/pages/AskFinSight.test.tsx`
Expected: FAIL — module does not exist

- [ ] **Step 3: Write AskFinSight.tsx**

```tsx
// apps/web/src/pages/AskFinSight.tsx
import { useState } from "react";
import { useRole } from "../context/RoleContext";
import { askQuestion, type NLQResult } from "../lib/api";

export function AskFinSight() {
  const { role, scopeId } = useRole();
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<NLQResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      setResult(await askQuestion(question, { role, scopeId }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="p-6">
      <h1 className="text-xl font-semibold mb-4">Ask FinSight</h1>
      <div className="flex gap-2 mb-4">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Which programs had the lowest margin last quarter?"
          className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm"
        />
        <button
          onClick={handleAsk}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
        >
          {loading ? "Asking..." : "Ask"}
        </button>
      </div>
      {result && (
        <div className="space-y-3">
          <p className="text-sm text-slate-700">{result.explanation}</p>
          <table className="w-full text-sm border border-slate-200">
            <thead>
              <tr>
                {result.rows[0] &&
                  Object.keys(result.rows[0]).map((col) => (
                    <th key={col} className="border-b border-slate-200 text-left px-2 py-1">
                      {col}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((val, j) => (
                    <td key={j} className="border-b border-slate-100 px-2 py-1">
                      {String(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/pages/AskFinSight.test.tsx`
Expected: PASS

- [ ] **Step 5: Write Uploads.tsx**

```tsx
// apps/web/src/pages/Uploads.tsx
import { useRef, useState } from "react";
import { uploadDataset } from "../lib/api";

export function Uploads() {
  const [dataset, setDataset] = useState<"financial" | "utilization">("financial");
  const [status, setStatus] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    setStatus("Uploading...");
    try {
      const res = await uploadDataset(dataset, file);
      setStatus(`Created ${res.created_rows} rows, ${res.errors.length} errors`);
    } catch (err) {
      setStatus(`Upload failed: ${(err as Error).message}`);
    }
  };

  return (
    <section className="p-6">
      <h1 className="text-xl font-semibold mb-4">Upload Data</h1>
      <div className="flex gap-2 items-center mb-4">
        <select
          value={dataset}
          onChange={(e) => setDataset(e.target.value as "financial" | "utilization")}
          className="border border-slate-300 rounded-md px-2 py-1 text-sm"
        >
          <option value="financial">Financial</option>
          <option value="utilization">Utilization</option>
        </select>
        <input ref={inputRef} type="file" accept=".csv,.xlsx" className="text-sm" />
        <button onClick={handleUpload} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm">
          Upload
        </button>
      </div>
      {status && <p className="text-sm text-slate-700">{status}</p>}
    </section>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/web
git commit -m "feat(web): add Ask FinSight (NL2SQL) and Uploads pages"
```

---

## Task 14: App Shell, Routing, and Smoke Test

**Files:**
- Modify: `apps/web/src/App.tsx`
- Create: `apps/web/src/App.test.tsx`

**Interfaces:**
- Consumes: `RoleProvider`, `RoleSwitcher` (Task 10), `Dashboard`, `Utilization` (Task 11), `Scorecards`, `Insights` (Task 12), `AskFinSight`, `Uploads` (Task 13)

- [ ] **Step 1: Install react-router-dom (if not already present from Task 10)**

Run (from `apps/web`): `npm install react-router-dom`

- [ ] **Step 2: Write the failing test**

```tsx
// apps/web/src/App.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import App from "./App";

beforeEach(() => localStorage.clear());

describe("App", () => {
  it("renders the FinSight header and nav links", () => {
    render(<App />);
    expect(screen.getByText("FinSight")).toBeInTheDocument();
    expect(screen.getByText("Ask FinSight")).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- src/App.test.tsx`
Expected: FAIL — nav links not present in default Vite template App

- [ ] **Step 4: Rewrite App.tsx**

```tsx
// apps/web/src/App.tsx
import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import { RoleSwitcher } from "./components/RoleSwitcher";
import { RoleProvider } from "./context/RoleContext";
import { AskFinSight } from "./pages/AskFinSight";
import { Dashboard } from "./pages/Dashboard";
import { Insights } from "./pages/Insights";
import { Scorecards } from "./pages/Scorecards";
import { Uploads } from "./pages/Uploads";
import { Utilization } from "./pages/Utilization";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard" },
  { to: "/utilization", label: "Utilization" },
  { to: "/scorecards", label: "Scorecards" },
  { to: "/insights", label: "Insights" },
  { to: "/ask", label: "Ask FinSight" },
  { to: "/uploads", label: "Uploads" },
];

export default function App() {
  return (
    <RoleProvider>
      <BrowserRouter>
        <header className="flex items-center justify-between px-6 py-3 border-b border-slate-200">
          <span className="font-semibold text-lg">FinSight</span>
          <nav className="flex gap-4 text-sm">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? "font-medium text-blue-600" : "text-slate-600")}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <RoleSwitcher />
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/utilization" element={<Utilization />} />
            <Route path="/scorecards" element={<Scorecards />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/ask" element={<AskFinSight />} />
            <Route path="/uploads" element={<Uploads />} />
          </Routes>
        </main>
      </BrowserRouter>
    </RoleProvider>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- src/App.test.tsx`
Expected: PASS

- [ ] **Step 6: Run full test suites**

Run (from `apps/api`): `pytest -v`
Run (from `apps/web`): `npm run test`
Expected: All PASS

- [ ] **Step 7: Commit**

```bash
git add apps/web
git commit -m "feat(web): wire App shell with routing and role switcher across all pages"
```
