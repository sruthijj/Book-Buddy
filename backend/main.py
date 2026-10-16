"""
Book Buddy FastAPI Application Entrypoint.
Configures CORS, lifespan events, database initialization, and route registrations.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import os
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()

from .database import engine, Base
from .routes import auth, books, stats, isbn, ai, catalog


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager: Runs on startup and shutdown.
    Ensures database tables are initialized before handling requests.
    """
    # Create tables if they do not exist
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Book Buddy API",
    description="A full-stack reading progress tracker with JWT auth, ISBN lookup, and AI reading assistant.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS so the React frontend on local and Vercel can communicate seamlessly
frontend_env = os.getenv("FRONTEND_URL", "").strip()
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "https://book-buddy.vercel.app",
]
if frontend_env:
    allowed_origins.append(frontend_env)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://book-buddy-.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router)
app.include_router(books.router)
app.include_router(stats.router)
app.include_router(isbn.router)
app.include_router(ai.router)
app.include_router(catalog.router)


@app.get("/", tags=["Health"])
def root():
    """Root health-check endpoint."""
    return {
        "status": "online",
        "app": "Book Buddy API",
        "docs_url": "/docs",
        "version": "1.0.0"
    }


@app.get("/api/health", tags=["Health"])
def api_health():
    """
    Dedicated lightweight health-check endpoint for uptime monitors and cold-start probes.
    Returns status 200 without running heavy database transactions.
    """
    return {
        "status": "healthy",
        "app": "Book Buddy API",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": "production" if os.getenv("RENDER") else "development"
    }


@app.get("/health", tags=["Health"])
def root_health():
    """Root /health endpoint alias."""
    return api_health()
