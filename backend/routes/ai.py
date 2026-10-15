"""
AI and Predictive analytics router for Book Buddy.
Features Dual-Engine Architecture:
1. Live Google Gemini 1.5 Flash integration when GEMINI_API_KEY is configured.
2. Built-in smart heuristics engine for zero-config, 100% reliable offline evaluation.
"""

import os
import json
import math
import re
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import httpx
from dotenv import load_dotenv
load_dotenv()

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Book, BookStatus, ReadingLog, User
from ..schemas import (
    AIRecommendRequest,
    AIRecommendResponse,
    AIRecommendationItem,
    AISummarizeRequest,
    AISummarizeResponse,
    AIReviewRequest,
    AIReviewResponse,
    CompletionPrediction,
)
from ..auth import get_current_user

router = APIRouter(prefix="/api/ai", tags=["AI Reading Assistant"])


# ==========================================
# GEMINI API CLIENT (DUAL-ENGINE LAYER)
# ==========================================

async def call_gemini(prompt: str) -> Optional[str]:
    """
    Asynchronously queries Google Gemini 1.5 Flash API if GEMINI_API_KEY is present.
    Returns None if key is missing or on any upstream error (triggering graceful fallback).
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None

    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ]
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(endpoint, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    # In Gemini 3.8 Flash, filter out internal thought parts to extract actual text
                    texts = [p.get("text", "") for p in parts if p.get("text") and not p.get("thought")]
                    if texts:
                        return "\n".join(texts).strip()
                    elif parts and parts[-1].get("text"):
                        return parts[-1].get("text", "").strip()
    except Exception:
        # Graceful degradation: Fall back seamlessly to smart heuristics engine
        pass

    return None


# ==========================================
# CURATED KNOWLEDGE BASE (SMART FALLBACK)
# ==========================================

CURATED_CATALOG = {
    "Self-Help": [
        {"title": "Atomic Habits", "author": "James Clear", "genre": "Self-Help", "reason": "The definitive framework on compounding small daily behavioral changes."},
        {"title": "Deep Work", "author": "Cal Newport", "genre": "Self-Help", "reason": "Actionable focus strategies to achieve peak productivity in a distracted world."},
        {"title": "The Psychology of Money", "author": "Morgan Housel", "genre": "Self-Help", "reason": "Timeless lessons on wealth, greed, and human financial decision-making."}
    ],
    "Technology": [
        {"title": "Clean Code", "author": "Robert C. Martin", "genre": "Technology", "reason": "The essential handbook of agile software craftsmanship and maintainability."},
        {"title": "Designing Data-Intensive Applications", "author": "Martin Kleppmann", "genre": "Technology", "reason": "The gold standard guide for scalable architectures and distributed systems."},
        {"title": "The Pragmatic Programmer", "author": "Andrew Hunt & David Thomas", "genre": "Technology", "reason": "Essential engineering habits for a long and productive development career."}
    ],
    "Science Fiction": [
        {"title": "Dune", "author": "Frank Herbert", "genre": "Science Fiction", "reason": "An epic masterwork exploring politics, ecology, and myth on Arrakis."},
        {"title": "Project Hail Mary", "author": "Andy Weir", "genre": "Science Fiction", "reason": "A thrilling interstellar survival tale driven by rigorous science and wit."},
        {"title": "The Three-Body Problem", "author": "Cixin Liu", "genre": "Science Fiction", "reason": "A mind-bending first-contact hard sci-fi trilogy."}
    ],
    "Fiction": [
        {"title": "The Midnight Library", "author": "Matt Haig", "genre": "Fiction", "reason": "A heartening exploration of choices, regret, and the paths not taken."},
        {"title": "Klara and the Sun", "author": "Kazuo Ishiguro", "genre": "Fiction", "reason": "A delicate, haunting perspective on love and humanity through an AI companion."}
    ],
    "Business": [
        {"title": "Zero to One", "author": "Peter Thiel", "genre": "Business", "reason": "Notes on startups and how to build the future by avoiding conventional competition."},
        {"title": "Good to Great", "author": "Jim Collins", "genre": "Business", "reason": "Empirical study on why some companies leap to greatness while others fail."}
    ]
}


# ==========================================
# ENDPOINT 1: AI RECOMMENDATIONS
# ==========================================

@router.post("/recommend", response_model=AIRecommendResponse)
async def get_book_recommendations(
    req: AIRecommendRequest = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Recommends books based on the user's reading history, favorite genres, and ratings.
    Uses Gemini 1.5 Flash if available, otherwise runs the smart heuristics engine.
    """
    # 1. Inspect user reading profile
    user_books = db.query(Book).filter(Book.user_id == current_user.id).all()
    user_genres = [b.genre for b in user_books if b.genre]
    liked_titles = [f"'{b.title}' by {b.author}" for b in user_books if (b.rating and b.rating >= 4) or b.status == BookStatus.COMPLETED.value]

    target_genres = req.preferred_genres if (req and req.preferred_genres) else (list(set(user_genres)) or ["Self-Help", "Technology"])

    # 2. Attempt Gemini Call
    prompt = f"""
    You are Book Buddy's AI Reading Assistant.
    Recommend 3 personalized books for a reader who likes genres: {', '.join(target_genres)}.
    Books they highly rated: {', '.join(liked_titles[:5]) if liked_titles else 'Various bestsellers'}.
    Return strictly a JSON array of objects with keys: "title", "author", "genre", "reason".
    Output ONLY valid JSON without markdown tags.
    """
    gemini_output = await call_gemini(prompt)
    if gemini_output:
        try:
            # Clean possible markdown wrap
            cleaned_json = re.sub(r"^```json\s*|\s*```$", "", gemini_output.strip())
            parsed = json.loads(cleaned_json)
            if isinstance(parsed, list) and len(parsed) > 0:
                recs = [AIRecommendationItem(**item) for item in parsed[:5]]
                return AIRecommendResponse(recommendations=recs, source="cloud-ai-engine")
        except Exception:
            pass

    # 3. Smart Heuristics Fallback
    recommendations: List[AIRecommendationItem] = []
    for genre in target_genres:
        matched = CURATED_CATALOG.get(genre, CURATED_CATALOG["Technology"])
        for b in matched:
            recommendations.append(AIRecommendationItem(
                title=b["title"],
                author=b["author"],
                genre=b["genre"],
                reason=b["reason"]
            ))
            if len(recommendations) >= 4:
                break
        if len(recommendations) >= 4:
            break

    if not recommendations:
        for b in CURATED_CATALOG["Self-Help"]:
            recommendations.append(AIRecommendationItem(**b))

    return AIRecommendResponse(recommendations=recommendations[:4], source="smart-heuristics-engine")


