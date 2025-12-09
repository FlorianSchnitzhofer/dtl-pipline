from __future__ import annotations

import os
from typing import Optional

try:
    from openai import AzureOpenAI
except Exception:  # pragma: no cover - optional dependency
    AzureOpenAI = None  # type: ignore


class LLMService:
    def __init__(self) -> None:
        self.endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        self.api_key = os.getenv("AZURE_OPENAI_API_KEY")
        self.deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT")
        self.client: Optional[AzureOpenAI] = None
        if self.endpoint and self.api_key and AzureOpenAI:
            self.client = AzureOpenAI(
                azure_endpoint=self.endpoint,
                api_key=self.api_key,
                api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview"),
            )

    def generate_text(self, prompt: str) -> str:
        if not self.client or not self.deployment:
            # fall back to a deterministic stub to keep the API usable without secrets
            return f"[stubbed LLM response for prompt: {prompt[:120]}...]"
        completion = self.client.chat.completions.create(
            model=self.deployment,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=800,
        )
        return completion.choices[0].message.content or ""


llm_service = LLMService()
