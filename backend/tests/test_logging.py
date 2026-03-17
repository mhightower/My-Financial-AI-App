"""Tests for structured logging with loguru."""
import sys
from io import StringIO

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client(db):
    """Create test client with overridden database dependency."""
    from app.database import get_db

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def captured_logs():
    """Capture loguru log output via a string sink."""
    from app.logger import logger
    output = StringIO()
    handler_id = logger.add(output, format="{level} | {message}", level="DEBUG")
    yield output
    logger.remove(handler_id)


class TestLoggerConfiguration:
    """Tests that loguru logger is configured at startup."""

    def test_loguru_is_importable(self):
        """loguru should be installed as a dependency."""
        import loguru  # noqa: F401

    def test_logger_module_exists(self):
        """app.logger module should exist."""
        import app.logger as app_logger  # noqa: F401

    def test_logger_is_configured(self):
        """Logger should be a loguru logger instance."""
        from loguru import logger as loguru_logger
        from app.logger import logger
        # The logger from app.logger should be loguru's logger
        assert logger is loguru_logger

    def test_default_log_level_is_info(self):
        """Default log level should be INFO."""
        from app.logger import get_log_level
        assert get_log_level() == "INFO"

    def test_log_level_configurable_via_env(self, monkeypatch):
        """Log level should be configurable via LOG_LEVEL environment variable."""
        monkeypatch.setenv("LOG_LEVEL", "DEBUG")
        from app.logger import get_log_level
        # Re-import to pick up the env var
        import importlib
        import app.logger
        importlib.reload(app.logger)
        from app.logger import get_log_level as get_log_level_reloaded
        assert get_log_level_reloaded() == "DEBUG"
        # Reset
        monkeypatch.delenv("LOG_LEVEL", raising=False)
        importlib.reload(app.logger)

    def test_log_format_contains_time(self):
        """Log format should include time component."""
        from app.logger import LOG_FORMAT
        assert "{time" in LOG_FORMAT

    def test_log_format_contains_level(self):
        """Log format should include level component."""
        from app.logger import LOG_FORMAT
        assert "{level}" in LOG_FORMAT

    def test_log_format_contains_message(self):
        """Log format should include message component."""
        from app.logger import LOG_FORMAT
        assert "{message}" in LOG_FORMAT


class TestRequestLoggingMiddleware:
    """Tests that requests are logged with method, path, status code, duration."""

    def test_request_is_logged(self, client, captured_logs):
        """Every request should produce a log entry."""
        client.get("/health")
        output = captured_logs.getvalue()
        assert len(output) > 0

    def test_request_log_contains_method(self, client, captured_logs):
        """Request log should include HTTP method."""
        client.get("/health")
        output = captured_logs.getvalue()
        assert "GET" in output

    def test_request_log_contains_path(self, client, captured_logs):
        """Request log should include request path."""
        client.get("/health")
        output = captured_logs.getvalue()
        assert "/health" in output

    def test_request_log_contains_status_code(self, client, captured_logs):
        """Request log should include response status code."""
        client.get("/health")
        output = captured_logs.getvalue()
        assert "200" in output

    def test_request_log_contains_duration(self, client, captured_logs):
        """Request log should include request duration in ms."""
        client.get("/health")
        output = captured_logs.getvalue()
        # duration should be present (look for 'ms' or 'duration')
        assert "ms" in output or "duration" in output

    def test_middleware_is_registered(self):
        """Logging middleware should be registered on the app."""
        from app.main import app
        middleware_types = [type(m).__name__ for m in app.user_middleware]
        # Check for our custom middleware or @app.middleware("http") decorated ones
        # @app.middleware routes appear as BaseHTTPMiddleware in user_middleware
        # We verify the middleware exists by checking the source instead
        import inspect
        import app.main as main_module
        source = inspect.getsource(main_module)
        assert 'middleware("http")' in source or "RequestLoggingMiddleware" in source


class TestErrorLogging:
    """Tests that errors are logged at ERROR level with exception info."""

    def test_exception_logged_at_error_level(self):
        """Unhandled exceptions should be logged at ERROR level."""
        import inspect
        import app.main as main_module
        source = inspect.getsource(main_module.unhandled_exception_handler)
        assert "logger.exception" in source or "logger.error" in source

    def test_exception_handler_uses_loguru_logger(self):
        """The exception handler should use the loguru logger, not stdlib logging."""
        import inspect
        import app.main as main_module

        source = inspect.getsource(main_module)
        # Should import from app.logger, not use stdlib logging
        assert "from app.logger import logger" in source or "from app import logger" in source

    def test_no_print_statements_in_main(self):
        """main.py should have no raw print() statements."""
        import inspect
        import app.main as main_module
        source = inspect.getsource(main_module)
        # Simple check: no standalone print( calls
        lines = source.splitlines()
        for line in lines:
            stripped = line.strip()
            assert not stripped.startswith("print("), (
                f"Found print statement in main.py: {stripped}"
            )
