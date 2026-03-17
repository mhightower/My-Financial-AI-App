"""Structured logging configuration using loguru."""
import os
import sys

from loguru import logger

# Log format: time | level | message (structured)
LOG_FORMAT = "{time:YYYY-MM-DD HH:mm:ss.SSS} | {level} | {name}:{function}:{line} | {message}"


def get_log_level() -> str:
    """Return the configured log level (default INFO)."""
    return os.environ.get("LOG_LEVEL", "INFO").upper()


def configure_logger() -> None:
    """Configure loguru with structured format and correct log level."""
    logger.remove()  # Remove default handler
    logger.add(
        sys.stderr,
        format=LOG_FORMAT,
        level=get_log_level(),
        colorize=True,
        backtrace=True,
        diagnose=True,
    )


# Configure on import
configure_logger()

__all__ = ["logger", "LOG_FORMAT", "get_log_level", "configure_logger"]
