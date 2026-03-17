# Load environment variables from .env file BEFORE importing anything else
import logging
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from the backend directory
backend_dir = Path(__file__).parent.parent
env_file = backend_dir / ".env"
load_dotenv(env_file)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from app.database import engine, Base
from app.routers import users, watchlists, holdings, stocks, sell_transactions, ai

logger = logging.getLogger(__name__)

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Financial App API",
    description="Backend API for the financial application",
    version="0.1.0"
)

# Enable CORS for Vue frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(users.router)
app.include_router(watchlists.router)
app.include_router(holdings.router)
app.include_router(stocks.router)
app.include_router(sell_transactions.router)
app.include_router(ai.router)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error for %s %s", request.method, request.url)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred"}
    )


class HealthResponse(BaseModel):
    status: str
    message: str


@app.get("/health", response_model=HealthResponse)
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "Financial app backend is running"
    }


@app.get("/")
def read_root():
    """Root endpoint"""
    return {
        "message": "Welcome to the Financial App API",
        "docs": "/docs"
    }
