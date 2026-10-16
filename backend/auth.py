"""
Authentication, cryptographic hashing, and JWT token management for Book Buddy.
Implements industry-standard Bcrypt password hashing and HMAC-SHA256 JWT tokens.
"""

import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from dotenv import load_dotenv
load_dotenv()

from .database import get_db
from .models import User
from .schemas import TokenPayload

# Cryptographic configuration: Strictly required from environment / .env
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "CRITICAL SECURITY CONFIGURATION ERROR: 'SECRET_KEY' environment variable is not set. "
        "Define SECRET_KEY in your .env file or cloud hosting provider environment variables."
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days session validity

# Bcrypt password hashing context with automatic salting
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme: instructs Swagger UI and clients where to fetch tokens
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against a stored Bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generates a secure Bcrypt salted hash from a plaintext password."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Encodes data into a signed HMAC-SHA256 JWT token with an expiration timestamp.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    FastAPI dependency: Decodes the Bearer token, validates its signature and expiration,
    and returns the authenticated User instance.
    Raises HTTP 401 if token is invalid or user does not exist.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token has expired",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: Optional[str] = payload.get("sub")
        user_id: Optional[int] = payload.get("user_id")

        if username is None or user_id is None:
            raise credentials_exception

        token_data = TokenPayload(sub=username, user_id=user_id)
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        raise credentials_exception

    return user
