"""One-off DB bootstrap: creates all tables (there is no Alembic migration
setup in this project - only tests create schema, via an ephemeral in-memory
SQLite database in conftest.py) and seeds the four dev users against
whatever DATABASE_URL is configured in apps/api/.env.

Run from apps/api/:
    python -m scripts.init_db
"""

import app.models  # noqa: F401 - populates Base.metadata with every mapped table
from app.core.db import Base, SessionLocal, engine
from app.core.seed import run_seed


def main() -> None:
    Base.metadata.create_all(engine)
    session = SessionLocal()
    try:
        run_seed(session)
    finally:
        session.close()
    print("Database initialized: tables created and dev users seeded (if not already present).")


if __name__ == "__main__":
    main()
