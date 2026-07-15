def test_get_roles_returns_fixed_role_list(authed_client):
    client, _ = authed_client(role="project_manager")
    response = client.get("/roles")
    assert response.status_code == 200
    roles = {r["value"]: r["label"] for r in response.json()["roles"]}
    assert roles == {
        "admin": "Administrator",
        "cluster_head": "Cluster Head",
        "account_director": "Account Director",
        "project_manager": "Project Manager",
    }


def test_get_roles_requires_authentication(client):
    response = client.get("/roles")
    assert response.status_code == 401
