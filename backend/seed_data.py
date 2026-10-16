"""
Seed script to populate Book Buddy with rich, realistic dummy data for reference.
Includes diverse genres, authentic Open Library cover images, physical page counts,
reading progress, reflection notes, and daily reading session logs for telemetry charts.
"""

from datetime import datetime, timedelta
import random
import os
import sys

# Ensure backend package can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal, engine, Base
from backend.models import User, Book, ReadingLog, BookStatus
from backend.auth import get_password_hash

REFERENCE_BOOKS = [
    {
        "title": "Clean Code: A Handbook of Agile Software Craftsmanship",
        "author": "Robert C. Martin",
        "genre": "Software Engineering",
        "status": "completed",
        "total_pages": 464,
        "current_page": 464,
        "rating": 5,
        "notes": "Essential foundational reading for maintainable system architecture. Key takeaway: leave the campsite cleaner than you found it. Meaningful naming and single-responsibility functions are non-negotiable.",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg",
        "isbn": "9780132350884",
        "days_ago_start": 45,
        "days_ago_finish": 12,
    },
    {
        "title": "Atomic Habits",
        "author": "James Clear",
        "genre": "Self-Help",
        "status": "reading",
        "total_pages": 320,
        "current_page": 215,
        "rating": 5,
        "notes": "Fascinating breakdown of the 4 Laws of Behavior Change. The concept of 1% daily compounding improvement changes how I approach daily reading sessions.",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg",
        "isbn": "9780735211292",
        "days_ago_start": 20,
        "days_ago_finish": None,
    },
    {
        "title": "Designing Data-Intensive Applications",
        "author": "Martin Kleppmann",
        "genre": "Technology",
        "status": "reading",
        "total_pages": 616,
        "current_page": 310,
        "rating": 5,
        "notes": "Deep dive into reliability, scalability, and maintainability. Invaluable analysis of replication lag, consensus algorithms, and distributed transactions.",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9781449373320-L.jpg",
        "isbn": "9781449373320",
        "days_ago_start": 28,
        "days_ago_finish": None,
    },
    {
        "title": "The Pragmatic Programmer",
        "author": "David Thomas & Andrew Hunt",
        "genre": "Software Engineering",
        "status": "completed",
        "total_pages": 352,
        "current_page": 352,
        "rating": 5,
        "notes": "Timeless principles of software engineering. Great reminders on orthogonality, tracer bullets, broken windows theory, and pragmatic automation.",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780135957059-L.jpg",
        "isbn": "9780135957059",
        "days_ago_start": 60,
        "days_ago_finish": 30,
    },
    {
        "title": "Dune",
        "author": "Frank Herbert",
        "genre": "Science Fiction",
        "status": "completed",
        "total_pages": 688,
        "current_page": 688,
        "rating": 5,
        "notes": "A sprawling masterpiece of ecology, religion, and political philosophy. 'Fear is the mind-killer' remains one of the most resonant mantras in literature.",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg",
        "isbn": "9780441172719",
        "days_ago_start": 80,
        "days_ago_finish": 18,
    },
    {
        "title": "Steve Jobs",
        "author": "Walter Isaacson",
        "genre": "Biography",
        "status": "completed",
        "total_pages": 656,
        "current_page": 656,
        "rating": 4,
        "notes": "A brutally honest and gripping portrait of relentless perfectionism, product intuition, and the intersection of technology and the liberal arts.",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9781451648539-L.jpg",
        "isbn": "9781451648539",
        "days_ago_start": 90,
        "days_ago_finish": 40,
    },
    {
        "title": "Sapiens: A Brief History of Humankind",
        "author": "Yuval Noah Harari",
        "genre": "History",
        "status": "completed",
        "total_pages": 464,
        "current_page": 464,
        "rating": 5,
        "notes": "Brilliant exploration of how shared fictions and collective imagination enabled Homo sapiens to build large-scale civilizations and legal structures.",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg",
        "isbn": "9780062316097",
        "days_ago_start": 50,
        "days_ago_finish": 22,
    },
    {
        "title": "Thinking, Fast and Slow",
        "author": "Daniel Kahneman",
        "genre": "Psychology",
        "status": "reading",
        "total_pages": 499,
        "current_page": 195,
        "rating": 4,
        "notes": "Analysis of System 1 (fast, intuitive) and System 2 (slow, deliberate) thought processes. Crucial for understanding cognitive biases in decision making.",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780374275631-L.jpg",
        "isbn": "9780374275631",
        "days_ago_start": 15,
        "days_ago_finish": None,
    },
    {
        "title": "Project Hail Mary",
        "author": "Andy Weir",
        "genre": "Science Fiction",
        "status": "wishlist",
        "total_pages": 496,
        "current_page": 0,
        "rating": None,
        "notes": "Highly recommended for its scientifically rigorous space survival narrative and problem-solving ingenuity.",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780593135204-L.jpg",
        "isbn": "9780593135204",
        "days_ago_start": None,
        "days_ago_finish": None,
    },
    {
        "title": "The Psychology of Money",
        "author": "Morgan Housel",
        "genre": "Business",
        "status": "wishlist",
        "total_pages": 256,
        "current_page": 0,
        "rating": None,
        "notes": "Timeless lessons on wealth, greed, and happiness. Focuses on behavior and emotions rather than spreadsheet formulas.",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780857197689-L.jpg",
        "isbn": "9780857197689",
        "days_ago_start": None,
        "days_ago_finish": None,
    },
    {
        "title": "Deep Work: Rules for Focused Success",
        "author": "Cal Newport",
        "genre": "Self-Help",
        "status": "wishlist",
        "total_pages": 304,
        "current_page": 0,
        "rating": None,
        "notes": "Actionable framework to cultivate distraction-free concentration and produce elite intellectual output.",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9781455586691-L.jpg",
        "isbn": "9781455586691",
        "days_ago_start": None,
        "days_ago_finish": None,
    },
    {
        "title": "Zero to One: Notes on Startups",
        "author": "Peter Thiel",
        "genre": "Business",
        "status": "wishlist",
        "total_pages": 224,
        "current_page": 0,
        "rating": None,
        "notes": "Contrarian philosophy on technology, network effects, and creating unprecedented vertical progress.",
        "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780804139298-L.jpg",
        "isbn": "9780804139298",
        "days_ago_start": None,
        "days_ago_finish": None,
    },
]