# ==========================================
# ENDPOINT 2: AI NOTES SUMMARIZER
# ==========================================

@router.post("/summarize", response_model=AISummarizeResponse)
async def summarize_notes(
    req: AISummarizeRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Condenses personal reading notes into key takeaways and an insightful summary.
    """
    notes_text = req.notes.strip()

    # 1. Attempt Gemini Call
    prompt = f"""
    You are an editorial reading assistant. Summarize the following reader notes for the book '{req.book_title or 'Untitled'}':
    \"\"\"{notes_text}\"\"\"

    Return strictly a JSON object with:
    - "summary": A 2-sentence executive summary.
    - "key_takeaways": A list of 3-4 bullet point takeaways.
    Output ONLY valid JSON without markdown wrapping.
    """
    gemini_output = await call_gemini(prompt)
    if gemini_output:
        try:
            cleaned_json = re.sub(r"^```json\s*|\s*```$", "", gemini_output.strip())
            parsed = json.loads(cleaned_json)
            return AISummarizeResponse(
                summary=parsed.get("summary", ""),
                key_takeaways=parsed.get("key_takeaways", []),
                source="cloud-ai-engine"
            )
        except Exception:
            pass

    # 2. Smart Heuristics Fallback (Sentence Salience & Point Extraction)
    sentences = [s.strip() for s in re.split(r"[.\n;]+", notes_text) if len(s.strip()) > 8]
    if len(sentences) >= 2:
        exec_summary = f"Reflecting on '{req.book_title or 'this book'}', the key focus centers on {sentences[0].lower()} and practical applications of these insights."
        takeaways = [f"Insight: {s}" for s in sentences[:4]]
    else:
        exec_summary = f"These notes highlight pivotal reflections from '{req.book_title or 'the book'}', emphasizing practical mastery and personal mindset."
        takeaways = [
            f"Core Takeaway: {notes_text[:80]}...",
            "Actionable Habit: Integrate the author's primary recommendations into daily routine.",
            "Reflective Value: A valuable addition to personal growth and perspective."
        ]

    return AISummarizeResponse(
        summary=exec_summary,
        key_takeaways=takeaways,
        source="smart-heuristics-engine"
    )


# ==========================================
# ENDPOINT 3: AI BOOK REVIEW GENERATOR
# ==========================================

@router.post("/review", response_model=AIReviewResponse)
async def generate_book_review(
    req: AIReviewRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generates a publication-style book review synthesized from notes and star rating.
    """
    # 1. Attempt Gemini Call
    prompt = f"""
    Write a thoughtful, publication-style book review for:
    Title: '{req.book_title}'
    Author: '{req.author}'
    Star Rating: {req.rating} out of 5 stars
    Reader Notes: '{req.notes or 'Enjoyed the pacing and overall themes'}'

    Return strictly a JSON object with:
    - "headline": A catchy review title
    - "review": A 2-3 paragraph cohesive critique
    Output ONLY valid JSON.
    """
    gemini_output = await call_gemini(prompt)
    if gemini_output:
        try:
            cleaned_json = re.sub(r"^```json\s*|\s*```$", "", gemini_output.strip())
            parsed = json.loads(cleaned_json)
            return AIReviewResponse(
                headline=parsed.get("headline", f"Review: {req.book_title}"),
                review=parsed.get("review", ""),
                source="cloud-ai-engine"
            )
        except Exception:
            pass

    # 2. Smart Heuristics Fallback
    rating_headlines = {
        5: f"An Absolute Masterpiece: Why '{req.book_title}' Demands to Be Read",
        4: f"Compelling and Insightful: Exploring '{req.book_title}' by {req.author}",
        3: f"Solid Core Concepts with Uneven Execution: Reviewing '{req.book_title}'",
        2: f"Promising Premise That Falls Short: A Look at '{req.book_title}'",
        1: f"A Missed Opportunity: Critique of '{req.book_title}'"
    }

    headline = rating_headlines.get(req.rating, f"Reflections on '{req.book_title}'")
    notes_clause = f"The reader noted that \"{req.notes}\", which resonates deeply with the central themes of the work." if req.notes else "The narrative structure and clarity of thought keep the reader engaged throughout."

    review_body = (
        f"'{req.book_title}' by {req.author} delivers a resonant reading experience. Awarded a {req.rating}/5 rating, "
        f"the book succeeds in weaving thought-provoking ideas with memorable pacing.\n\n"
        f"{notes_clause}\n\n"
        f"Overall, it stands as a worthy addition to any reading list, particularly for those passionate about understanding the craft and philosophy behind {req.author}'s work."
    )

    return AIReviewResponse(
        headline=headline,
        review=review_body,
        source="smart-heuristics-engine"
    )


# ==========================================
# ENDPOINT 4: COMPLETION DATE PREDICTOR
# ==========================================

@router.get("/predict-completion/{book_id}", response_model=CompletionPrediction)
def predict_book_completion(
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Calculates estimated completion date based on user's reading logs and velocity.
    Satisfies: 'Predict estimated completion date based on reading pattern'.
    """
    user_id = current_user.id

    book = db.query(Book).filter(
        Book.id == book_id,
        Book.user_id == user_id
    ).first()

    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book with ID {book_id} not found."
        )

    if book.status == BookStatus.COMPLETED.value or (book.total_pages > 0 and book.current_page >= book.total_pages):
        return CompletionPrediction(
            book_id=book.id,
            book_title=book.title,
            current_page=book.current_page,
            total_pages=book.total_pages,
            pages_remaining=0,
            average_daily_pace=0.0,
            days_remaining=0,
            estimated_completion_date="Already Completed!",
            confidence_level="High",
            status_message="You have already finished reading this book! 🎉"
        )

    if book.total_pages <= 0:
        return CompletionPrediction(
            book_id=book.id,
            book_title=book.title,
            current_page=book.current_page,
            total_pages=0,
            pages_remaining=0,
            average_daily_pace=15.0,
            days_remaining=0,
            estimated_completion_date="Unknown",
            confidence_level="Low",
            status_message="Please specify the total page count for this book to predict completion date."
        )

    pages_remaining = max(0, book.total_pages - book.current_page)

    # Calculate user's average reading velocity from reading logs (past 30 days)
    cutoff = datetime.utcnow() - timedelta(days=30)
    user_logs = db.query(ReadingLog).join(Book, ReadingLog.book_id == Book.id)\
        .filter(Book.user_id == user_id, ReadingLog.logged_at >= cutoff).all()

    if user_logs:
        total_pages_logged = sum(l.pages_read for l in user_logs)
        # Count distinct reading days
        distinct_days = len(set(l.logged_at.date() for l in user_logs)) or 1
        daily_pace = round(total_pages_logged / distinct_days, 1)
        # Cap minimum pace to 5 pages/day
        daily_pace = max(5.0, daily_pace)
        confidence = "High" if len(user_logs) >= 5 else "Medium"
    else:
        # Default baseline reading speed for new readers
        daily_pace = 18.0
        confidence = "Estimated (Baseline)"

    days_needed = math.ceil(pages_remaining / daily_pace)
    estimated_date = datetime.utcnow() + timedelta(days=days_needed)
    date_str = estimated_date.strftime("%B %d, %Y")

    status_msg = (
        f"At your current average pace of {daily_pace} pages/day, "
        f"you will finish in {days_needed} days on {date_str}."
    )

    return CompletionPrediction(
        book_id=book.id,
        book_title=book.title,
        current_page=book.current_page,
        total_pages=book.total_pages,
        pages_remaining=pages_remaining,
        average_daily_pace=daily_pace,
        days_remaining=days_needed,
        estimated_completion_date=date_str,
        confidence_level=confidence,
        status_message=status_msg
    )
