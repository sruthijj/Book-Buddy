"""
Pydantic schemas for request validation and response serialization.
Uses Pydantic v2 conventions for strict validation and ORM compatibility.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, EmailStr
from .models import BookStatus


# ==========================================
# USER & AUTH SCHEMAS
# ==========================================

class UserRegister(BaseModel):
    """Schema for new user registration."""
    username: str = Field(..., min_length=3, max_length=50, description="Unique username")
    email: EmailStr = Field(..., description="Valid user email address")
    password: str = Field(..., min_length=6, max_length=128, description="Password (at least 6 characters)")


class UserLogin(BaseModel):
    """Schema for user login credentials."""
    username: str = Field(..., description="Username or Email")
    password: str = Field(..., description="Plaintext password")


class UserOut(BaseModel):
    """Public user response schema (never exposes hashed password)."""
    id: int
    username: str
    email: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    """JWT Token response returned upon login or registration."""
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class TokenPayload(BaseModel):
    """Decoded JWT payload structure."""
    sub: Optional[str] = None
    user_id: Optional[int] = None
    exp: Optional[int] = None


# ==========================================
# BOOK SCHEMAS
# ==========================================

class BookBase(BaseModel):
    """Shared book fields for input and output."""
    title: str = Field(..., min_length=1, max_length=255)
    author: str = Field(..., min_length=1, max_length=255)
    genre: str = Field(..., min_length=1, max_length=100)
    status: BookStatus = Field(default=BookStatus.READING)
    total_pages: int = Field(default=0, ge=0)
    current_page: int = Field(default=0, ge=0)
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    notes: Optional[str] = Field(default=None)
    cover_image_url: Optional[str] = Field(default=None)
    isbn: Optional[str] = Field(default=None, max_length=20)


class BookCreate(BookBase):
    """Schema for creating a new book in the user's library."""
    pass


class BookUpdate(BaseModel):
    """Schema for updating an existing book (all fields optional)."""
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    author: Optional[str] = Field(default=None, min_length=1, max_length=255)
    genre: Optional[str] = Field(default=None, min_length=1, max_length=100)
    status: Optional[BookStatus] = None
    total_pages: Optional[int] = Field(default=None, ge=0)
    current_page: Optional[int] = Field(default=None, ge=0)
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    notes: Optional[str] = None
    cover_image_url: Optional[str] = None
    isbn: Optional[str] = Field(default=None, max_length=20)


class BookProgressUpdate(BaseModel):
    """Schema for logging reading progress update."""
    current_page: int = Field(..., ge=0, description="New current page")
    notes: Optional[str] = Field(default=None, description="Optional note update")
    rating: Optional[int] = Field(default=None, ge=1, le=5, description="Optional rating if completed")
    status: Optional[BookStatus] = Field(default=None, description="Optional status override")


class BookOut(BookBase):
    """Complete book response schema with calculated fields."""
    id: int
    user_id: int
    progress_percentage: float
    start_date: Optional[datetime] = None
    finish_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# READING LOG & STATS SCHEMAS
# ==========================================

class ReadingLogOut(BaseModel):
    """Log entry response for the reading history timeline."""
    id: int
    book_id: int
    pages_read: int
    logged_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StatsSummary(BaseModel):
    """Aggregated user reading statistics."""
    total_books: int
    reading_count: int
    completed_count: int
    wishlist_count: int
    total_pages_read: int
    overall_completion_rate: float
    average_rating: Optional[float] = None


class GenreStat(BaseModel):
    """Book count grouped by genre."""
    genre: str
    count: int
    percentage: float


class TimelinePoint(BaseModel):
    """Data point for reading activity graph over time."""
    date: str
    pages_read: int
    sessions_count: int


# ==========================================
# ISBN & EXTERNAL INTEGRATIONS SCHEMAS
# ==========================================

class ISBNBookLookup(BaseModel):
    """Normalized response schema for external ISBN lookups via Open Library."""
    isbn: str
    title: str
    author: str
    genre: str
    total_pages: int
    cover_image_url: Optional[str] = None
    publish_year: Optional[str] = None


class CatalogBookItem(BaseModel):
    """Normalized book candidate returned from Open Library title/author catalog search."""
    key: Optional[str] = None
    title: str
    author: str
    genre: str
    total_pages: int
    cover_image_url: Optional[str] = None
    publish_year: Optional[str] = None
    isbn: Optional[str] = None


class CatalogSearchResponse(BaseModel):
    """Catalog search response payload."""
    results: List[CatalogBookItem]
    query: str
    total_found: int


# ==========================================
# AI & PREDICTIVE SCHEMAS
# ==========================================

class AIRecommendationItem(BaseModel):
    """Individual book recommendation with personalized reason and cover art."""
    title: str
    author: str
    genre: str
    reason: str
    cover_image_url: Optional[str] = None


class AIRecommendRequest(BaseModel):
    """Optional payload for requesting tailored recommendations."""
    preferred_genres: Optional[List[str]] = None
    mood: Optional[str] = None


class AIRecommendResponse(BaseModel):
    """List of book recommendations with transparent origin tracking."""
    recommendations: List[AIRecommendationItem]
    source: str = Field(description="'gemini-ai', 'open-library', or 'curated-catalog'")


class AISummarizeRequest(BaseModel):
    """Request payload to summarize reading notes."""
    notes: str = Field(..., min_length=5, description="User's personal reading notes")
    book_title: Optional[str] = None
    author: Optional[str] = None


class AISummarizeResponse(BaseModel):
    """Concise AI summary with bulleted key takeaways."""
    summary: str
    key_takeaways: List[str]
    source: str


class AIReviewRequest(BaseModel):
    """Request payload to generate a publication-style book review."""
    book_title: str
    author: str
    rating: int = Field(..., ge=1, le=5)
    notes: Optional[str] = None


class AIReviewResponse(BaseModel):
    """Generated book review and catchy headline."""
    headline: str
    review: str
    source: str


class CompletionPrediction(BaseModel):
    """Estimated reading completion date and velocity analytics."""
    book_id: int
    book_title: str
    current_page: int
    total_pages: int
    pages_remaining: int
    average_daily_pace: float
    days_remaining: int
    estimated_completion_date: str
    confidence_level: str
    status_message: str


