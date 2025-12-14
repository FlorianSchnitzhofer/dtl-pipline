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
        self.temperature = self._get_temperature()
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
            completion_params = {
                "model": self.deployment,
                "messages": [{"role": "user", "content": prompt}],
                "max_completion_tokens": 800,
            }
            if self.temperature is not None:
                completion_params["temperature"] = self.temperature

            completion = self.client.chat.completions.create(**completion_params)
            return completion.choices[0].message.content or ""
        except Exception as exc:
            logger.warning(
                "LLM generation failed for deployment '%s' at '%s'. Prompt preview: %r. "
                "Returning stubbed response. Error: %s",
                self.deployment,
                self.endpoint,
                prompt[:120],
                exc,
                exc_info=True,
            )
            return  f"[No LLM-Response] {prompt[:120]}..."

    def _get_temperature(self) -> Optional[float]:
        raw_temperature = os.getenv("AZURE_OPENAI_TEMPERATURE")
        if raw_temperature is None:
            return None
        try:
            return float(raw_temperature)
        except ValueError:
            logger.warning(
                "Invalid AZURE_OPENAI_TEMPERATURE value %r. Using model default.",
                raw_temperature,
            )
            return None


llm_service = LLMService()
