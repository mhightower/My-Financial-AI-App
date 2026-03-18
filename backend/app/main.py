# Load environment variables from .env file BEFORE importing anything else
from alembic import command
import time
from pathlib import Path

from dotenv import load_dotenv

# Load .env file from the backend directory
backend_dir = Path(__file__).parent.parent
env_file = backend_dir / ".env"
load_dotenv(env_file)

from alembic.config import Config  # noqa: E402
from fastapi import FastAPI, Request  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.responses import JSONResponse  # noqa: E402
from pydantic import BaseModel  # noqa: E402

from app.logger import logger  # noqa: E402
from app.routers import ai, holdings, sell_transactions, stocks, users, watchlists  # noqa: E402

# Run Alembic migrations on startup
_alembic_cfg = Config(str(backend_dir / "alembic.ini"))
_alembic_cfg.set_main_option("script_location", str(backend_dir / "alembic"))
command.upgrade(_alembic_cfg, "head")
logger.info("Database migrations applied")

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


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    """Log every request with method, path, status code, and duration."""
    start_time = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start_time) * 1000
    logger.info(
        "{method} {path} {status_code} {duration_ms:.2f}ms",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        duration_ms=duration_ms,
    )
    return response


# Register routers
app.include_router(users.router)
app.include_router(watchlists.router)
app.include_router(holdings.router)
app.include_router(stocks.router)
app.include_router(sell_transactions.router)
app.include_router(ai.router)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error for {} {}", request.method, request.url)
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
