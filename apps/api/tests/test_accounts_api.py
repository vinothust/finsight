import pytest

from app.core.security import hash_password
from app.models.cluster import Cluster
from app.models.project import Project
from app.models.user import User

CSRF = {"X-Requested-With": "XMLHttpRequest"}


def _seed_cluster(db_session, name="North America") -> Cluster:
    cluster = Cluster(name=name)
    db_session.add(cluster)
    db_session.commit()
    return cluster


def test_create_list_get_update_delete_account(authed_client, db_session):
    client, _ = authed_client(role="admin")
    cluster = _seed_cluster(db_session)

    create_response = client.post("/accounts", json={"name": "Acme Corp", "cluster_id": cluster.id}, headers=CSRF)
    assert create_response.status_code == 201
    account_id = create_response.json()["account"]["id"]

    list_response = client.get("/accounts")
    body = list_response.json()
    assert body["total"] == 1
    assert body["accounts"][0]["name"] == "Acme Corp"
    assert body["accounts"][0]["project_count"] == 0

    detail_response = client.get(f"/accounts/{account_id}")
    assert detail_response.json()["account"]["projects"] == []

    patch_response = client.patch(f"/accounts/{account_id}", json={"name": "Acme"}, headers=CSRF)
    assert patch_response.json()["account"]["name"] == "Acme"

    delete_response = client.delete(f"/accounts/{account_id}", headers=CSRF)
    assert delete_response.status_code == 200
    assert client.get(f"/accounts/{account_id}").status_code == 404


def test_create_account_with_unknown_cluster_returns_404(authed_client):
    client, _ = authed_client(role="admin")
    response = client.post("/accounts", json={"name": "Acme Corp", "cluster_id": 999}, headers=CSRF)
    assert response.status_code == 404


@pytest.mark.parametrize("role", ["cluster_head", "account_director", "project_manager"])
def test_non_admin_roles_get_403_on_accounts(authed_client, role):
    client, _ = authed_client(role=role, email=f"{role}@test.dev")
    assert client.get("/accounts").status_code == 403


def test_account_filter_by_cluster_id_and_search(authed_client, db_session):
    client, _ = authed_client(role="admin")
    cluster1 = _seed_cluster(db_session, "Cluster One")
    cluster2 = _seed_cluster(db_session, "Cluster Two")
    client.post("/accounts", json={"name": "Acme", "cluster_id": cluster1.id}, headers=CSRF)
    client.post("/accounts", json={"name": "Globex", "cluster_id": cluster2.id}, headers=CSRF)

    filtered = client.get(f"/accounts?cluster_id={cluster1.id}")
    assert [a["name"] for a in filtered.json()["accounts"]] == ["Acme"]

    searched = client.get("/accounts?search=glob")
    assert [a["name"] for a in searched.json()["accounts"]] == ["Globex"]


def test_delete_account_blocked_when_it_has_projects(authed_client, db_session):
    client, _ = authed_client(role="admin")
    cluster = _seed_cluster(db_session)
    create_response = client.post("/accounts", json={"name": "Acme Corp", "cluster_id": cluster.id}, headers=CSRF)
    account_id = create_response.json()["account"]["id"]

    db_session.add(Project(name="Modernization", account_id=account_id))
    db_session.commit()

    response = client.delete(f"/accounts/{account_id}", headers=CSRF)
    assert response.status_code == 409


def test_post_account_with_directors_assigns_them(authed_client, db_session):
    client, _ = authed_client(role="admin")
    cluster = _seed_cluster(db_session)
    director = User(
        name="Director", email="director@test.dev", password_hash=hash_password("pw"), role="account_director"
    )
    db_session.add(director)
    db_session.commit()

    response = client.post(
        "/accounts",
        json={"name": "Acme Corp", "cluster_id": cluster.id, "directors": [director.id]},
        headers=CSRF,
    )
    assert response.status_code == 201
    assert [d["id"] for d in response.json()["account"]["directors"]] == [director.id]


def test_patch_account_directors_rejects_role_mismatch(authed_client, db_session):
    client, _ = authed_client(role="admin")
    cluster = _seed_cluster(db_session)
    create_response = client.post("/accounts", json={"name": "Acme Corp", "cluster_id": cluster.id}, headers=CSRF)
    account_id = create_response.json()["account"]["id"]

    wrong_role_user = User(name="PM", email="pm@test.dev", password_hash=hash_password("pw"), role="project_manager")
    db_session.add(wrong_role_user)
    db_session.commit()

    response = client.patch(f"/accounts/{account_id}", json={"directors": [wrong_role_user.id]}, headers=CSRF)
    assert response.status_code == 400
