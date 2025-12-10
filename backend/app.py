from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.proxy_headers import ProxyHeadersMiddleware

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
