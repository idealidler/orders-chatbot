"""Read-only DuckDB access for executing validated, LLM-generated SELECT
queries. Opening the connection with read_only=True enforces at the
storage-engine level that no write ever succeeds here, regardless of
what SQL text is passed in — a structural guarantee, not just a check
in application code."""
from pathlib import Path

import duckdb

DB_PATH = Path(__file__).resolve().parents[2] / "orders_chatbot.duckdb"

# Cap rows returned to the LLM/UI to avoid huge payloads from a broad query.
MAX_ROWS = 1000


def run_query(sql: str) -> list[dict]:
    """Execute a pre-validated read-only SQL query and return rows as dicts."""
    con = duckdb.connect(str(DB_PATH), read_only=True)
    try:
        result = con.execute(sql)
        columns = [desc[0] for desc in result.description]
        rows = result.fetchmany(MAX_ROWS)
        return [dict(zip(columns, row)) for row in rows]
    finally:
        con.close()
