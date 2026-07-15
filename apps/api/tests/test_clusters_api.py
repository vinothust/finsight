import pytest

from app.core.security import hash_password
from app.models.account import Account
from app.models.user import User

CSRF = {"X-Requested-With": "XMLHttpRequest"}


def test_create_list_get_update_delete_cluster(authed_client):
    client, _ = authed_client(role="admin")

    create_response = client.post(
        "/clusters", json={"name": "North America", "description": "NA region"}, headers=CSRF
    )
    assert create_response.status_code == 201
    cluster_id = create_response.json()["cluster"]["id"]

    list_response = client.get("/clusters")
    assert list_response.status_code == 200
    body = list_response.json()
    assert body["total"] == 1
    assert body["clusters"][0]["name"] == "North America"
    assert body["clusters"][0]["account_count"] == 0

    detail_response = client.get(f"/clusters/{cluster_id}")
    assert detail_response.status_code == 200
    assert detail_response.json()["cluster"]["accounts"] == []

    patch_response = client.patch(f"/clusters/{cluster_id}", json={"name": "NA"}, headers=CSRF)
    assert patch_response.status_code == 200
    assert patch_response.json()["cluster"]["name"] == "NA"

    delete_response = client.delete(f"/clusters/{cluster_id}", headers=CSRF)
    assert delete_response.status_code == 200
    assert client.get(f"/clusters/{cluster_id}").status_code == 404


@pytest.mark.parametrize("role", ["cluster_head", "account_director", "project_manager"])
def test_non_admin_roles_get_403_on_clusters(authed_client, role):
    client, _ = authed_client(role=role, email=f"{role}@test.dev")
    assert client.get("/clusters").status_code == 403
    assert client.post("/clusters", json={"name": "X"}, headers=CSRF).status_code == 403


def test_cluster_search_and_pagination(authed_client):
    client, _ = authed_client(role="admin")
    for name in ["Zeta", "Alpha", "Beta"]:
        client.post("/clusters", json={"name": name}, headers=CSRF)

    page_response = client.get("/clusters?page=1&page_size=2")
    body = page_response.json()
    assert body["total"] == 3
    assert len(body["clusters"]) == 2

    search_response = client.get("/clusters?search=alp")
    assert [c["name"] for c in search_response.json()["clusters"]] == ["Alpha"]


def test_delete_cluster_blocked_when_it_has_accounts(authed_client, db_session):
    client, _ = authed_client(role="admin")
    create_response = client.post("/clusters", json={"name": "North America"}, headers=CSRF)
    cluster_id = create_response.json()["cluster"]["id"]

    db_session.add(Account(name="Acme", cluster_id=cluster_id))
    db_session.commit()

    response = client.delete(f"/clusters/{cluster_id}", headers=CSRF)
    assert response.status_code == 409


def test_patch_cluster_heads_assigns_and_replaces(authed_client, db_session):
    client, _ = authed_client(role="admin")
    head1 = User(name="Head One", email="head1@test.dev", password_hash=hash_password("pw"), role="cluster_head")
    head2 = User(name="Head Two", email="head2@test.dev", password_hash=hash_password("pw"), role="cluster_head")
    db_session.add_all([head1, head2])
    db_session.commit()

    create_response = client.post("/clusters", json={"name": "North America"}, headers=CSRF)
    cluster_id = create_response.json()["cluster"]["id"]

    patch1 = client.patch(f"/clusters/{cluster_id}", json={"heads": [head1.id]}, headers=CSRF)
    assert patch1.status_code == 200
    assert [h["id"] for h in patch1.json()["cluster"]["heads"]] == [head1.id]

    patch2 = client.patch(f"/clusters/{cluster_id}", json={"heads": [head2.id]}, headers=CSRF)
    assert patch2.status_code == 200
    assert [h["id"] for h in patch2.json()["cluster"]["heads"]] == [head2.id]


def test_patch_cluster_heads_rejects_role_mismatch(authed_client, db_session):
    client, _ = authed_client(role="admin")
    wrong_role_user = User(name="PM", email="pm@test.dev", password_hash=hash_password("pw"), role="project_manager")
    db_session.add(wrong_role_user)
    db_session.commit()

    create_response = client.post("/clusters", json={"name": "North America"}, headers=CSRF)
    cluster_id = create_response.json()["cluster"]["id"]

    response = client.patch(f"/clusters/{cluster_id}", json={"heads": [wrong_role_user.id]}, headers=CSRF)
    assert response.status_code == 400
