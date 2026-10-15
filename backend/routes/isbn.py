"""
ISBN Auto-Import route leveraging the Open Library Public API.
Fetches verified book metadata, covers, author details, and page counts.
"""

import re
from typing import Optional
import httpx
from fastapi import APIRouter, HTTPException, status

from ..schemas import ISBNBookLookup

router = APIRouter(prefix="/api/isbn", tags=["ISBN Lookup"])


def sanitize_isbn(raw_isbn: str) -> str:
    """
    Cleans raw ISBN string by stripping whitespace, hyphens, and converting 'x' to uppercase.
    Validates that the result conforms to standard 10 or 13 character formats.
    """
    cleaned = re.sub(r"[^0-9X]", "", raw_isbn.strip().upper())
    if len(cleaned) not in (10, 13):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid ISBN length ({len(cleaned)} digits). Standard ISBNs must be 10 or 13 digits."
        )
    return cleaned


@router.get("/{isbn}", response_model=ISBNBookLookup)
async def lookup_isbn(isbn: str):
    """
    Queries the Open Library REST API to retrieve book details by ISBN.
    Automatically normalizes:
    - Title
    - Authors (joined into a readable string)
    - Total page count
    - Primary Genre / Subject
    - High-resolution cover art URL
    - Publish year
    """
    clean_isbn = sanitize_isbn(isbn)
    api_url = f"https://openlibrary.org/api/books?bibkeys=ISBN:{clean_isbn}&format=json&jscmd=data"

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(api_url)

        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Open Library API service is currently unavailable. Please try again later."
            )

        data = response.json()
        book_key = f"ISBN:{clean_isbn}"

        if not data or book_key not in data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No book found for ISBN {clean_isbn} in Open Library."
            )

        book_data = data[book_key]

        # Extract Title
        title = book_data.get("title", "Untitled Book")

        # Extract Authors
        authors_list = book_data.get("authors", [])
        author_names = [a.get("name") for a in authors_list if a.get("name")]
        author = ", ".join(author_names) if author_names else "Unknown Author"

        # Extract Pages
        total_pages = int(book_data.get("number_of_pages") or 0)

        # Extract Genre / Subject
        subjects = book_data.get("subjects", [])
        genre = "General"
        if subjects and isinstance(subjects, list):
            # Pick first clean subject
            first_subject = subjects[0]
            if isinstance(first_subject, dict):
                genre = first_subject.get("name", "General")
            elif isinstance(first_subject, str):
                genre = first_subject

        # Extract High-Resolution Cover Image URL
        cover_dict = book_data.get("cover", {})
        cover_url: Optional[str] = None
        if isinstance(cover_dict, dict):
            cover_url = cover_dict.get("large") or cover_dict.get("medium") or cover_dict.get("small")

        # Fallback to Open Library direct cover CDN
        if not cover_url:
            cover_url = f"https://covers.openlibrary.org/b/isbn/{clean_isbn}-L.jpg"

        # Extract Publish Year
        publish_date = book_data.get("publish_date", "")

        return ISBNBookLookup(
            isbn=clean_isbn,
            title=title,
            author=author,
            genre=genre,
            total_pages=total_pages,
            cover_image_url=cover_url,
            publish_year=str(publish_date) if publish_date else None
        )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Request to Open Library API timed out. Please try again."
        )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to communicate with Open Library: {str(exc)}"
        )
