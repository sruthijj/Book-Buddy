"""
Analytics and reading timeline endpoints for Book Buddy.
Executes high-performance SQL aggregations for dashboard KPI metrics,
genre distribution, and reading activity time-series over time.
"""

from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Book, BookStatus, ReadingLog, User
from ..schemas import StatsSummary, GenreStat, TimelinePoint
from ..auth import get_current_user

router = APIRouter(prefix="/api/stats", tags=["Analytics & Stats"])


@router.get("/summary", response_model=StatsSummary)
def get_stats_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes high-level KPI cards for the user dashboard:
    - Total books, reading, completed, and wishlist counts.
    - Total pages read.
    - Overall library completion percentage.
    - Average star rating.
    """
    user_id = current_user.id

    # Total books count
    total_books = db.query(func.count(Book.id)).filter(Book.user_id == user_id).scalar() or 0

    if total_books == 0:
        return StatsSummary(
            total_books=0,
            reading_count=0,
            completed_count=0,
            wishlist_count=0,
            total_pages_read=0,
            overall_completion_rate=0.0,
            average_rating=None
        )

    # Status counts breakdown via SQL GROUP BY
    status_counts = db.query(
        Book.status,
        func.count(Book.id)
    ).filter(Book.user_id == user_id).group_by(Book.status).all()

    status_map = {status_val: count for status_val, count in status_counts}
    reading_count = status_map.get(BookStatus.READING.value, 0)
    completed_count = status_map.get(BookStatus.COMPLETED.value, 0)
    wishlist_count = status_map.get(BookStatus.WISHLIST.value, 0)

    # Total pages read across all user books
    total_pages_read = db.query(func.sum(Book.current_page)).filter(Book.user_id == user_id).scalar() or 0

    # Total planned pages across non-wishlist books
    total_planned_pages = db.query(func.sum(Book.total_pages)).filter(
        Book.user_id == user_id,
        Book.status != BookStatus.WISHLIST.value
    ).scalar() or 0

    # Overall completion percentage with zero-division safeguard
    if total_planned_pages > 0:
        completion_rate = min(100.0, round((total_pages_read / total_planned_pages) * 100.0, 1))
    else:
        completion_rate = 100.0 if completed_count > 0 else 0.0

    # Average rating across rated books
    avg_rating_raw = db.query(func.avg(Book.rating)).filter(
        Book.user_id == user_id,
        Book.rating.isnot(None)
    ).scalar()

    average_rating = round(float(avg_rating_raw), 2) if avg_rating_raw is not None else None

    return StatsSummary(
        total_books=total_books,
        reading_count=reading_count,
        completed_count=completed_count,
        wishlist_count=wishlist_count,
        total_pages_read=total_pages_read,
        overall_completion_rate=completion_rate,
        average_rating=average_rating
    )


@router.get("/genres", response_model=List[GenreStat])
def get_genre_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes book distribution grouped by genre with dynamic percentage calculation.
    Powers the Donut / Bar chart in the frontend.
    """
    user_id = current_user.id

    total_books = db.query(func.count(Book.id)).filter(Book.user_id == user_id).scalar() or 0
    if total_books == 0:
        return []

    genre_rows = db.query(
        Book.genre,
        func.count(Book.id).label("count")
    ).filter(Book.user_id == user_id).group_by(Book.genre).order_by(func.count(Book.id).desc()).all()

    stats: List[GenreStat] = []
    for genre_name, count in genre_rows:
        percentage = round((count / total_books) * 100.0, 1)
        stats.append(GenreStat(
            genre=genre_name,
            count=count,
            percentage=percentage
        ))

    return stats


@router.get("/timeline", response_model=List[TimelinePoint])
def get_reading_timeline(
    days: int = Query(30, ge=1, le=365, description="Number of past days to query"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Aggregates daily reading activity over time from the reading_logs table.
    Powers the Graph View of Reading Over Time (Area / Line chart).
    """
    user_id = current_user.id
    cutoff_date = datetime.utcnow() - timedelta(days=days)

    # Join ReadingLog with Book to enforce tenant isolation by user_id
    # Use SQLite func.date() to truncate timestamp to YYYY-MM-DD
    results = db.query(
        func.date(ReadingLog.logged_at).label("log_date"),
        func.sum(ReadingLog.pages_read).label("total_pages"),
        func.count(ReadingLog.id).label("sessions_count")
    ).join(Book, ReadingLog.book_id == Book.id)\
     .filter(Book.user_id == user_id, ReadingLog.logged_at >= cutoff_date)\
     .group_by(func.date(ReadingLog.logged_at))\
     .order_by(func.date(ReadingLog.logged_at).asc()).all()

    timeline: List[TimelinePoint] = []
    for log_date, total_pages, sessions_count in results:
        timeline.append(TimelinePoint(
            date=str(log_date),
            pages_read=int(total_pages or 0),
            sessions_count=int(sessions_count or 0)
        ))

    return timeline
