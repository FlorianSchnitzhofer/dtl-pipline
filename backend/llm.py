import logging
import os
from typing import Optional

from openai import AzureOpenAI

logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self) -> None:
        self.endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        self.api_key = os.getenv("AZURE_OPENAI_API_KEY")
        self.deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT")
        self.client: Optional[AzureOpenAI] = None
        if self.endpoint and self.api_key:
            try:
                self.client = AzureOpenAI(
                    azure_endpoint=self.endpoint,
                    api_key=self.api_key,
                    api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview"),
                )
            except Exception as exc:
                logger.warning("Failed to initialize AzureOpenAI client: %s", exc)
                self.client = None

    def generate_text(self, prompt: str) -> str:
        if not self.client or not self.deployment:
            return f"[stubbed LLM response for prompt: {prompt[:120]}...]"
        try:
            completion = self.client.chat.completions.create(
                model=self.deployment,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=800,
            )
            return completion.choices[0].message.content or ""
        except Exception as exc:
            logger.warning(
                "LLM generation failed; returning stubbed response. Error: %s", exc
            )
            return f"[stubbed LLM response for prompt: {prompt[:120]}...]"


llm_service = LLMService()
