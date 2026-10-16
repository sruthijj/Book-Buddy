"""
Open Library Client and Metadata Normalization Service.
Provides robust title/author search, ISBN lookups, and subject-to-genre classification
aligned with Book Buddy's canonical genre taxonomies.
"""

import re
import urllib.parse
from typing import List, Optional, Union
import httpx

from .schemas import CatalogBookItem, ISBNBookLookup

CANONICAL_GENRES = [
    "Technology",
    "Software Engineering",
    "Self-Help",
    "Fiction",
    "Science Fiction",
    "Business",
    "Psychology",
    "Biography",
    "History",
]

# Blacklist of noisy or purely institutional library tags from Open Library
EXCLUDED_SUBJECT_TERMS = {
    "accessible book",
    "protected daisy",
    "in library",
    "overdrive",
    "long now foundation",
    "lending library",
    "new york times bestseller",
    "nyt:trade-fiction=",
    "nyt:trade-nonfiction=",
    "nyt:hardcover-fiction=",
    "nyt:hardcover-nonfiction=",
    "audiobook",
    "electronic books",
    "paperback",
}

# Ordered rules: First match determines the canonical genre
GENRE_RULES = [
    (
        "Software Engineering",
        [
            "software engineering",
            "software development",
            "computer programming",
            "programming languages",
            "coding",
            "algorithms",
            "computer science",
            "web development",
            "python",
            "javascript",
            "c++",
            "devops",
            "system design",
            "agile",
            "clean code",
        ],
    ),
    (
        "Technology",
        [
            "technology",
            "computers",
            "internet",
            "artificial intelligence",
            "data structures",
            "data science",
            "machine learning",
            "cybernetics",
            "tech",
            "information technology",
            "cybersecurity",
        ],
    ),
    (
        "Science Fiction",
        [
            "science fiction",
            "sci-fi",
            "space exploration",
            "extraterrestrial",
            "aliens",
            "dystopian",
            "dystopias",
            "time travel",
            "cyberpunk",
            "steampunk",
            "space opera",
            "fantasy",
            "post-apocalyptic",
        ],
    ),
    (
        "Psychology",
        [
            "psychology",
            "cognitive",
            "behavior",
            "behaviour",
            "neuroscience",
            "mind and body",
            "psychiatry",
            "consciousness",
            "mental health",
            "emotions",
        ],
    ),
    (
        "Self-Help",
        [
            "self-help",
            "self help",
            "personal growth",
            "productivity",
            "habits",
            "motivation",
            "success",
            "personal development",
            "leadership",
            "time management",
            "decision making",
            "assertiveness",
            "happiness",
        ],
    ),
    (
        "Business",
        [
            "business",
            "economics",
            "finance",
            "management",
            "marketing",
            "investing",
            "entrepreneurship",
            "money",
            "commerce",
            "leadership",
            "startups",
            "venture capital",
        ],
    ),
    (
        "Biography",
        [
            "biography",
            "autobiography",
            "memoir",
            "memoirs",
            "diaries",
            "biographical",
            "personal narratives",
        ],
    ),
    (
        "History",
        [
            "history",
            "historical",
            "world war",
            "revolution",
            "civilization",
            "ancient",
            "medieval",
            "century",
            "archaeology",
            "politics and government",
        ],
    ),
    (
        "Fiction",
        [
            "fiction",
            "novel",
            "literature",
            "classic literature",
            "short stories",
            "drama",
            "mystery",
            "thriller",
            "detective",
            "crime",
            "suspense",
            "romance",
            "action & adventure",
        ],
    ),
]


def normalize_genre(raw_subjects: Optional[Union[List[Union[str, dict]], str]]) -> str:
    """
    Cleans raw Open Library subject metadata and maps it onto Book Buddy's 9 canonical genres.
    Eliminates library jargon like 'Accessible book' and 'Protected DAISY' to keep
    the reader's analytics chart clean and informative.
    """
    if not raw_subjects:
        return "Fiction"

    # Flatten subjects into a list of lowercase strings
    subject_tokens: List[str] = []
    if isinstance(raw_subjects, str):
        subject_tokens.append(raw_subjects.lower().strip())
    elif isinstance(raw_subjects, list):
        for s in raw_subjects:
            if isinstance(s, dict):
                name = s.get("name", "")
                if name:
                    subject_tokens.append(name.lower().strip())
            elif isinstance(s, str):
                subject_tokens.append(s.lower().strip())

    # Filter out noisy library indexing tags
    cleaned_tokens = [
        t for t in subject_tokens
        if not any(excluded in t for excluded in EXCLUDED_SUBJECT_TERMS)
    ]

    combined_text = " ".join(cleaned_tokens)

    # Check rule taxonomy in prioritized order
    for genre_name, keywords in GENRE_RULES:
        for kw in keywords:
            # Word boundary matching for short words, substring for phrases
            pattern = rf"\b{re.escape(kw)}\b" if len(kw) <= 5 else re.escape(kw)
            if re.search(pattern, combined_text, re.IGNORECASE):
                return genre_name

    return "Fiction"


async def search_open_library_catalog(
    query: str,
    limit: int = 8
) -> List[CatalogBookItem]:
    """
    Queries Open Library Search API for books matching title, author, or keyword.
    Returns normalized candidates with titles, authors, page counts, covers, and genres.
    """
    clean_query = query.strip()
    if not clean_query:
        return []

    encoded = urllib.parse.quote(clean_query)
    fields = "key,title,author_name,first_publish_year,number_of_pages_median,cover_i,subject,isbn"
    url = f"https://openlibrary.org/search.json?q={encoded}&limit={limit}&fields={fields}"

    try:
        async with httpx.AsyncClient(timeout=9.0) as client:
            resp = await client.get(url)

        if resp.status_code != 200:
            return []

        data = resp.json()
        docs = data.get("docs", [])
        results: List[CatalogBookItem] = []

        for doc in docs:
            title = doc.get("title", "").strip()
            if not title:
                continue

            authors = doc.get("author_name", [])
            author_str = ", ".join(authors[:2]) if authors else "Unknown Author"

            pages = doc.get("number_of_pages_median") or 0
            year = str(doc.get("first_publish_year")) if doc.get("first_publish_year") else None

            cover_i = doc.get("cover_i")
            cover_url = f"https://covers.openlibrary.org/b/id/{cover_i}-M.jpg" if cover_i else None

            raw_subjects = doc.get("subject", [])
            genre = normalize_genre(raw_subjects)

            isbns = doc.get("isbn", [])
            isbn_val = isbns[0] if isbns else None

            results.append(CatalogBookItem(
                key=doc.get("key"),
                title=title,
                author=author_str,
                genre=genre,
                total_pages=int(pages),
                cover_image_url=cover_url,
                publish_year=year,
                isbn=isbn_val,
            ))

        return results
    except Exception:
        return []
