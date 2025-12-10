from __future__ import annotations

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DEFAULT_DB_HOST = os.getenv("SQL_DB_HOST", "db")
DEFAULT_DB_USER = os.getenv("SQL_DB_USER", "dtl")
DEFAULT_DB_NAME = os.getenv("SQL_DB_NAME", "dtl")
DEFAULT_DB_PASSWORD = os.getenv("SQL_DB_PASSWORD", "dtl")


def build_database_url() -> str:
    explicit_url = os.getenv("DATABASE_URL")
    if explicit_url:
        return explicit_url

    credentials = {
        "user": DEFAULT_DB_USER,
        "password": DEFAULT_DB_PASSWORD,
        "host": DEFAULT_DB_HOST,
        "database": DEFAULT_DB_NAME,
    }
    return (
        f"mysql+pymysql://{credentials['user']}:{credentials['password']}"
        f"@{credentials['host']}/{credentials['database']}"
    )


DATABASE_URL = build_database_url()

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
