from app.services.llm_settings import get_or_create_llm_settings, update_llm_settings


def test_get_or_create_returns_defaults_on_first_call(db_session):
    row = get_or_create_llm_settings(db_session)
    assert row.gcp_location == "us-central1"
    assert row.model_simple == "gemini-2.5-flash-lite"
    assert row.model_complex == "gemini-2.5-flash"
    assert row.model_fallback == "gemini-2.5-pro"


def test_get_or_create_is_idempotent(db_session):
    first = get_or_create_llm_settings(db_session)
    second = get_or_create_llm_settings(db_session)
    assert first.id == second.id


def test_update_llm_settings_persists_changes(db_session):
    update_llm_settings(db_session, gcp_project="acme-gcp", gcp_location="europe-west1")
    row = get_or_create_llm_settings(db_session)
    assert row.gcp_project == "acme-gcp"
    assert row.gcp_location == "europe-west1"


def test_update_llm_settings_ignores_none_fields(db_session):
    update_llm_settings(db_session, gcp_project="acme-gcp")
    update_llm_settings(db_session, gcp_project=None, model_simple="gemini-2.5-flash")
    row = get_or_create_llm_settings(db_session)
    assert row.gcp_project == "acme-gcp"
    assert row.model_simple == "gemini-2.5-flash"


def test_get_llm_settings_endpoint(client):
    response = client.get("/llm-settings")
    assert response.status_code == 200
    body = response.json()
    assert body["model_simple"] == "gemini-2.5-flash-lite"
    assert body["model_complex"] == "gemini-2.5-flash"


def test_put_llm_settings_endpoint_updates_and_returns_settings(client):
    response = client.put("/llm-settings", json={"gcp_project": "acme-gcp", "gcp_location": "asia-south1"})
    assert response.status_code == 200
    body = response.json()
    assert body["gcp_project"] == "acme-gcp"
    assert body["gcp_location"] == "asia-south1"
