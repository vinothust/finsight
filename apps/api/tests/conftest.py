import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.db import Base, get_db
import app.models  # noqa: F401
from app.main import app


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
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
    # https:// base_url (not http://) so httpx's cookie jar will actually send back
    # the Secure cookies /auth/login sets - the ASGI transport never makes a real
    # network call, so the scheme only affects cookie-jar policy, not routing.
    yield TestClient(app, base_url="https://testserver")
    app.dependency_overrides.clear()
