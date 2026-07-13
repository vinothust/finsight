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

## Do-Not-Repeat

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->
- [2026-07-13] Any FastAPI router test that exercises a DB write through the `client` fixture will hit `sqlite3.OperationalError: no such table` unless the `db_session` fixture's `create_engine("sqlite:///:memory:", ...)` also passes `poolclass=StaticPool`. TestClient runs the route handler (sync or async) in a different thread than the test/fixture thread; without StaticPool each thread gets its own separate `:memory:` database. Fixed once in `apps/api/tests/conftest.py` — do not revert this when touching conftest.py.

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->
