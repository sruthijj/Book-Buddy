"""
Database configuration and session management for Book Buddy.
Utilizes SQLAlchemy 2.0 with SQLite and enforces foreign key integrity.
"""

from typing import Generator
import os
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# SQLite database file stored inside the backend directory
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./book_buddy.db")

# check_same_thread=False allows FastAPI multi-threaded request workers to access SQLite
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=False
)

# Senior Developer Best Practice:
# SQLite does NOT enforce foreign keys by default. We enable it on every connection.
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
