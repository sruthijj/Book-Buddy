"""
Seed data script for Book Buddy.
Populates realistic books, reading logs, ratings, and notes across all statuses
for user accounts so the dashboard, graphs, and AI tools look rich and vibrant.
"""

from datetime import datetime, timedelta
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal, engine, Base
from backend.models import User, Book, BookStatus, ReadingLog
from backend.auth import get_password_hash


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Find or create user
        target_user = db.query(User).filter(User.username == "sruthijj").first()
        if not target_user:
            target_user = db.query(User).filter(User.username == "sruthij").first()

        if not target_user:
            target_user = User(
                username="sruthij",
                email="sruthij1221@gmail.com",
                hashed_password=get_password_hash("Password123!")
            )
            db.add(target_user)
            db.commit()
            db.refresh(target_user)

        user_id = target_user.id
        print(f"[*] Seeding books for user: '{target_user.username}' (ID: {user_id})")

        # Clear any existing books for this user to avoid duplicates
        existing_books = db.query(Book).filter(Book.user_id == user_id).all()
        for b in existing_books:
            db.delete(b)
        db.commit()

        now = datetime.utcnow()

        books_data = [
            {
                "title": "Clean Code: A Handbook of Agile Software Craftsmanship",
                "author": "Robert C. Martin",
                "genre": "Software Engineering",
                "status": BookStatus.READING.value,
                "total_pages": 464,
                "current_page": 190,
                "rating": 5,
                "notes": "Fascinating chapter on meaningful variable naming and function length. Keeping functions focused on a single responsibility is key.",
                "cover_image_url": "https://covers.openlibrary.org/b/id/15126503-L.jpg",
                "isbn": "9780132350884",
                "start_date": now - timedelta(days=14),
                "finish_date": None,
                "logs": [
                    {"days_ago": 12, "pages": 35},
                    {"days_ago": 9, "pages": 45},
                    {"days_ago": 6, "pages": 50},
                    {"days_ago": 2, "pages": 60},
                ]
            },
            {
                "title": "Atomic Habits: An Easy & Proven Way to Build Good Habits",
                "author": "James Clear",
                "genre": "Self-Help",
                "status": BookStatus.READING.value,
                "total_pages": 320,
                "current_page": 135,
                "rating": 5,
                "notes": "The 1% rule: small daily habits compound into massive long-term results. Focus on systems rather than goals.",
                "cover_image_url": "https://covers.openlibrary.org/b/id/12843470-L.jpg",
                "isbn": "9780735211292",
                "start_date": now - timedelta(days=8),
                "finish_date": None,
                "logs": [
                    {"days_ago": 7, "pages": 40},
                    {"days_ago": 4, "pages": 55},
                    {"days_ago": 1, "pages": 40},
                ]
            },
            {
                "title": "The Pragmatic Programmer: Your Journey to Mastery",
                "author": "Andrew Hunt & David Thomas",
                "genre": "Software Engineering",
                "status": BookStatus.COMPLETED.value,
                "total_pages": 352,
                "current_page": 352,
                "rating": 5,
                "notes": "A landmark classic for any developer. The concept of software entropy (broken windows) and orthogonality fundamentally altered how I write code.",
                "cover_image_url": "https://covers.openlibrary.org/b/id/9269962-L.jpg",
                "isbn": "9780135957059",
                "start_date": now - timedelta(days=28),
                "finish_date": now - timedelta(days=4),
                "logs": [
                    {"days_ago": 20, "pages": 80},
                    {"days_ago": 15, "pages": 90},
                    {"days_ago": 10, "pages": 110},
                    {"days_ago": 4, "pages": 72},
                ]
            },
            {
                "title": "Deep Work: Rules for Focused Success in a Distracted World",
                "author": "Cal Newport",
                "genre": "Self-Help",
                "status": BookStatus.COMPLETED.value,
                "total_pages": 304,
                "current_page": 304,
                "rating": 5,
                "notes": "Practical guidelines on deep concentration, quitting shallow social media loops, and executing rigorous daily focus blocks.",
                "cover_image_url": "https://covers.openlibrary.org/b/id/8231990-L.jpg",
                "isbn": "9781455586691",
                "start_date": now - timedelta(days=35),
                "finish_date": now - timedelta(days=11),
                "logs": [
                    {"days_ago": 25, "pages": 100},
                    {"days_ago": 18, "pages": 95},
                    {"days_ago": 11, "pages": 109},
                ]
            },
            {
                "title": "The Psychology of Money",
                "author": "Morgan Housel",
                "genre": "Business",
                "status": BookStatus.COMPLETED.value,
                "total_pages": 256,
                "current_page": 256,
                "rating": 4,
                "notes": "Financial success is a soft skill, where how you behave is more important than what you know. Staying wealthy requires paranoia and frugality.",
                "cover_image_url": "https://covers.openlibrary.org/b/id/10594833-L.jpg",
                "isbn": "9780857197689",
                "start_date": now - timedelta(days=45),
                "finish_date": now - timedelta(days=18),
                "logs": [
                    {"days_ago": 22, "pages": 85},
                    {"days_ago": 18, "pages": 171},
                ]
            },
            {
                "title": "Designing Data-Intensive Applications",
                "author": "Martin Kleppmann",
                "genre": "Software Engineering",
                "status": BookStatus.WISHLIST.value,
                "total_pages": 616,
                "current_page": 0,
                "rating": None,
                "notes": "The definitive guide to distributed architectures, storage engines, and consensus algorithms.",
                "cover_image_url": "https://covers.openlibrary.org/b/id/8091016-L.jpg",
                "isbn": "9781449373320",
                "start_date": None,
                "finish_date": None,
                "logs": []
            },
            {
                "title": "Project Hail Mary",
                "author": "Andy Weir",
                "genre": "Science Fiction",
                "status": BookStatus.WISHLIST.value,
                "total_pages": 496,
                "current_page": 0,
                "rating": None,
                "notes": "Riveting hard sci-fi survival adventure by the author of The Martian.",
                "cover_image_url": "https://covers.openlibrary.org/b/id/11107849-L.jpg",
                "isbn": "9780593135204",
                "start_date": None,
                "finish_date": None,
                "logs": []
            }
        ]

        total_logs = 0
        for data in books_data:
            logs = data.pop("logs")
            book = Book(user_id=user_id, **data)
            db.add(book)
            db.commit()
            db.refresh(book)

            for l in logs:
                log_time = now - timedelta(days=l["days_ago"])
                reading_log = ReadingLog(
                    book_id=book.id,
                    pages_read=l["pages"],
                    logged_at=log_time
                )
                db.add(reading_log)
                total_logs += 1

        db.commit()
        print(f"[SUCCESS] Seeded {len(books_data)} books and {total_logs} reading sessions for '{target_user.username}'!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding failed: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
