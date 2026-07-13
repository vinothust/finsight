from app.core.llm import factory
from app.core.llm.vertex_client import VertexAIClient
from app.services.llm_settings import update_llm_settings


def test_factory_returns_vertex_client_configured_from_db_defaults(db_session, monkeypatch):
    monkeypatch.setattr("app.core.llm.vertex_client.genai.Client", lambda **kwargs: object())

    client = factory.get_llm_client(db_session)
    assert isinstance(client, VertexAIClient)
    assert client._model_simple == "gemini-2.5-flash-lite"
    assert client._model_complex == "gemini-2.5-flash"
    assert client._model_fallback == "gemini-2.5-pro"


def test_factory_reflects_updated_settings(db_session, monkeypatch):
    monkeypatch.setattr("app.core.llm.vertex_client.genai.Client", lambda **kwargs: object())
    update_llm_settings(db_session, gcp_project="my-project", model_complex="gemini-2.5-pro")

    client = factory.get_llm_client(db_session)
    assert client._model_complex == "gemini-2.5-pro"
