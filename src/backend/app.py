from __future__ import annotations

from fastapi import FastAPI

from .database import Base, engine
from .routers import dtlibs, dtls, users

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Digital Twin Legislation API")

app.include_router(users.router, prefix="/api")
app.include_router(dtlibs.router, prefix="/api")
app.include_router(dtls.router, prefix="/api")
