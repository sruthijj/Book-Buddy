"""
Catalog Search API Route leveraging Open Library.
Allows readers to search and auto-populate books by title, author, or keywords
without requiring an ISBN barcode.
"""

from fastapi import APIRouter, Query, HTTPException, status
from ..schemas import CatalogSearchResponse
from ..openlibrary import search_open_library_catalog

router = APIRouter(prefix="/api/catalog", tags=["Book Catalog"])


@router.get("/search", response_model=CatalogSearchResponse)
async def search_catalog(
    q: str = Query(..., min_length=2, description="Search query: book title, author, or keyword"),
    limit: int = Query(8, ge=1, le=20, description="Max results to return")
):
    """
    Searches Open Library's public catalog for books matching the provided query.
    Normalizes metadata, attaches cover artwork thumbnails, estimates median page counts,
    and maps raw subjects to Book Buddy's canonical genres.
    """
    clean_q = q.strip()
    if len(clean_q) < 2:
        return CatalogSearchResponse(results=[], query=clean_q, total_found=0)

    try:
        results = await search_open_library_catalog(clean_q, limit=limit)
        return CatalogSearchResponse(
            results=results,
            query=clean_q,
            total_found=len(results)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Unable to reach Open Library catalog: {str(exc)}"
        )
