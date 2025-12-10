from __future__ import annotations

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DEFAULT_DB_HOST = os.getenv("SQL_DB_HOST", "k2gn.your-database.de")
DEFAULT_DB_USER = os.getenv("SQL_DB_USER", "admin_user")
DEFAULT_DB_NAME = os.getenv("SQL_DB_NAME", "db_dtal_pipeline")
DEFAULT_DB_PASSWORD = os.getenv("SQL_DB_PASSWORD")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    (
        f"mysql+pymysql://{DEFAULT_DB_USER}:{DEFAULT_DB_PASSWORD}"
        f"@{DEFAULT_DB_HOST}/{DEFAULT_DB_NAME}"
    )
    if DEFAULT_DB_PASSWORD
    else None,
)

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL not configured. Set DATABASE_URL or provide SQL_DB_PASSWORD "
        "(and optionally SQL_DB_USER, SQL_DB_HOST, SQL_DB_NAME) for the default MySQL URL."
    )

engine = create_engine(
    DATABASE_URL,
    future=True,
    pool_pre_ping=True,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
