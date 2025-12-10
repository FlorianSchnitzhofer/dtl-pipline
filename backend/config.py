from __future__ import annotations

import os
from dataclasses import dataclass
from typing import List, Sequence


@dataclass
class APISettings:
    cors_allow_origins: Sequence[str]
    api_prefix: str
    public_base_url: str | None

    @classmethod
    def from_env(cls) -> "APISettings":
        raw_origins = os.getenv("API_CORS_ALLOW_ORIGINS", "*")
        cors_allow_origins = (
            ["*"]
            if raw_origins.strip() == "*"
            else [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
        )

        api_prefix = os.getenv("API_PREFIX", "/api")
        api_prefix = api_prefix if api_prefix.startswith("/") else f"/{api_prefix}"

        public_base_url = os.getenv("API_PUBLIC_BASE_URL")
        if not public_base_url:
            azure_hostname = os.getenv("AZURE_SITE_HOSTNAME")
            if azure_hostname:
                scheme = os.getenv("API_PUBLIC_SCHEME", "https")
                public_base_url = f"{scheme}://{azure_hostname}"

        return cls(
            cors_allow_origins=cors_allow_origins,
            api_prefix=api_prefix.rstrip("/") or "/",
            public_base_url=public_base_url.rstrip("/") if public_base_url else None,
        )

    @property
    def servers(self) -> List[dict[str, str]]:
        if not self.public_base_url:
            return []
        if self.api_prefix == "/":
            return [{"url": self.public_base_url}]
        return [{"url": f"{self.public_base_url}{self.api_prefix}"}]


settings = APISettings.from_env()
