from app.core.llm import factory


def test_factory_returns_anthropic_by_default(monkeypatch):
    factory.get_llm_client.cache_clear()
    monkeypatch.setattr("app.core.config.settings.llm_provider", "anthropic")
    monkeypatch.setattr("app.core.llm.anthropic_client.AnthropicClient.__init__", lambda self: None)
    client = factory.get_llm_client()
    assert client.__class__.__name__ == "AnthropicClient"


def test_factory_returns_openai_when_configured(monkeypatch):
    factory.get_llm_client.cache_clear()
    monkeypatch.setattr("app.core.config.settings.llm_provider", "openai")
    monkeypatch.setattr("app.core.llm.openai_client.OpenAIClient.__init__", lambda self: None)
    client = factory.get_llm_client()
    assert client.__class__.__name__ == "OpenAIClient"
