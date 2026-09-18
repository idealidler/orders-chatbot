"""Extracts obt_orders schema + descriptions from dbt's manifest.json,
so the LLM prompt reflects the single source of truth (dbt docs)."""
import json
from pathlib import Path

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

    return "\n".join(lines)
