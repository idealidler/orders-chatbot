"""Extracts obt_orders schema + descriptions from dbt's manifest.json,
so the LLM prompt reflects the single source of truth (dbt docs)."""
import json
from functools import lru_cache
from pathlib import Path

from .db import DB_PATH

MANIFEST_PATH = (
    Path(__file__).resolve().parents[2]
    / "orders_chatbot"
    / "target"
    / "manifest.json"
)

MODEL_NODE_ID = "model.orders_chatbot.obt_orders"


def load_obt_schema_context() -> str:
    """Return a formatted text block describing the obt_orders table and
    its columns, for inclusion in the LLM system prompt."""
    with open(MANIFEST_PATH) as f:
        manifest = json.load(f)

    node = manifest["nodes"][MODEL_NODE_ID]

    lines = [
        f"Table: {node['name']}",
        f"Description: {node['description']}",
        "",
        "Columns:",
    ]
    for col_name, col_meta in node["columns"].items():
        lines.append(f"- {col_name}: {col_meta['description']}")

    lines.extend(["", load_date_coverage()])
    return "\n".join(lines)


@lru_cache(maxsize=1)
def load_date_coverage() -> str:
    """Return the current order-date coverage for grounding date answers."""
    import duckdb

    try:
        con = duckdb.connect(str(DB_PATH), read_only=True)
        try:
            row = con.execute(
                "SELECT MIN(order_date), MAX(order_date) FROM obt_orders"
            ).fetchone()
        finally:
            con.close()
    except Exception:
        return "Order-date coverage: unavailable. Do not infer whether a date has data before querying."

    if not row or row[0] is None or row[1] is None:
        return "Order-date coverage: no dates available. Do not infer whether a date has data before querying."

    return f"Order-date coverage: {row[0]} through {row[1]}."
