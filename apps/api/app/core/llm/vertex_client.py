from google import genai

from app.core.llm.base import LLMClient, Tier


class VertexAIClient(LLMClient):
    """Gemini via Vertex AI, authenticated with the caller's local gcloud
    Application Default Credentials (no API key). Model choice is tiered:
    ``simple`` for narration/guardrailing/small operations, ``complex`` for
    query generation and other heavy lifting. Any failure on the tiered
    model falls back once to ``model_fallback`` before raising.
    """

    def __init__(
        self,
        project: str,
        location: str,
        model_simple: str,
        model_complex: str,
        model_fallback: str,
    ) -> None:
        self._client = genai.Client(vertexai=True, project=project, location=location)
        self._model_simple = model_simple
        self._model_complex = model_complex
        self._model_fallback = model_fallback

    def complete(self, prompt: str, system: str | None = None, tier: Tier = "simple") -> str:
        model = self._model_complex if tier == "complex" else self._model_simple
        try:
            return self._generate(model, prompt, system)
        except Exception:
            return self._generate(self._model_fallback, prompt, system)

    def _generate(self, model: str, prompt: str, system: str | None) -> str:
        config = {"system_instruction": system} if system else None
        response = self._client.models.generate_content(model=model, contents=prompt, config=config)
        return response.text
