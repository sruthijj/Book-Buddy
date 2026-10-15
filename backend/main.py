"""
Book Buddy FastAPI Application Entrypoint.
Configures CORS, lifespan events, database initialization, and route registrations.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from dotenv import load_dotenv
load_dotenv()

from .database import engine, Base
from .routes import auth, books, stats, isbn, ai


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

# Senior Developer Best Practice: Configure CORS so the React frontend can communicate seamlessly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
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


@app.get("/", tags=["Health"])
def root():
    """Root health-check endpoint."""
    return {
        "status": "online",
        "app": "Book Buddy API",
        "docs_url": "/docs",
        "version": "1.0.0"
    }
