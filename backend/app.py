from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

from .config import settings
from .database import Base, SessionLocal, engine
from .models import User
from .routers import dtlibs, dtls, users

Base.metadata.create_all(bind=engine)


def ensure_default_user() -> None:
    db = SessionLocal()
    try:
        if not db.query(User).first():
            system_user = User(
                external_id="system",
                display_name="System",
                email="system@example.com",
            )
            db.add(system_user)
            db.commit()
    finally:
        db.close()


ensure_default_user()

app = FastAPI(title="Digital Twin Legislation API", servers=settings.servers)

app.add_middleware(
    ProxyHeadersMiddleware,
    trusted_hosts="*",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix=settings.api_prefix)
app.include_router(dtlibs.router, prefix=settings.api_prefix)
app.include_router(dtls.router, prefix=settings.api_prefix)


def mount_frontend(app: FastAPI) -> None:
    dist_path = Path(
        os.getenv("FRONTEND_DIST_PATH")
        or Path(__file__).resolve().parents[1] / "frontend" / "dist"
    )
    index_file = dist_path / "index.html"

    if not index_file.exists():
        return

    assets_dir = dist_path / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    reserved_prefixes = {
        settings.api_prefix.lstrip("/"),
        "docs",
        "openapi.json",
        "redoc",
    }

    @app.get("/", include_in_schema=False)
    async def serve_index() -> FileResponse:
        return FileResponse(index_file)

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str) -> FileResponse:
        if any(
            full_path == prefix or full_path.startswith(f"{prefix}/")
            for prefix in reserved_prefixes
        ):
            raise HTTPException(status_code=404)

        candidate = dist_path / full_path
        if candidate.is_file():
            return FileResponse(candidate)

        return FileResponse(index_file)


mount_frontend(app)
