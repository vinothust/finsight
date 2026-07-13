# FinSight

Financial insight analytics for program managers, account directors, and area directors. CSV/XLSX ingestion, revenue/margin and utilization dashboards, RAG health scorecards, AI-generated narrative insights, and an NL2SQL "Ask FinSight" query agent — scoped by a role switcher (no auth in this MVP).

## Structure

```
apps/
  api/   FastAPI + SQLAlchemy + PostgreSQL backend
  web/   Vite + React + TypeScript + Tailwind + Radix UI frontend
```

Each app manages its own dependencies independently. The root `package.json` only adds a thin `concurrently`-based orchestration layer to run/install both with one command — it is not a shared build tool.

## Prerequisites

- Python 3.11+
- Node 20+
- PostgreSQL running locally (or update `DATABASE_URL` to point elsewhere)
- [gcloud CLI](https://cloud.google.com/sdk/docs/install) with Application Default Credentials set up for Vertex AI (see below) — no API key needed

## Quick start (recommended)

From the repo root:

```bash
npm install              # installs the root orchestration tooling (concurrently)
npm run install:all      # installs apps/web (npm) and apps/api (pip) dependencies
```

Then create `apps/api/.env` (see [LLM / Vertex AI setup](#llm--vertex-ai-setup) below) and create the database tables once:

```bash
cd apps/api && python -c "from app.core.db import Base, engine; import app.models; Base.metadata.create_all(engine)" && cd ../..
```

Run both apps with a single command:

```bash
npm run dev
```

This starts the API on `http://localhost:8001` and the web app on `http://localhost:5173` (Vite picks the next free port if 5173 is taken) concurrently, labeled `API`/`WEB` in the combined log output. Stop both with `Ctrl+C`.

Run both test suites with a single command:

```bash
npm run test
```

> Port 8000 is used by some environments (e.g. Windows/Hyper-V/WSL port reservations) — this project defaults the API to **8001** to avoid that. If 8001 is also unavailable, edit the `dev`/`test` scripts in the root `package.json` and `apps/web/src/lib/api.ts`'s `API_BASE` fallback together.

## LLM / Vertex AI setup

FinSight uses **Google Vertex AI (Gemini)** for AI narrative insights and the NL2SQL "Ask FinSight" agent, authenticated via your **local gcloud account** (Application Default Credentials) — no API key is stored or required.

```bash
gcloud auth application-default login
gcloud config set project <your-gcp-project-id>
```

Model selection is tiered and configurable **at runtime from the Settings page** (`/settings` in the web app) or via the `GET`/`PUT /llm-settings` API — no restart needed to change it:

| Tier | Used for | Default model |
|---|---|---|
| Simple | Narration, guardrailing, small operations (AI Insights narrative, NL2SQL result explanation) | `gemini-2.5-flash-lite` |
| Complex | Query generation and other heavy operations (NL2SQL SQL generation) | `gemini-2.5-flash` |
| Fallback | Automatically retried once if the tiered model call fails | `gemini-2.5-pro` |

Optional `apps/api/.env` (all fields optional — seeds the initial DB row on first run; change anytime via the Settings page after that):

```
DATABASE_URL=postgresql+psycopg://finsight:finsight@localhost:5432/finsight
GCP_PROJECT=your-gcp-project-id
GCP_LOCATION=us-central1
```

## Backend (`apps/api`) — run standalone

```bash
cd apps/api
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

Run tests: `pytest -v`. API docs at `http://localhost:8001/docs` once running.

Database tables are created directly from the SQLAlchemy models (no migrations wired up yet — `alembic` is a listed dependency for future use):

```bash
python -c "from app.core.db import Base, engine; import app.models; Base.metadata.create_all(engine)"
```

## Frontend (`apps/web`) — run standalone

```bash
cd apps/web
npm install
npm run dev
```

Run tests: `npm run test`. Build for production: `npm run build`.

Optionally set the API base URL in `apps/web/.env` (defaults to `http://localhost:8001`):

```
VITE_API_BASE_URL=http://localhost:8001
```

## Using the app

Use the role switcher (top right) to view the app as a Program Manager, Account Director, or Area Director — Account Directors and PMs get a scope picker to filter to a specific account/program; Area Director sees everything unscoped. Upload sample data (CSV/XLSX) via the Uploads page before the dashboards, scorecards, and insights have anything to show.

## Notes

- Role-based scoping is a UI convenience for this MVP, not an authentication/security boundary — there is no login.
- NL2SQL's role-scoping is a prompt-level hint to the model, not a hard SQL rewrite, consistent with the rest of the app's no-auth scoping model.
