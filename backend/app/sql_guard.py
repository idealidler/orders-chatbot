"""Validates LLM-generated SQL before execution.

Allowlist approach: the SQL must parse as exactly one SELECT statement.
Anything else (multiple statements, DDL, DML, unparsable SQL) is rejected.
This is intentionally stricter than a keyword blocklist, which can be
bypassed by SQL phrasing the blocklist author didn't anticipate.
"""
import sqlglot
from sqlglot.expressions import Select


class UnsafeSQLError(ValueError):
    """Raised when generated SQL fails the safety allowlist check."""


def validate_select_only(sql: str) -> str:
    """Parse `sql` and return it back if it is exactly one SELECT statement.

    Raises UnsafeSQLError otherwise.
    """
    try:
        statements = sqlglot.parse(sql, read="duckdb")
    except Exception as exc:
        raise UnsafeSQLError(f"Could not parse SQL: {exc}") from exc

    # Reject empty input or multiple statements (e.g. "SELECT 1; DROP TABLE x")
    statements = [s for s in statements if s is not None]
    if len(statements) != 1:
        raise UnsafeSQLError(
            f"Expected exactly one SQL statement, found {len(statements)}."
        )

    statement = statements[0]
    if not isinstance(statement, Select):
        raise UnsafeSQLError(
            f"Only SELECT statements are allowed, got: {type(statement).__name__}"
        )

    return sql
