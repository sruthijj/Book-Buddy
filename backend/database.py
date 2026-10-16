"""
Database configuration and session management for Book Buddy.
Utilizes SQLAlchemy 2.0 with SQLite and enforces foreign key integrity.
"""

from typing import Generator
import os
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# Database URL: supports local SQLite, persistent disk mounts, and cloud PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./book_buddy.db").strip().strip('"').strip("'")

# Defensive normalization for production deployment strings
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
elif DATABASE_URL.startswith("postgresql.//"):
    DATABASE_URL = DATABASE_URL.replace("postgresql.//", "postgresql://", 1)

# Correct potential mistyped '@' symbol before Render host (e.g. adpg- instead of @dpg-)
if "@" not in DATABASE_URL and "dpg-" in DATABASE_URL:
    import re
    DATABASE_URL = re.sub(r'a(?=dpg-)', '@', DATABASE_URL)

# Production Safeguard: Refuse to boot on Render without PostgreSQL (prevents ephemeral SQLite data loss)
if os.getenv("RENDER") and "sqlite" in DATABASE_URL:
    raise RuntimeError(
        "CRITICAL DATABASE ERROR: Detected production deployment on Render with SQLite!\n"
        "Render free-tier instances have ephemeral disks that reset on every restart/sleep.\n"
        "You must configure a managed PostgreSQL DATABASE_URL in your Render dashboard environment variables."
    )

# Engine initialization:
# - SQLite: check_same_thread=False for local dev multi-threading
# - PostgreSQL: pool_pre_ping=True and pool_recycle=300 to eliminate stale cloud connection drops
if "sqlite" in DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,  # Test connections before use to eliminate stale connection drops
        pool_recycle=300,    # Recycle connections every 5 minutes before cloud proxies close them
        echo=False
    )

# Enable SQLite foreign key enforcement on every connection
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if "sqlite" in DATABASE_URL:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

# SessionLocal factory for generating isolated database sessions per request
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative Base for models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a database session to endpoints
    and guarantees proper session closing after request completion.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
