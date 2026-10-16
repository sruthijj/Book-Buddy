"""
Book management CRUD endpoints for Book Buddy.
Provides user-isolated operations for managing book catalog, reading progress, and reflection notes.
Includes DRY helpers, pagination limits, declarative sorting, and safe transaction rollbacks.
"""

from datetime import datetime
from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from ..database import get_db
from ..models import Book, BookStatus, ReadingLog, User
from ..schemas import BookCreate, BookUpdate, BookProgressUpdate, BookOut
from ..auth import get_current_user

router = APIRouter(prefix="/api/books", tags=["Books"])

# Declarative dictionary mapping for allowed sort fields
SORT_FIELDS: Dict[str, object] = {
    "updated_at": Book.updated_at,
    "created_at": Book.created_at,
    "title": Book.title,
    "rating": Book.rating,
    "current_page": Book.current_page,
    "genre": Book.genre,
}


def _get_user_book_or_404(db: Session, book_id: int, user_id: int) -> Book:
    """
    DRY Helper: Fetches a book strictly scoped to the authenticated user.
    Enforces tenant isolation and raises HTTP 404 if the record does not exist
    or belongs to another user.
    """
    book = db.query(Book).filter(
        Book.id == book_id,
        Book.user_id == user_id
    ).first()

    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book with ID {book_id} not found."
        )
    return book


@router.post("", response_model=BookOut, status_code=status.HTTP_201_CREATED)
def create_book(
    book_in: BookCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates a new book in the authenticated user's private library.
    Validates page constraints and automatically sets start/finish timestamps.
    """
    if book_in.total_pages > 0 and book_in.current_page > book_in.total_pages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current page cannot exceed total pages."
        )

    now = datetime.utcnow()
    start_date = now if book_in.status == BookStatus.READING else None
    finish_date = now if book_in.status == BookStatus.COMPLETED else None

    new_book = Book(
        user_id=current_user.id,
        title=book_in.title.strip(),
        author=book_in.author.strip(),
        genre=book_in.genre.strip(),
        status=book_in.status.value,
        total_pages=book_in.total_pages,
        current_page=book_in.current_page,
        rating=book_in.rating,
        notes=book_in.notes,
        cover_image_url=book_in.cover_image_url,
        isbn=book_in.isbn.strip() if book_in.isbn else None,
        start_date=start_date,
        finish_date=finish_date
    )

    try:
        db.add(new_book)
        db.commit()
        db.refresh(new_book)

        # If created with initial reading progress, log the initial session
        if new_book.current_page > 0:
            initial_log = ReadingLog(
                book_id=new_book.id,
                pages_read=new_book.current_page,
                logged_at=now
            )
            db.add(initial_log)
            db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create book record."
        )

    return new_book


@router.get("", response_model=List[BookOut])
def get_books(
    status_filter: Optional[BookStatus] = Query(None, alias="status", description="Filter by reading status"),
    genre: Optional[str] = Query(None, description="Filter by genre"),
    search: Optional[str] = Query(None, description="Search by title or author"),
    sort_by: Optional[str] = Query("updated_at", description="Sort by: updated_at, created_at, title, rating, current_page"),
    order: Optional[str] = Query("desc", description="Sort order: asc, desc"),
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(100, ge=1, le=200, description="Maximum books to return"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves books belonging to the authenticated user.
    Supports filtering by status, genre, keyword search, pagination, and declarative sorting.
    """
    query = db.query(Book).filter(Book.user_id == current_user.id)

    if status_filter:
        query = query.filter(Book.status == status_filter.value)

    if genre:
        query = query.filter(Book.genre.ilike(f"%{genre.strip()}%"))

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Book.title.ilike(search_term),
                Book.author.ilike(search_term)
            )
        )

    # Declarative sorting
    sort_column = SORT_FIELDS.get(sort_by, Book.updated_at)
    if order == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    # Pagination protection to prevent large memory spikes
    return query.offset(skip).limit(limit).all()


@router.get("/{book_id}", response_model=BookOut)
def get_book(
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves a single book by ID, strictly verifying ownership.
    """
    return _get_user_book_or_404(db, book_id, current_user.id)


@router.put("/{book_id}", response_model=BookOut)
def update_book(
    book_id: int,
    book_in: BookUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates book metadata, rating, or personal notes.
    """
    book = _get_user_book_or_404(db, book_id, current_user.id)

    # Validate page bounds if pages are being updated
    new_total = book_in.total_pages if book_in.total_pages is not None else book.total_pages
    new_current = book_in.current_page if book_in.current_page is not None else book.current_page

    if new_total > 0 and new_current > new_total:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current page cannot exceed total pages."
        )

    # Apply updates
    update_data = book_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "status" and value is not None:
            setattr(book, field, value.value)
        elif value is not None and isinstance(value, str):
            setattr(book, field, value.strip())
        else:
            setattr(book, field, value)

    book.updated_at = datetime.utcnow()

    try:
        db.commit()
        db.refresh(book)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update book record."
        )

    return book


@router.patch("/{book_id}/progress", response_model=BookOut)
def update_reading_progress(
    book_id: int,
    progress: BookProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates reading progress (current page) and automatically:
    1. Creates a ReadingLog session entry for reading velocity & graphs over time.
    2. Automatically transitions status to 'completed' with finish_date if current_page >= total_pages.
    3. Smart Reversion: If a user corrects page downwards below total_pages, reverts status back to 'reading'.
    4. Allows optional rating and notes updates upon finishing.
    """
    book = _get_user_book_or_404(db, book_id, current_user.id)

    if book.total_pages > 0 and progress.current_page > book.total_pages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Current page ({progress.current_page}) cannot exceed total pages ({book.total_pages})."
        )

    previous_page = book.current_page
    new_page = progress.current_page
    pages_delta = new_page - previous_page
    now = datetime.utcnow()

    # Update current page
    book.current_page = new_page

    # Log reading activity if positive pages were read
    if pages_delta > 0:
        session_log = ReadingLog(
            book_id=book.id,
            pages_read=pages_delta,
            logged_at=now
        )
        db.add(session_log)

    # Smart Status Logic:
    if progress.status:
        book.status = progress.status.value
    elif book.total_pages > 0 and new_page >= book.total_pages:
        # Auto-complete
        book.status = BookStatus.COMPLETED.value
        if not book.finish_date:
            book.finish_date = now
    elif book.total_pages > 0 and new_page < book.total_pages and book.status == BookStatus.COMPLETED.value:
        # Revert status if user decreased page count below total
        book.status = BookStatus.READING.value
        book.finish_date = None

    # Update optional rating and notes if supplied
    if progress.rating is not None:
        book.rating = progress.rating
    if progress.notes is not None:
        book.notes = progress.notes

    book.updated_at = now

    try:
        db.commit()
        db.refresh(book)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update reading progress."
        )

    return book


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deletes a book from the user's library and cascades deletion of its reading logs.
    """
    book = _get_user_book_or_404(db, book_id, current_user.id)

    try:
        db.delete(book)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete book."
        )
    return None
