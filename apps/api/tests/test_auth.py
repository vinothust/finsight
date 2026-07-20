from app.core.security import hash_password
from app.models.user import User

CSRF_HEADERS = {"X-Requested-With": "XMLHttpRequest"}


def _seed_user(db_session, email="user@test.dev", password="TestPassword123!", role="admin") -> User:
    user = User(name="Test User", email=email, password_hash=hash_password(password), role=role)
    db_session.add(user)
    db_session.commit()
    return user


def test_login_rejects_missing_csrf_header(client, db_session):
    _seed_user(db_session)
    response = client.post("/auth/login", json={"email": "user@test.dev", "password": "TestPassword123!"})
    assert response.status_code == 403


def test_login_rejects_wrong_password(client, db_session):
    _seed_user(db_session)
    response = client.post(
        "/auth/login",
        json={"email": "user@test.dev", "password": "wrong"},
        headers=CSRF_HEADERS,
    )
    assert response.status_code == 401


def test_login_success_sets_cookies_and_returns_user(client, db_session):
    _seed_user(db_session)
    response = client.post(
        "/auth/login",
        json={"email": "user@test.dev", "password": "TestPassword123!"},
        headers=CSRF_HEADERS,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["user"]["email"] == "user@test.dev"
    assert "finsight_access_token" in response.cookies
    assert "finsight_refresh_token" in response.cookies
    # tokens never appear in the JSON body
    assert "accessToken" not in body
    assert "refreshToken" not in body


def test_me_requires_authentication(client):
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_me_returns_current_user_after_login(client, db_session):
    _seed_user(db_session, role="project_manager")
    client.post(
        "/auth/login",
        json={"email": "user@test.dev", "password": "TestPassword123!"},
        headers=CSRF_HEADERS,
    )
    response = client.get("/auth/me")
    assert response.status_code == 200
    assert response.json()["user"]["role"] == "project_manager"


def test_refresh_rotates_token_and_old_one_stops_working(client, db_session):
    _seed_user(db_session)
    client.post(
        "/auth/login",
        json={"email": "user@test.dev", "password": "TestPassword123!"},
        headers=CSRF_HEADERS,
    )
    old_refresh_cookie = client.cookies.get("finsight_refresh_token")

    response = client.post("/auth/refresh", headers=CSRF_HEADERS)
    assert response.status_code == 200
    new_refresh_cookie = client.cookies.get("finsight_refresh_token")
    assert new_refresh_cookie != old_refresh_cookie

    # replay the old refresh cookie explicitly - it must be rejected
    client.cookies.set("finsight_refresh_token", old_refresh_cookie)
    replay_response = client.post("/auth/refresh", headers=CSRF_HEADERS)
    assert replay_response.status_code == 401


def test_me_includes_department(client, db_session):
    user = _seed_user(db_session)
    user.department = "Finance"
    db_session.commit()
    client.post(
        "/auth/login",
        json={"email": "user@test.dev", "password": "TestPassword123!"},
        headers=CSRF_HEADERS,
    )
    response = client.get("/auth/me")
    assert response.status_code == 200
    assert response.json()["user"]["department"] == "Finance"


def test_logout_clears_session(client, db_session):
    _seed_user(db_session)
    client.post(
        "/auth/login",
        json={"email": "user@test.dev", "password": "TestPassword123!"},
        headers=CSRF_HEADERS,
    )
    response = client.post("/auth/logout", headers=CSRF_HEADERS)
    assert response.status_code == 200

    me_response = client.get("/auth/me")
    assert me_response.status_code == 401
