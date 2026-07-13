# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-07-13

## User Preferences

<!-- How the user likes things done. Code style, tools, patterns, communication. -->

## Key Learnings

- **Project:** FinSight (Source) — FastAPI + React financial-insights app
- **Backend Stack:** FastAPI 0.115, SQLAlchemy 2.0, pydantic-settings for config
- **Testing:** pytest with in-memory SQLite (`:memory:`) for test fixtures; conftest.py provides `db_session` and `client` fixtures used across all backend tasks
- **Config Pattern:** Settings class in `app/core/config.py` with environment variable support via pydantic-settings (reads .env)
- **DB Pattern:** Separate engine/SessionLocal in `app/core/db.py`; DeclarativeBase (Base) for ORM models; get_db() as async generator for FastAPI dependency injection
- **ORM Models:** SQLAlchemy 2.0 with Mapped types, mapped_column(), and relationship() for FK references. Model classes must be imported in conftest.py before create_all() so tables register with Base.metadata
- **CORS:** Enabled with `allow_origins=["*"]` for development in main.py
- **Project Structure:** MCP project with `.wolf/` directory for OpenWolf context; task briefs in `.superpowers/sdd/`; git repo at Source root
- **LLM Abstraction Pattern:** Use ABC base class with abstract method, concrete implementations per provider, @lru_cache factory for singleton pattern. Monkeypatch `__init__` in tests to prevent real API calls during unit testing.
- **Dependencies:** anthropic and openai packages in requirements.txt may need explicit pip install even if listed — check installation before running tests.
- **NL2SQL Safety Guard (Task 9):** `validate_select_only` in `app/services/nl2sql.py` is a keyword-blocklist guard (must start with "select", rejects insert/update/delete/drop/alter/create/truncate/attach/`;`), not a full SQL parser. It correctly blocks all required attack cases (DELETE, stacked `;` statements, UPDATE, TRUNCATE, comment-hidden DROP) but does NOT block semantic data-exfiltration via UNION SELECT (e.g. `SELECT * FROM accounts UNION SELECT * FROM sqlite_master`) since that still starts with SELECT and contains no forbidden keyword. This is an accepted limitation per the task-9 brief's exact spec — do not silently expand scope to add a real SQL parser without being asked.

- **Scope-Options Router (Task 15):** `app/routers/scope_options.py` powers frontend scope pickers — `GET /scope-options/accounts` (all accounts, unfiltered) and `GET /scope-options/programs?account_id=` (optionally filtered). Deliberately has NO `get_role_scope` dependency: these list endpoints let a UI populate a picker *before* a scope is chosen, so they must return the full unfiltered universe of options, not a role-restricted subset.
- **NL2SQL Scoping is Prompt-Level Only (Task 15):** `run_query(db, question, scope)` / `question_to_sql(question, scope)` in `app/services/nl2sql.py` now take a `RoleScope` and inject a plain-English restriction hint into the prompt (e.g. "Restrict results to program_id = 5") when `scope.role != "area_director"` and `scope.scope_id is not None`. This is NOT enforced by parsing/rewriting the generated SQL — it's a convenience hint, matching the rest of the app's fail-open role-scoping model (see docs/superpowers/specs/2026-07-13-finsight-mvp-design.md). Do not add real SQL-rewrite enforcement without an explicit ask.

- **Frontend Stack (Task 10):** Vite + React 19 + TypeScript, Tailwind v3 (NOT v4 — see Do-Not-Repeat), Radix UI (`@radix-ui/react-select`), Recharts, react-router-dom, Vitest + React Testing Library. `apps/web/src/lib/api.ts` is the single typed fetch client all dashboard/insight/NLQ pages import; every call takes a `RequestOptions { role, scopeId? }` that maps to `X-Role`/`X-Scope-Id` headers, mirroring the backend's role-scoping dependency from Task 3.
- **Role Context Pattern:** `apps/web/src/context/RoleContext.tsx` exposes `RoleProvider`/`useRole()`, persists the selected role to `localStorage["finsight_role"]`, and defaults to `"area_director"`. `scopeId` is currently hardcoded `null` — later tasks will likely need to populate it from a scope picker.
- **Vitest + Radix + jsdom gotchas:** jsdom is missing `hasPointerCapture`/`setPointerCapture`/`releasePointerCapture`/`scrollIntoView`, all used by Radix's Select; polyfill them as no-ops in the shared `setupTests.ts`. Also import `@testing-library/jest-dom/vitest` (not the bare `@testing-library/jest-dom`) so matchers register against Vitest's `expect` instead of assuming Jest globals, and explicitly call RTL's `cleanup()` in an `afterEach` since Vitest doesn't auto-register it without `test.globals: true`.

## Do-Not-Repeat

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->
- [2026-07-13] Any FastAPI router test that exercises a DB write through the `client` fixture will hit `sqlite3.OperationalError: no such table` unless the `db_session` fixture's `create_engine("sqlite:///:memory:", ...)` also passes `poolclass=StaticPool`. TestClient runs the route handler (sync or async) in a different thread than the test/fixture thread; without StaticPool each thread gets its own separate `:memory:` database. Fixed once in `apps/api/tests/conftest.py` — do not revert this when touching conftest.py.
- [2026-07-13] In `apps/web`, never `npm install -D tailwindcss` without a version pin — "latest" resolves to Tailwind v4, which drops the `tailwindcss init` CLI and the classic `tailwind.config.js`/`postcss.config.js`/`@tailwind` directive model this project's briefs assume. Always install `tailwindcss@^3` explicitly.
- [2026-07-13] `@radix-ui/react-select` needs `tslib` at runtime (via `react-remove-scroll`) but doesn't reliably pull it in; install `tslib` directly whenever adding this Radix package to a fresh app. Also remember the jsdom pointer-capture polyfills and the `@testing-library/jest-dom/vitest` import path (see Key Learnings) — both are needed the first time Radix Select is tested under Vitest.

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->
