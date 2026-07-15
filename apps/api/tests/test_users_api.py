import pytest

from app.core.security import hash_password
from app.models.user import User

CSRF = {"X-Requested-With": "XMLHttpRequest"}


def test_create_list_get_update_delete_user(authed_client):
    client, _ = authed_client(role="admin")

    create_response = client.post(
        "/users",
        json={"name": "Priya Manager", "email": "priya@test.dev", "role": "project_manager"},
        headers=CSRF,
    )
    assert create_response.status_code == 201
    body = create_response.json()
    user_id = body["user"]["id"]
    assert body["user"]["is_active"] is True
    assert "temp_password" in body and len(body["temp_password"]) > 0

    list_response = client.get("/users")
    assert list_response.json()["total"] >= 2  # the admin fixture user + the new one

    detail_response = client.get(f"/users/{user_id}")
    assert detail_response.json()["user"]["email"] == "priya@test.dev"

    patch_response = client.patch(f"/users/{user_id}", json={"department": "Delivery"}, headers=CSRF)
    assert patch_response.json()["user"]["department"] == "Delivery"

    delete_response = client.delete(f"/users/{user_id}", headers=CSRF)
    assert delete_response.status_code == 200
    assert client.get(f"/users/{user_id}").json()["user"]["is_active"] is False


def test_create_user_with_invalid_role_returns_400(authed_client):
    client, _ = authed_client(role="admin")
    response = client.post(
        "/users", json={"name": "X", "email": "x@test.dev", "role": "superuser"}, headers=CSRF
    )
    assert response.status_code == 400


def test_create_user_with_duplicate_email_returns_409(authed_client):
    client, _ = authed_client(role="admin")
    client.post("/users", json={"name": "A", "email": "dup@test.dev", "role": "project_manager"}, headers=CSRF)
    response = client.post(
        "/users", json={"name": "B", "email": "dup@test.dev", "role": "project_manager"}, headers=CSRF
    )
    assert response.status_code == 409


@pytest.mark.parametrize("role", ["cluster_head", "account_director", "project_manager"])
def test_non_admin_roles_get_403_on_users(authed_client, role):
    client, _ = authed_client(role=role, email=f"{role}@test.dev")
    assert client.get("/users").status_code == 403


def test_users_search_and_role_filter(authed_client):
    client, _ = authed_client(role="admin")
    client.post("/users", json={"name": "Alpha PM", "email": "alpha@test.dev", "role": "project_manager"}, headers=CSRF)
    client.post(
        "/users", json={"name": "Beta Director", "email": "beta@test.dev", "role": "account_director"}, headers=CSRF
    )

    search_response = client.get("/users?search=alpha")
    assert [u["name"] for u in search_response.json()["users"]] == ["Alpha PM"]

    role_response = client.get("/users?role=account_director")
    names = [u["name"] for u in role_response.json()["users"]]
    assert "Beta Director" in names
    assert "Alpha PM" not in names


def test_temp_password_from_create_user_can_log_in(client, db_session):
    admin = User(name="Admin", email="admin@test.dev", password_hash=hash_password("AdminPw123!"), role="admin")
    db_session.add(admin)
    db_session.commit()
    client.post("/auth/login", json={"email": "admin@test.dev", "password": "AdminPw123!"}, headers=CSRF)

    create_response = client.post(
        "/users", json={"name": "Priya", "email": "priya@test.dev", "role": "project_manager"}, headers=CSRF
    )
    temp_password = create_response.json()["temp_password"]

    login_response = client.post(
        "/auth/login", json={"email": "priya@test.dev", "password": temp_password}, headers=CSRF
    )
    assert login_response.status_code == 200


def test_deleted_user_cannot_log_in(authed_client):
    client, _ = authed_client(role="admin")
    create_response = client.post(
        "/users", json={"name": "Priya", "email": "priya@test.dev", "role": "project_manager"}, headers=CSRF
    )
    user_id = create_response.json()["user"]["id"]
    temp_password = create_response.json()["temp_password"]

    client.delete(f"/users/{user_id}", headers=CSRF)

    login_response = client.post(
        "/auth/login", json={"email": "priya@test.dev", "password": temp_password}, headers=CSRF
    )
    assert login_response.status_code == 401
