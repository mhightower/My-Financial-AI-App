import warnings
from datetime import datetime, timezone

from sqlalchemy import create_engine, text
from sqlalchemy.pool import StaticPool


def test_text_query_datetime_param_no_deprecation_warning():
    """Raw text() queries with datetime params must not trigger Python 3.12 deprecation.

    Regression guard: pass ISO-formatted strings, not raw datetime objects,
    when binding params in text() queries — the deprecated sqlite3 default
    adapter is invoked otherwise.
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    with warnings.catch_warnings():
        warnings.simplefilter("error", DeprecationWarning)
        with engine.connect() as conn:
            conn.execute(text("CREATE TABLE t (ts TEXT)"))
            now = datetime.now(timezone.utc).isoformat()
            conn.execute(text("INSERT INTO t VALUES (:ts)"), {"ts": now})
            conn.commit()
    engine.dispose()
