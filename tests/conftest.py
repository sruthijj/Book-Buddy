"""
Pytest configuration and isolated fixtures for Book Buddy.
Configures an in-memory SQLite database, clean tables per test session,
and pre-authenticated test clients for tenant isolation testing.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.database import Base, get_db
from backend.main import app
from backend.models import User, Book, ReadingLog, BookStatus
from backend.auth import get_password_hash, create_access_token

# Fast in-memory SQLite test database shared across threads in test
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Creates all database tables once for the test session."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    """Provides a transactional database session rolled back after each test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    """TestClient that overrides the get_db dependency with the test session."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def user_a(db_session):
    """Creates test User A for testing."""
    user = User(
        username="reader_alice",
        email="alice@example.com",
        hashed_password=get_password_hash("Password123!")
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def user_b(db_session):
    """Creates test User B for privacy isolation testing."""
    user = User(
        username="reader_bob",
        email="bob@example.com",
        hashed_password=get_password_hash("Password456!")
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def headers_a(user_a):
    """Authorization header with valid JWT token for User A."""
    token = create_access_token(data={"sub": user_a.username, "user_id": user_a.id})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def headers_b(user_b):
    """Authorization header with valid JWT token for User B."""
    token = create_access_token(data={"sub": user_b.username, "user_id": user_b.id})
    return {"Authorization": f"Bearer {token}"}