def seed_dummy_data():
    db = SessionLocal()
    now = datetime.utcnow()

    try:
        # 1. Ensure demo_reviewer user exists
        demo_user = db.query(User).filter(User.username == "demo_reviewer").first()
        if not demo_user:
            demo_user = User(
                username="demo_reviewer",
                email="reviewer@sayonetech.com",
                hashed_password=get_password_hash("DemoReviewer2026!"),
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            print("Created demo_reviewer account.")

        # Gather target users to seed (all registered non-system users)
        target_users = db.query(User).all()
        print(f"Target users for dummy data: {[u.username for u in target_users]}")

        for user in target_users:
            # Check existing titles for this user
            existing_titles = {
                b.title.lower().strip()
                for b in db.query(Book).filter(Book.user_id == user.id).all()
            }

            user_books_added = 0
            for book_spec in REFERENCE_BOOKS:
                title_key = book_spec["title"].lower().strip()
                # If book with similar title already exists, skip to prevent duplicates
                if any(title_key.startswith(t) or t.startswith(title_key[:15]) for t in existing_titles):
                    continue

                start_dt = (now - timedelta(days=book_spec["days_ago_start"])) if book_spec["days_ago_start"] else None
                finish_dt = (now - timedelta(days=book_spec["days_ago_finish"])) if book_spec["days_ago_finish"] else None

                new_book = Book(
                    user_id=user.id,
                    title=book_spec["title"],
                    author=book_spec["author"],
                    genre=book_spec["genre"],
                    status=book_spec["status"],
                    total_pages=book_spec["total_pages"],
                    current_page=book_spec["current_page"],
                    rating=book_spec["rating"],
                    notes=book_spec["notes"],
                    cover_image_url=book_spec["cover_image_url"],
                    isbn=book_spec["isbn"],
                    start_date=start_dt,
                    finish_date=finish_dt,
                    created_at=start_dt or (now - timedelta(days=25)),
                    updated_at=finish_dt or (now - timedelta(days=1)),
                )
                db.add(new_book)
                db.flush()  # get new_book.id
                user_books_added += 1

                # Generate daily reading session logs for active and completed books
                if book_spec["status"] in ("reading", "completed") and book_spec["current_page"] > 0:
                    pages_to_distribute = book_spec["current_page"]
                    days_active = book_spec.get("days_ago_start") or 30
                    finish_days = book_spec.get("days_ago_finish") or 0

                    # Create 8-15 reading log entries spread across the reading window
                    num_sessions = min(15, max(6, days_active - finish_days))
                    avg_pages = max(10, pages_to_distribute // num_sessions)

                    remaining_pages = pages_to_distribute
                    for i in range(num_sessions):
                        if remaining_pages <= 0:
                            break
                        session_pages = min(remaining_pages, random.randint(max(8, avg_pages - 8), avg_pages + 12))
                        # Session date between start and finish
                        day_offset = finish_days + (i * ((days_active - finish_days) // num_sessions))
                        log_time = now - timedelta(days=day_offset, hours=random.randint(1, 12))

                        log = ReadingLog(
                            book_id=new_book.id,
                            pages_read=session_pages,
                            logged_at=log_time,
                        )
                        db.add(log)
                        remaining_pages -= session_pages

            db.commit()
            print(f"User '{user.username}': added {user_books_added} reference volumes.")

        print("Dummy data seeding successfully completed!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_dummy_data()
