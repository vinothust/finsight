from datetime import date

import pytest

from app.core.security import hash_password
from app.models.account import Account
from app.models.cluster import Cluster
from app.models.financial_record import FinancialRecord
from app.models.user import User

CSRF = {"X-Requested-With": "XMLHttpRequest"}


def _seed_account(db_session, name="Acme Corp") -> Account:
    cluster = Cluster(name=f"Cluster for {name}")
    db_session.add(cluster)
    db_session.flush()
    account = Account(name=name, cluster_id=cluster.id)
    db_session.add(account)
    db_session.commit()
    return account


def test_create_list_get_update_delete_project(authed_client, db_session):
    client, _ = authed_client(role="admin")
    account = _seed_account(db_session)

    create_response = client.post(
        "/projects", json={"name": "Modernization", "account_id": account.id}, headers=CSRF
    )
    assert create_response.status_code == 201
    project_id = create_response.json()["project"]["id"]

    list_response = client.get("/projects")
    body = list_response.json()
    assert body["total"] == 1
    assert body["projects"][0]["name"] == "Modernization"
    assert body["projects"][0]["status"] == "active"

    detail_response = client.get(f"/projects/{project_id}")
    assert detail_response.json()["project"]["managers"] == []

    patch_response = client.patch(f"/projects/{project_id}", json={"status": "on_hold"}, headers=CSRF)
    assert patch_response.json()["project"]["status"] == "on_hold"

    delete_response = client.delete(f"/projects/{project_id}", headers=CSRF)
    assert delete_response.status_code == 200
    assert client.get(f"/projects/{project_id}").status_code == 404


def test_create_project_with_unknown_account_returns_404(authed_client):
    client, _ = authed_client(role="admin")
    response = client.post("/projects", json={"name": "Modernization", "account_id": 999}, headers=CSRF)
    assert response.status_code == 404


@pytest.mark.parametrize("role", ["cluster_head", "account_director", "project_manager"])
def test_non_admin_roles_get_403_on_projects(authed_client, role):
    client, _ = authed_client(role=role, email=f"{role}@test.dev")
    assert client.get("/projects").status_code == 403


def test_project_filter_by_account_id(authed_client, db_session):
    client, _ = authed_client(role="admin")
    account1 = _seed_account(db_session, "Acme")
    account2 = _seed_account(db_session, "Globex")
    client.post("/projects", json={"name": "Proj A", "account_id": account1.id}, headers=CSRF)
    client.post("/projects", json={"name": "Proj B", "account_id": account2.id}, headers=CSRF)

    filtered = client.get(f"/projects?account_id={account1.id}")
    assert [p["name"] for p in filtered.json()["projects"]] == ["Proj A"]


def test_delete_project_blocked_when_it_has_financial_records(authed_client, db_session):
    client, _ = authed_client(role="admin")
    account = _seed_account(db_session)
    create_response = client.post(
        "/projects", json={"name": "Modernization", "account_id": account.id}, headers=CSRF
    )
    project_id = create_response.json()["project"]["id"]

    db_session.add(FinancialRecord(project_id=project_id, period=date(2026, 1, 1), revenue=1000, cost=800))
    db_session.commit()

    response = client.delete(f"/projects/{project_id}", headers=CSRF)
    assert response.status_code == 409


def test_post_project_with_managers_assigns_them(authed_client, db_session):
    client, _ = authed_client(role="admin")
    account = _seed_account(db_session)
    manager = User(name="PM", email="pm@test.dev", password_hash=hash_password("pw"), role="project_manager")
    db_session.add(manager)
    db_session.commit()

    response = client.post(
        "/projects",
        json={"name": "Modernization", "account_id": account.id, "managers": [manager.id]},
        headers=CSRF,
    )
    assert response.status_code == 201
    assert [m["id"] for m in response.json()["project"]["managers"]] == [manager.id]


def test_patch_project_managers_rejects_role_mismatch(authed_client, db_session):
    client, _ = authed_client(role="admin")
    account = _seed_account(db_session)
    create_response = client.post(
        "/projects", json={"name": "Modernization", "account_id": account.id}, headers=CSRF
    )
    project_id = create_response.json()["project"]["id"]

    wrong_role_user = User(
        name="Director", email="director@test.dev", password_hash=hash_password("pw"), role="account_director"
    )
    db_session.add(wrong_role_user)
    db_session.commit()

    response = client.patch(f"/projects/{project_id}", json={"managers": [wrong_role_user.id]}, headers=CSRF)
    assert response.status_code == 400
