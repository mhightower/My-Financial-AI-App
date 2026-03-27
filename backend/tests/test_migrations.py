"""Tests for Alembic migrations.

Verifies that the initial migration creates the expected schema
and that upgrade/downgrade work correctly.
"""
import os
import tempfile

import pytest
from alembic.config import Config
from sqlalchemy import create_engine, inspect, text

from alembic import command


def get_alembic_config(db_url: str) -> Config:
    """Create Alembic config pointing to a specific database URL."""
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    alembic_cfg = Config(os.path.join(backend_dir, "alembic.ini"))
    alembic_cfg.set_main_option("sqlalchemy.url", db_url)
    alembic_cfg.set_main_option(
        "script_location", os.path.join(backend_dir, "alembic")
    )
    return alembic_cfg


@pytest.fixture
def migration_db():
    """Create a temporary SQLite database for migration testing."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name
    db_url = f"sqlite:///{db_path}"
    yield db_url
    # Cleanup
    if os.path.exists(db_path):
        os.unlink(db_path)


def test_upgrade_creates_all_tables(migration_db):
    """Migration upgrade head should create all expected tables."""
    cfg = get_alembic_config(migration_db)
    command.upgrade(cfg, "head")

    engine = create_engine(migration_db)
    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    expected_tables = {
        "users",
        "watchlists",
        "stocks_in_watchlist",
        "brokerage_accounts",
        "holdings",
        "sell_transactions",
        "alembic_version",
    }
    assert expected_tables.issubset(set(table_names)), (
        f"Missing tables: {expected_tables - set(table_names)}"
    )
    engine.dispose()


def test_upgrade_creates_users_table_with_correct_columns(migration_db):
    """Migration should create users table with the correct columns."""
    cfg = get_alembic_config(migration_db)
    command.upgrade(cfg, "head")

    engine = create_engine(migration_db)
    inspector = inspect(engine)
    columns = {col["name"] for col in inspector.get_columns("users")}

    assert columns == {"id", "name", "avatar_color", "created_at"}
    engine.dispose()


def test_upgrade_creates_watchlists_table_with_correct_columns(migration_db):
    """Migration should create watchlists table with the correct columns."""
    cfg = get_alembic_config(migration_db)
    command.upgrade(cfg, "head")

    engine = create_engine(migration_db)
    inspector = inspect(engine)
    columns = {col["name"] for col in inspector.get_columns("watchlists")}

    assert columns == {"id", "name", "description", "owner_user_id", "created_date"}
    engine.dispose()


def test_upgrade_creates_stocks_in_watchlist_table_with_correct_columns(migration_db):
    """Migration should create stocks_in_watchlist table with the correct columns."""
    cfg = get_alembic_config(migration_db)
    command.upgrade(cfg, "head")

    engine = create_engine(migration_db)
    inspector = inspect(engine)
    columns = {col["name"] for col in inspector.get_columns("stocks_in_watchlist")}

    expected_columns = {
        "id",
        "watchlist_id",
        "ticker",
        "buy_reasons",
        "sell_conditions",
        "buy_price",
        "sell_price",
        "stop_loss_pct",
        "added_date",
    }
    assert columns == expected_columns
    engine.dispose()


def test_upgrade_creates_holdings_table_with_correct_columns(migration_db):
    """Migration should create holdings table with the correct columns."""
    cfg = get_alembic_config(migration_db)
    command.upgrade(cfg, "head")

    engine = create_engine(migration_db)
    inspector = inspect(engine)
    columns = {col["name"] for col in inspector.get_columns("holdings")}

    expected_columns = {
        "id",
        "user_id",
        "account_id",
        "ticker",
        "quantity",
        "entry_price",
        "entry_date",
        "notes",
    }
    assert columns == expected_columns
    engine.dispose()


def test_upgrade_creates_sell_transactions_table_with_correct_columns(migration_db):
    """Migration should create sell_transactions table with the correct columns."""
    cfg = get_alembic_config(migration_db)
    command.upgrade(cfg, "head")

    engine = create_engine(migration_db)
    inspector = inspect(engine)
    columns = {col["name"] for col in inspector.get_columns("sell_transactions")}

    expected_columns = {
        "id",
        "user_id",
        "account_id",
        "ticker",
        "shares_sold",
        "price_received",
        "sell_date",
        "notes",
        "created_at",
    }
    assert columns == expected_columns
    engine.dispose()


def test_migration_version_recorded(migration_db):
    """After upgrade, the migration version should be recorded in alembic_version."""
    cfg = get_alembic_config(migration_db)
    command.upgrade(cfg, "head")

    engine = create_engine(migration_db)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version_num FROM alembic_version"))
        versions = [row[0] for row in result]

    assert len(versions) == 1, "Expected exactly one version recorded"
    engine.dispose()


def test_downgrade_removes_all_tables(migration_db):
    """Migration downgrade to base should remove all non-system tables."""
    cfg = get_alembic_config(migration_db)
    command.upgrade(cfg, "head")
    command.downgrade(cfg, "base")

    engine = create_engine(migration_db)
    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    # After full downgrade, no app tables should exist
    app_tables = {
        "users",
        "watchlists",
        "stocks_in_watchlist",
        "brokerage_accounts",
        "holdings",
        "sell_transactions",
    }
    remaining = app_tables.intersection(set(table_names))
    assert not remaining, f"Tables still exist after downgrade: {remaining}"
    engine.dispose()


def test_upgrade_is_idempotent(migration_db):
    """Running upgrade head twice should not fail."""
    cfg = get_alembic_config(migration_db)
    command.upgrade(cfg, "head")
    # Running again should be a no-op, not raise
    command.upgrade(cfg, "head")

    engine = create_engine(migration_db)
    inspector = inspect(engine)
    assert "users" in inspector.get_table_names()
    engine.dispose()


def test_stocks_in_watchlist_unique_constraint(migration_db):
    """The stocks_in_watchlist table should enforce unique (watchlist_id, ticker)."""
    from datetime import datetime, timezone

    cfg = get_alembic_config(migration_db)
    command.upgrade(cfg, "head")

    engine = create_engine(migration_db)
    with engine.connect() as conn:
        # Insert a user, watchlist, then two stocks with same ticker in same watchlist
        conn.execute(
            text(
                "INSERT INTO users (name, created_at) VALUES ('testuser', :now)"
            ),
            {"now": datetime.now(timezone.utc)},
        )
        conn.execute(
            text(
                "INSERT INTO watchlists (name, owner_user_id, created_date) "
                "VALUES ('My Watchlist', 1, :now)"
            ),
            {"now": datetime.now(timezone.utc)},
        )
        conn.execute(
            text(
                "INSERT INTO stocks_in_watchlist (watchlist_id, ticker, added_date) "
                "VALUES (1, 'AAPL', :now)"
            ),
            {"now": datetime.now(timezone.utc)},
        )
        conn.commit()

        # Second insert with same watchlist_id + ticker should raise
        with pytest.raises(Exception):
            conn.execute(
                text(
                    "INSERT INTO stocks_in_watchlist (watchlist_id, ticker, added_date) "
                    "VALUES (1, 'AAPL', :now)"
                ),
                {"now": datetime.now(timezone.utc)},
            )
            conn.commit()

    engine.dispose()
