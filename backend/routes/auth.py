"""
Authentication endpoints for user registration, login, and profile access.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from ..models import User
from ..schemas import UserRegister, UserLogin, UserOut, Token
from ..auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """
    Registers a new user account.
    Validates username/email uniqueness and securely hashes the password with Bcrypt.
    Returns access token for immediate automatic authentication.
    """
    # Check for existing username or email
    existing_user = db.query(User).filter(
        or_(
            User.username == user_in.username.strip(),
            User.email == user_in.email.strip().lower()
        )
    ).first()

    if existing_user:
        if existing_user.username == user_in.username.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username is already registered."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address is already registered."
            )

    # Hash the password and create the user
    hashed_pwd = get_password_hash(user_in.password)
    new_user = User(
        username=user_in.username.strip(),
        email=user_in.email.strip().lower(),
        hashed_password=hashed_pwd
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Issue JWT token
    token = create_access_token(data={"sub": new_user.username, "user_id": new_user.id})

    return Token(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(new_user)
    )


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticates a user via username or email and password.
    Returns a signed JWT bearer token upon success.
    """
    identifier = credentials.username.strip()
    
    # Allow logging in with either username or email
    user = db.query(User).filter(
        or_(
            User.username == identifier,
            User.email == identifier.lower()
        )
    ).first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Issue JWT token
    token = create_access_token(data={"sub": user.username, "user_id": user.id})

    return Token(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns the currently authenticated user's profile details.
    """
    return UserOut.model_validate(current_user)
