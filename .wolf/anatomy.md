# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-07-13T08:41:15.534Z
> Files: 41 tracked | Anatomy hits: 0 | Misses: 0

## ../../../Users/180655/AppData/Local/Temp/claude/c--Vino-FinSight-Source/9a861225-893c-4e78-9ebb-113290c5fed6/scratchpad/

- `probe.py` — override_get_db (~282 tok)

## ./

- `.gitignore` — Git ignore rules (~41 tok)
- `CLAUDE.md` — OpenWolf (~57 tok)

## .claude/

- `settings.json` (~441 tok)

## .claude/rules/

- `openwolf.md` (~313 tok)

## .superpowers/sdd/

- `task-1-report.md` — Task 1 Report: Backend Project Scaffold (~785 tok)
- `task-2-report.md` — Task 2 Report: Database Models (~954 tok)
- `task-3-report.md` — Task 3 Report: Role Scoping Dependency (~1094 tok)
- `task-4-report.md` — Task 4 Report: Ingestion Service + Uploads Router (~1741 tok)
- `task-5-report.md` — Task 5 Report: Dashboard Aggregation Service + Router (~817 tok)

## apps/api/

- `requirements.txt` — Python dependencies (~59 tok)

## apps/api/app/

- `__init__.py` (~0 tok)
- `deps.py` — Role-scoping dependency: RoleScope dataclass, get_role_scope (~148 tok)
- `main.py` — API: 1 endpoints (~119 tok)

## apps/api/app/core/

- `__init__.py` (~0 tok)
- `config.py` — Declares Settings (~108 tok)
- `db.py` — Base: get_db (~124 tok)

## apps/api/app/models/

- `__init__.py` — Exports all 5 models (~90 tok)
- `account.py` — Account ORM model (~131 tok)
- `financial_record.py` — FinancialRecord ORM model with margin property (~198 tok)
- `program.py` — Program ORM model (~150 tok)
- `upload.py` — Upload ORM model (~155 tok)
- `utilization_record.py` — UtilizationRecord ORM model (~175 tok)

## apps/api/app/routers/

- `__init__.py` (~0 tok)
- `dashboard.py` — API: 2 endpoints (~183 tok)
- `uploads.py` — API: 2 endpoints (~359 tok)

## apps/api/app/schemas/

- `__init__.py` (~0 tok)
- `upload.py` — Declares UploadOut (~72 tok)

## apps/api/app/services/

- `__init__.py` (~0 tok)
- `dashboard.py` — revenue_margin_summary, utilization_summary (~734 tok)
- `ingestion.py` — ingest_financial, ingest_utilization (~969 tok)

## apps/api/tests/

- `__init__.py` (~0 tok)
- `conftest.py` — db_session, client, override_get_db (~237 tok)
- `test_dashboard.py` — test_revenue_margin_summary_aggregates_across_all_programs, test_revenue_margin_summary_scoped_to_si (~615 tok)
- `test_deps.py` — Tests for RoleScope: defaults, fallback, scoped pm (~150 tok)
- `test_health.py` — test_health_endpoint (~45 tok)
- `test_ingestion.py` — test_ingest_financial_creates_records, test_ingest_financial_missing_columns, test_ingest_utilizatio (~294 tok)
- `test_models.py` — test_account_program_financial_record_relationship (~215 tok)
- `test_uploads_api.py` — test_upload_financial_endpoint, test_upload_unknown_dataset_returns_400 (~194 tok)

## docs/superpowers/plans/

- `2026-07-13-finsight-mvp.md` — FinSight MVP Implementation Plan (~17979 tok)

## docs/superpowers/specs/

- `2026-07-13-finsight-mvp-design.md` — FinSight MVP — Design Spec (~1099 tok)
