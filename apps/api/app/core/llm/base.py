from abc import ABC, abstractmethod
from typing import Literal

Tier = Literal["simple", "complex"]


class LLMClient(ABC):
    @abstractmethod
    def complete(self, prompt: str, system: str | None = None, tier: Tier = "simple") -> str:
        ...
