from functools import lru_cache

from app.core.config import settings
from app.core.llm.base import LLMClient


@lru_cache
def get_llm_client() -> LLMClient:
    if settings.llm_provider == "openai":
        from app.core.llm.openai_client import OpenAIClient

        return OpenAIClient()
    from app.core.llm.anthropic_client import AnthropicClient

    return AnthropicClient()
