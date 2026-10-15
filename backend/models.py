"""
SQLAlchemy ORM models for Book Buddy.
Defines schemas for Users, Books, and ReadingLogs.
"""

from datetime import datetime
from enum import Enum
from typing import Optional, List
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    CheckConstraint,
    Index
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from .database import Base


class BookStatus(str, Enum):
    """Supported reading statuses for books."""
    READING = "reading"
    COMPLETED = "completed"
    WISHLIST = "wishlist"


class User(Base):
    """
    User entity for personal library management and authentication.
    Enables private book lists and personalized stats.
    """
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship to user's private collection of books
    books: Mapped[List["Book"]] = relationship(
        "Book",
        back_populates="owner",
        cascade="all, delete-orphan",
        order_by="desc(Book.updated_at)"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"


class Book(Base):
    """
    Book entity containing core catalog data, reading progress, and personal review notes.
    """
    __tablename__ = "books"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    author: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    genre: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    status: Mapped[str] = mapped_column(
        String(20),
        default=BookStatus.READING.value,
        nullable=False,
        index=True
    )

    # Reading progress tracking
    total_pages: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    current_page: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Personal review & rating (1 to 5 stars)
    rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Metadata & Integrations
    cover_image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    isbn: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, index=True)

    # Timestamps
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    finish_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="books")
    reading_logs: Mapped[List["ReadingLog"]] = relationship(
        "ReadingLog",
        back_populates="book",
        cascade="all, delete-orphan",
        order_by="desc(ReadingLog.logged_at)"
    )

    # Enforce valid rating constraints (1-5) and non-negative pages
    __table_args__ = (
        CheckConstraint("rating IS NULL OR (rating >= 1 AND rating <= 5)", name="check_valid_rating"),
        CheckConstraint("total_pages >= 0", name="check_positive_total_pages"),
        CheckConstraint("current_page >= 0", name="check_positive_current_page"),
        Index("idx_user_status", "user_id", "status"),
        Index("idx_user_genre", "user_id", "genre"),
    )

    @property
    def progress_percentage(self) -> float:
        """Calculates reading progress percentage safely."""
        if not self.total_pages or self.total_pages <= 0:
            return 0.0
        pct = (self.current_page / self.total_pages) * 100.0
        return min(100.0, round(pct, 1))

    def __repr__(self) -> str:
        return f"<Book(id={self.id}, title='{self.title}', status='{self.status}', progress={self.current_page}/{self.total_pages})>"


class ReadingLog(Base):
    """
    Log of reading activity per session.
    Enables:
    1. Reading over time graph (pages read per day).
    2. Reading velocity calculation for the AI completion date predictor.
    """
    __tablename__ = "reading_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    book_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("books.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    pages_read: Mapped[int] = mapped_column(Integer, nullable=False)
    logged_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True
    )

    # Relationship
    book: Mapped["Book"] = relationship("Book", back_populates="reading_logs")

    __table_args__ = (
        CheckConstraint("pages_read > 0", name="check_positive_pages_read"),
    )

    def __repr__(self) -> str:
        return f"<ReadingLog(id={self.id}, book_id={self.book_id}, pages={self.pages_read}, logged_at='{self.logged_at}')>"
