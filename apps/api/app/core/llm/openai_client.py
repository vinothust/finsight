from openai import OpenAI

from app.core.config import settings
from app.core.llm.base import LLMClient


class OpenAIClient(LLMClient):
    def __init__(self) -> None:
        self._client = OpenAI(api_key=settings.openai_api_key)

    def complete(self, prompt: str, system: str | None = None) -> str:
        response = self._client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system or ""},
                {"role": "user", "content": prompt},
            ],
        )
        return response.choices[0].message.content
