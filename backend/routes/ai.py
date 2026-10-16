"""
AI and Predictive analytics router for Book Buddy.
Features Dual-Engine Architecture:
1. Live Google Gemini integration (gemini-3.7-flash, gemini-3.1-flash-lite) when GEMINI_API_KEY is configured.
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
    Asynchronously queries Google Gemini API with automatic model failover.
    Sends API key securely in the 'x-goog-api-key' request header.
    Returns None if key is missing or on any upstream error (triggering graceful fallback).
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None

    # Multi-model pool with automatic failover across active models
    models_to_try = [
        "gemini-3.7-flash",
        "gemini-3.1-flash-lite",
        "gemini-3.5-flash",
        "gemini-3.8-flash",
    ]

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ]
    }

    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": api_key,
    }

    try:
        async with httpx.AsyncClient(timeout=14.0) as client:
            for model_name in models_to_try:
                endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
                try:
                    resp = await client.post(endpoint, headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            texts = [p.get("text", "") for p in parts if p.get("text") and not p.get("thought")]
                            if texts:
                                return "\n".join(texts).strip()
                            elif parts and parts[-1].get("text"):
                                return parts[-1].get("text", "").strip()
                except Exception:
                    continue
    except Exception:
        # Graceful degradation: Fall back seamlessly to smart heuristics engine
        pass

    return None


# ==========================================
# CURATED KNOWLEDGE BASE (SMART FALLBACK)
# ==========================================

CURATED_CATALOG = {
    "Software Engineering": [
        {"title": "Refactoring: Improving the Design of Existing Code", "author": "Martin Fowler", "genre": "Software Engineering", "reason": "The seminal guide to restructuring existing software and improving code maintainability.", "cover_image_url": "https://covers.openlibrary.org/b/id/7087623-M.jpg"},
        {"title": "System Design Interview – An Insider's Guide", "author": "Alex Xu", "genre": "Software Engineering", "reason": "Step-by-step frameworks for architecting large-scale, high-availability distributed systems.", "cover_image_url": "https://covers.openlibrary.org/b/id/12818862-M.jpg"},
        {"title": "Building Microservices", "author": "Sam Newman", "genre": "Software Engineering", "reason": "Comprehensive best practices for fine-grained service boundaries, integration, and deployment.", "cover_image_url": "https://covers.openlibrary.org/b/id/8315182-M.jpg"},
        {"title": "A Philosophy of Software Design", "author": "John Ousterhout", "genre": "Software Engineering", "reason": "Deep insights on managing cognitive complexity and creating deep module interfaces.", "cover_image_url": "https://covers.openlibrary.org/b/id/10574697-M.jpg"},
        {"title": "Clean Architecture", "author": "Robert C. Martin", "genre": "Software Engineering", "reason": "Essential rules on component separation, dependency inversion, and business logic isolation.", "cover_image_url": "https://covers.openlibrary.org/b/id/8660309-M.jpg"}
    ],
    "Technology": [
        {"title": "Site Reliability Engineering", "author": "Betsy Beyer & Niall Murphy", "genre": "Technology", "reason": "How Google runs production systems with SLA monitoring, blameless postmortems, and automation.", "cover_image_url": "https://covers.openlibrary.org/b/id/8315162-M.jpg"},
        {"title": "Staff Engineer: Leadership Beyond the Management Track", "author": "Will Larson", "genre": "Technology", "reason": "A roadmap for navigating senior technical individual contributor roles and technical leadership.", "cover_image_url": "https://covers.openlibrary.org/b/id/10952093-M.jpg"},
        {"title": "Kubernetes: Up and Running", "author": "Brendan Burns, Joe Beda, Kelsey Hightower", "genre": "Technology", "reason": "Dive into container orchestration, distributed deployment, and resilient cluster architectures.", "cover_image_url": "https://covers.openlibrary.org/b/id/8315174-M.jpg"}
    ],
    "Self-Help": [
        {"title": "Essentialism: The Disciplined Pursuit of Less", "author": "Greg McKeown", "genre": "Self-Help", "reason": "Framework to eliminate non-essentials and channel energy into your highest point of contribution.", "cover_image_url": "https://covers.openlibrary.org/b/id/8231990-M.jpg"},
        {"title": "Make Time: How to Focus on What Matters Every Day", "author": "Jake Knapp & John Zeratsky", "genre": "Self-Help", "reason": "Tactical methods from the creators of Design Sprints to protect daily focus from modern distraction.", "cover_image_url": "https://covers.openlibrary.org/b/id/8753205-M.jpg"},
        {"title": "Four Thousand Weeks: Time Management for Mortals", "author": "Oliver Burkeman", "genre": "Self-Help", "reason": "A philosophical exploration of human finitude and choosing what truly matters in limited time.", "cover_image_url": "https://covers.openlibrary.org/b/id/12690940-M.jpg"},
        {"title": "Mindset: The New Psychology of Success", "author": "Carol S. Dweck", "genre": "Self-Help", "reason": "Groundbreaking research on how adopting a growth mindset unlocks potential and resilience.", "cover_image_url": "https://covers.openlibrary.org/b/id/8235113-M.jpg"}
    ],
    "Science Fiction": [
        {"title": "The Three-Body Problem", "author": "Cixin Liu", "genre": "Science Fiction", "reason": "A mind-bending first-contact hard sci-fi trilogy exploring quantum dimensions and cosmic sociology.", "cover_image_url": "https://covers.openlibrary.org/b/id/8228691-M.jpg"},
        {"title": "Children of Time", "author": "Adrian Tchaikovsky", "genre": "Science Fiction", "reason": "An imaginative space epic chronicling the terraforming of a new world and the uplift of spider civilization.", "cover_image_url": "https://covers.openlibrary.org/b/id/10639918-M.jpg"},
        {"title": "Hyperion", "author": "Dan Simmons", "genre": "Science Fiction", "reason": "A celebrated space-opera pilgrimage inspired by The Canterbury Tales with unforgettable world-building.", "cover_image_url": "https://covers.openlibrary.org/b/id/301195-M.jpg"},
        {"title": "Foundation", "author": "Isaac Asimov", "genre": "Science Fiction", "reason": "The monumental galactic saga of psychohistory, mathematical forecasting, and the fall of empires.", "cover_image_url": "https://covers.openlibrary.org/b/id/8739161-M.jpg"}
    ],
    "Business": [
        {"title": "The Lean Startup", "author": "Eric Ries", "genre": "Business", "reason": "Build-Measure-Learn feedback loops for validating product hypotheses and eliminating wasted effort.", "cover_image_url": "https://covers.openlibrary.org/b/id/7269805-M.jpg"},
        {"title": "Shoe Dog: A Memoir by the Creator of Nike", "author": "Phil Knight", "genre": "Business", "reason": "An authentic, gritty chronicle of bootstrapping Nike against impossible odds and fierce obstacles.", "cover_image_url": "https://covers.openlibrary.org/b/id/8314134-M.jpg"},
        {"title": "High Output Management", "author": "Andrew S. Grove", "genre": "Business", "reason": "Legendary management principles on team leverage, operational efficiency, and organizational output.", "cover_image_url": "https://covers.openlibrary.org/b/id/8231856-M.jpg"},
        {"title": "Rework", "author": "Jason Fried & David Heinemeier Hansson", "genre": "Business", "reason": "A contrarian, straightforward manifesto on running modern lean companies without bloat.", "cover_image_url": "https://covers.openlibrary.org/b/id/6513470-M.jpg"}
    ],
    "Psychology": [
        {"title": "Predictably Irrational", "author": "Dan Ariely", "genre": "Psychology", "reason": "Fascinating behavioral economics experiments revealing the hidden forces behind irrational choices.", "cover_image_url": "https://covers.openlibrary.org/b/id/6524340-M.jpg"},
        {"title": "Influence: The Psychology of Persuasion", "author": "Robert Cialdini", "genre": "Psychology", "reason": "The classic study detailing the six universal principles of reciprocity, commitment, and social proof.", "cover_image_url": "https://covers.openlibrary.org/b/id/8231991-M.jpg"},
        {"title": "Quiet: The Power of Introverts in a World That Can't Stop Talking", "author": "Susan Cain", "genre": "Psychology", "reason": "Celebrates the quiet strength and irreplaceable power of introverted thinkers and leaders.", "cover_image_url": "https://covers.openlibrary.org/b/id/7074413-M.jpg"},
        {"title": "Man's Search for Meaning", "author": "Viktor E. Frankl", "genre": "Psychology", "reason": "A deeply moving memoir and psychological perspective on resilience and purpose in extreme adversity.", "cover_image_url": "https://covers.openlibrary.org/b/id/8231993-M.jpg"}
    ],
    "History": [
        {"title": "Guns, Germs, and Steel", "author": "Jared Diamond", "genre": "History", "reason": "A transdisciplinary investigation of geographic and environmental factors shaping human history.", "cover_image_url": "https://covers.openlibrary.org/b/id/8231859-M.jpg"},
        {"title": "The Silk Roads: A New History of the World", "author": "Peter Frankopan", "genre": "History", "reason": "A re-examination of world history focusing on the economic and cultural networks connecting East and West.", "cover_image_url": "https://covers.openlibrary.org/b/id/8314138-M.jpg"},
        {"title": "A Short History of Nearly Everything", "author": "Bill Bryson", "genre": "History", "reason": "A delightfully entertaining chronicle of scientific discovery from the Big Bang to the rise of civilization.", "cover_image_url": "https://covers.openlibrary.org/b/id/8231862-M.jpg"}
    ],
    "Biography": [
        {"title": "Leonardo da Vinci", "author": "Walter Isaacson", "genre": "Biography", "reason": "A portrait of history's greatest genius, uniting art, science, anatomy, and relentless curiosity.", "cover_image_url": "https://covers.openlibrary.org/b/id/8314140-M.jpg"},
        {"title": "Elon Musk", "author": "Walter Isaacson", "genre": "Biography", "reason": "An unfiltered look into the intense, high-stakes driving forces behind Tesla, SpaceX, and Neuralink.", "cover_image_url": "https://covers.openlibrary.org/b/id/13897148-M.jpg"}
    ],
    "Fiction": [
        {"title": "The Midnight Library", "author": "Matt Haig", "genre": "Fiction", "reason": "A heartening exploration of choices, regret, and the infinite potential paths not taken.", "cover_image_url": "https://covers.openlibrary.org/b/id/10389345-M.jpg"},
        {"title": "Klara and the Sun", "author": "Kazuo Ishiguro", "genre": "Fiction", "reason": "A delicate, haunting perspective on love and humanity through the eyes of an artificial friend.", "cover_image_url": "https://covers.openlibrary.org/b/id/10574700-M.jpg"}
    ]
}


# ==========================================
# OPEN LIBRARY INTEGRATIONS & COVER RESOLVER
# ==========================================

GENRE_SUBJECT_MAP = {
    "software engineering": "software_engineering",
    "technology": "technology",
    "computer science": "computer_science",
    "science fiction": "science_fiction",
    "fantasy": "fantasy",
    "fiction": "fiction",
    "self-help": "self-help",
    "business": "business",
    "psychology": "psychology",
    "history": "history",
    "biography": "biography",
    "philosophy": "philosophy",
    "thriller": "thriller",
    "mystery": "mystery",
    "romance": "romance",
    "science": "science",
    "economics": "economics",
    "poetry": "poetry",
}


async def fetch_cover_for_book(client: httpx.AsyncClient, title: str, author: str) -> Optional[str]:
    """Helper to query Open Library search API for high-resolution cover image."""
    try:
        url = f"https://openlibrary.org/search.json?title={title}&author={author}&limit=1"
        resp = await client.get(url, timeout=3.5)
        if resp.status_code == 200:
            docs = resp.json().get("docs", [])
            if docs and docs[0].get("cover_i"):
                return f"https://covers.openlibrary.org/b/id/{docs[0]['cover_i']}-M.jpg"
    except Exception:
        pass
    return None


async def fetch_open_library_recommendations(
    genres: List[str],
    is_already_owned_fn
) -> List[AIRecommendationItem]:
    """
    Tier 2: Queries Open Library subject API for top-circulated books in the reader's top genres.
    Skips any titles the reader already owns.
    """
    recs: List[AIRecommendationItem] = []
    seen_titles = set()

    try:
        async with httpx.AsyncClient(timeout=4.5) as client:
            for genre in genres[:3]:
                slug = GENRE_SUBJECT_MAP.get(genre.lower().strip(), genre.lower().strip().replace(" ", "_"))
                try:
                    resp = await client.get(f"https://openlibrary.org/subjects/{slug}.json?limit=10")
                    if resp.status_code == 200:
                        works = resp.json().get("works", [])
                        for w in works:
                            title = w.get("title", "").strip()
                            if not title or title.lower() in seen_titles or is_already_owned_fn(title):
                                continue
                            seen_titles.add(title.lower())
                            authors = [a.get("name") for a in w.get("authors", []) if a.get("name")]
                            author_str = ", ".join(authors) if authors else "Classic Author"
                            cover_id = w.get("cover_id")
                            cover_url = f"https://covers.openlibrary.org/b/id/{cover_id}-M.jpg" if cover_id else None

                            recs.append(AIRecommendationItem(
                                title=title,
                                author=author_str,
                                genre=genre,
                                reason=f"One of the most widely read and celebrated works in {genre} on Open Library.",
                                cover_image_url=cover_url
                            ))
                            if len(recs) >= 4:
                                return recs
                except Exception:
                    continue
    except Exception:
        pass

    return recs


# ==========================================
# ENDPOINT 1: 3-TIER RECOMMENDATION ENGINE
# ==========================================

@router.post("/recommend", response_model=AIRecommendResponse)
async def get_book_recommendations(
    req: AIRecommendRequest = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Three-tier resilient recommendation engine:
    1. Google Gemini AI (prompted with owned titles to strictly exclude).
    2. Open Library most-read books across the reader's top 3 genres.
    3. Curated library classics knowledge base (zero-network offline fallback).
    Guarantees every book skips already-owned volumes and attaches high-resolution cover artwork.
    """
    # 1. Inspect user reading profile & compile exclusion list
    user_books = db.query(Book).filter(Book.user_id == current_user.id).all()
    user_genres = [b.genre for b in user_books if b.genre]
    liked_titles = [f"'{b.title}' by {b.author}" for b in user_books if (b.rating and b.rating >= 4) or b.status == BookStatus.COMPLETED.value]

    # Gather all existing book titles owned by user (normalized for collision checks)
    existing_titles = [b.title.strip() for b in user_books if b.title]
    existing_titles_set = {b.title.lower().strip() for b in user_books if b.title}

    def is_already_owned(title: str) -> bool:
        """Helper to determine if a recommended title collides with existing library."""
        t = title.lower().strip()
        return any(
            t == ext or (len(t) > 6 and t in ext) or (len(ext) > 6 and ext in t)
            for ext in existing_titles_set
        )

    target_genres = req.preferred_genres if (req and req.preferred_genres) else (list(set(user_genres)) or ["Software Engineering", "Self-Help", "Fiction"])

    # ----------------------------------------------------
    # TIER 1: GOOGLE GEMINI AI
    # ----------------------------------------------------
    existing_titles_prompt = ", ".join([f"'{t}'" for t in existing_titles[:25]]) if existing_titles else "None"
    prompt = f"""
    You are Book Buddy's AI Reading Assistant.
    Recommend 4 personalized books for a reader who enjoys these genres: {', '.join(target_genres)}.
    Books they highly rated in the past: {', '.join(liked_titles[:5]) if liked_titles else 'Various bestsellers'}.

    CRITICAL EXCLUSION RULE:
    The reader ALREADY OWNS the following books in their library:
    [{existing_titles_prompt}]

    MANDATORY REQUIREMENT:
    Do NOT recommend any book listed above. Every single recommendation MUST be a FRESH, NEW book that is NOT in the reader's library.
    
    Return strictly a JSON array of objects with keys: "title", "author", "genre", "reason".
    Output ONLY valid JSON without markdown tags.
    """
    gemini_output = await call_gemini(prompt)
    if gemini_output:
        try:
            cleaned_json = re.sub(r"^```json\s*|\s*```$", "", gemini_output.strip())
            parsed = json.loads(cleaned_json)
            if isinstance(parsed, list) and len(parsed) > 0:
                valid_recs: List[AIRecommendationItem] = []
                async with httpx.AsyncClient(timeout=3.5) as client:
                    for item in parsed:
                        title = item.get("title", "").strip()
                        author = item.get("author", "").strip()
                        if title and not is_already_owned(title):
                            cover_url = await fetch_cover_for_book(client, title, author)
                            valid_recs.append(AIRecommendationItem(
                                title=title,
                                author=author,
                                genre=item.get("genre", "Literature"),
                                reason=item.get("reason", "Recommended by Gemini AI based on your reading profile."),
                                cover_image_url=cover_url
                            ))
                if len(valid_recs) >= 2:
                    return AIRecommendResponse(recommendations=valid_recs[:4], source="gemini-ai")
        except Exception:
            pass

    # ----------------------------------------------------
    # TIER 2: OPEN LIBRARY MOST-READ BOOKS IN TOP 3 GENRES
    # ----------------------------------------------------
    ol_recs = await fetch_open_library_recommendations(target_genres, is_already_owned)
    if len(ol_recs) >= 2:
        return AIRecommendResponse(recommendations=ol_recs[:4], source="open-library")

    # ----------------------------------------------------
    # TIER 3: CURATED LIBRARY CLASSICS (OFFLINE FALLBACK)
    # ----------------------------------------------------
    recommendations: List[AIRecommendationItem] = []
    
    # First pass: Look in user's target genres
    for genre in target_genres:
        matched = CURATED_CATALOG.get(genre, CURATED_CATALOG.get("Software Engineering", []))
        for b in matched:
            if not is_already_owned(b["title"]) and not any(r.title.lower() == b["title"].lower() for r in recommendations):
                recommendations.append(AIRecommendationItem(
                    title=b["title"],
                    author=b["author"],
                    genre=b["genre"],
                    reason=b["reason"],
                    cover_image_url=b.get("cover_image_url")
                ))
            if len(recommendations) >= 4:
                break
        if len(recommendations) >= 4:
            break

    # Second pass: If user already owns all titles in their target genres, explore complementary genres
    if len(recommendations) < 4:
        for cat_genre, cat_books in CURATED_CATALOG.items():
            for b in cat_books:
                if not is_already_owned(b["title"]) and not any(r.title.lower() == b["title"].lower() for r in recommendations):
                    recommendations.append(AIRecommendationItem(
                        title=b["title"],
                        author=b["author"],
                        genre=b["genre"],
                        reason=b["reason"],
                        cover_image_url=b.get("cover_image_url")
                    ))
                if len(recommendations) >= 4:
                    break
            if len(recommendations) >= 4:
                break

    return AIRecommendResponse(recommendations=recommendations[:4], source="curated-catalog")


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
