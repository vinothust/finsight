# FinSight MVP — Design Spec

## Purpose
Financial insight analytics app for UST Global program managers (PM), account directors (AD), and area directors (ArD). Ingest financial/utilization data via file upload, surface revenue/margin/utilization/health dashboards, and let users ask natural-language questions over the data (NLP2SQL agent) with AI-generated narrative insights.

## Monorepo Structure
```
FinSight/
├── apps/
│   ├── api/          # FastAPI backend
│   └── web/          # Vite + React + TS + Tailwind + Radix UI
├── docs/
├── CLAUDE.md, .wolf/, .claude/   # existing tooling
```
No monorepo build tool (pnpm workspaces/Turborepo) — plain folder split, each app manages its own deps.

## Backend (apps/api)

**Stack**: FastAPI, SQLAlchemy 2.0, PostgreSQL, Alembic, Pydantic v2, pandas/openpyxl for parsing.

**Structure**
- `core/` — settings (env-driven), DB session/engine, LLM client factory (pluggable: Anthropic default, OpenAI alt, selected via `LLM_PROVIDER` env var)
- `models/` — `Account`, `Program`, `FinancialRecord` (revenue, cost, margin, period), `UtilizationRecord` (resource, allocation %, bench flag, period), `Upload` (file metadata, status, row errors)
- `schemas/` — Pydantic request/response models mirrored by frontend TS types
- `routers/`:
  - `uploads` — POST file (CSV/XLSX) → parse → validate → persist; GET upload status/history
  - `dashboard` — revenue/margin aggregates, utilization/bench aggregates, filtered by role scope
  - `scorecards` — RAG health status per account/program (rule-based thresholds on margin/utilization variance)
  - `insights` — LLM-generated narrative summary over current aggregates for the active role scope
  - `nlq` — NL→SQL: accepts question + role scope, generates schema-aware read-only SQL via LLM, validates SELECT-only, executes, returns rows + LLM explanation
- `services/`:
  - `ingestion.py` — file parsing, column mapping/validation, row-level error collection
  - `scorecards.py` — RAG threshold calculation
  - `llm/` — provider-agnostic client interface + Anthropic/OpenAI implementations
  - `nl2sql.py` — schema introspection, prompt construction, SQL safety guard (reject non-SELECT/DDL/DML), execution, result summarization

**Role scoping (no auth)**: client sends `X-Role: pm|account_director|area_director` header + optional `X-Scope-Id` (program/account id). Backend filters queries accordingly; `area_director` sees all. This is a view-mode convention, not a security boundary — acceptable for MVP.

**Error handling**: global exception handlers → uniform `{error, detail}` JSON; upload endpoint returns per-row parse/validation errors without failing the whole batch; nl2sql rejects unsafe SQL before execution with a clear error.

## Frontend (apps/web)

**Stack**: Vite, React, TypeScript, TailwindCSS, Radix UI primitives, Recharts for charts.

**UX process**: Invoke the `ui-ux-pro-max` skill during implementation for dashboard layout, color palette, typography pairing, and chart styling decisions — not ad-hoc styling.

**Pages**
- Dashboard — revenue/margin trend & breakdown charts (line/bar via Recharts)
- Utilization — allocation/bench charts, utilization heatmap-style view
- Scorecards — RAG status grid per account/program
- Insights — feed of AI-generated narrative summaries
- Ask FinSight — NL2SQL chat-style query box: question in, result table + chart (where applicable) + explanation out
- Uploads — drag-drop CSV/XLSX, upload history with row-error detail

**Cross-cutting**
- Role switcher in top nav (PM/AD/ArD), persisted in localStorage, sent as header on every API call
- `lib/api.ts` — typed API client
- Shared TS types mirroring backend Pydantic schemas

## Data Flow
Upload → parse/validate → persist normalized records → dashboard/scorecard endpoints aggregate on read → insights endpoint runs LLM over current aggregates → NL2SQL endpoint runs LLM to translate question→SQL → execute (read-only) → summarize.

## Testing
- Backend: pytest — ingestion parsing/validation, scorecard threshold logic, nl2sql SQL-safety guard, role-scoping filters
- Frontend: Vitest + React Testing Library — role switcher, chart rendering with mock data, upload flow

## Out of Scope (MVP)
- Real auth/identity (role is a UI view-mode only)
- Live integrations with enterprise systems (SAP/PSA/HRMS) — upload-based ingestion only
- Multi-tenant/org isolation beyond role scoping
