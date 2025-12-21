import json
import logging
import os
import re
from typing import Any, Optional, Tuple

from openai import AzureOpenAI

logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self) -> None:
        self.endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        self.api_key = os.getenv("AZURE_OPENAI_API_KEY")
        self.deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT")
        self.temperature = self._get_temperature()
        self.debug_mode = os.getenv("LLM_DEBUG_MODE", "true").lower() in {"1", "true", "yes", "on"}
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
        if self.debug_mode:
            logger.error("LLM prompt (debug): %s", prompt)

        if not self.client or not self.deployment:
            stubbed = f"[stubbed LLM response for prompt: {prompt[:120]}...]"
            if self.debug_mode:
                logger.error("LLM response (debug): %s", stubbed)
            return stubbed
        try:

            completion_params = {
                "model": self.deployment,
                "messages": [{"role": "user", "content": prompt}],
                "max_completion_tokens": 10000,
            }
            if self.temperature is not None:
                completion_params["temperature"] = self.temperature
            completion = self.client.chat.completions.create(**completion_params)
            response = completion.choices[0].message.content or ""

            if self.debug_mode:
                logger.error("LLM response (debug): %s", response)

            return response
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
            stubbed_error = f"[No LLM-Response] {prompt[:120]}..."
            if self.debug_mode:
                logger.error("LLM response (debug): %s", stubbed_error)
            return stubbed_error

    def generate_structured(self, prompt: str) -> Tuple[str, Any]:
        """Return the raw text and a best-effort JSON-decoded object."""

        raw = self.generate_text(prompt)
        parsed = self._parse_json_response(raw)
        return raw, parsed

    def _parse_json_response(self, text: str) -> Any:
        candidates = [text]
        codeblock_match = re.search(r"```(?:json)?\s*(\{.*?\}|\[.*?\])\s*```", text, re.DOTALL)
        if codeblock_match:
            candidates.insert(0, codeblock_match.group(1))

        for candidate in candidates:
            try:
                return json.loads(candidate)
            except Exception:
                continue
        return None

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
