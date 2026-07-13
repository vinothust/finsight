import anthropic

from app.core.config import settings
from app.core.llm.base import LLMClient


class AnthropicClient(LLMClient):
    def __init__(self) -> None:
        self._client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    def complete(self, prompt: str, system: str | None = None) -> str:
        response = self._client.messages.create(
            model="claude-sonnet-5",
            max_tokens=1024,
            system=system or "",
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text
