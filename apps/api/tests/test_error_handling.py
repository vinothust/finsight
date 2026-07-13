from fastapi import APIRouter
from fastapi.testclient import TestClient

from app.main import app


def test_unhandled_exception_returns_500_with_cors_header():
    boom_router = APIRouter()

    @boom_router.get("/__boom")
    def boom():
        raise RuntimeError("kaboom")

    app.include_router(boom_router)
    client = TestClient(app, raise_server_exceptions=False)

    response = client.get("/__boom", headers={"Origin": "http://localhost:5175"})

    assert response.status_code == 500
    assert response.json()["error"] == "internal_server_error"
    assert response.headers["access-control-allow-origin"] == "http://localhost:5175"
