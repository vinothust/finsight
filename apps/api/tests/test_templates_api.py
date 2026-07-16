def test_get_pnl_template_returns_xlsx(authed_client):
    client, _ = authed_client(role="project_manager")
    response = client.get("/templates/pnl")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


def test_get_utilization_template_returns_xlsx(authed_client):
    client, _ = authed_client(role="project_manager")
    response = client.get("/templates/utilization")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


def test_templates_require_authentication(client):
    response = client.get("/templates/pnl")
    assert response.status_code == 401
