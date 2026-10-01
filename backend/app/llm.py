"""Generates SQL from a natural-language question using an LLM, grounded
strictly in the obt_orders schema. The LLM is instructed to refuse rather
than guess when a question cannot be answered from the available columns."""
import os
import json
import re

from dotenv import load_dotenv
from openai import OpenAI

from .schema_context import load_obt_schema_context

load_dotenv()

MODEL = "gpt-4o-mini"

SYSTEM_PROMPT_TEMPLATE = """\
You are a SQL assistant for an e-commerce analytics database running on DuckDB.

You may only query the table `obt_orders`, described below.

{schema_context}

Rules:
- Only generate a single SELECT statement. Never generate INSERT, UPDATE, \
DELETE, DROP, ALTER, or any other statement type.
- Only reference the `obt_orders` table and the columns listed above. Never \
invent columns.
- If the question cannot be answered using only the columns available in \
obt_orders (for example, it asks about data that isn't present, like cost, \
profit margin, or supplier information), do not guess or approximate. \
Instead, respond with exactly:
  CANNOT_ANSWER: <brief reason, e.g. which data is missing>
- Do not use CANNOT_ANSWER merely because a requested date or year may have no
  rows. Generate valid SQL and let the database determine whether it returns
  data.
- When counting orders, never use COUNT(*) directly on obt_orders. Use \
COUNT(DISTINCT order_id) or SUM of the is_first_item_in_order flag, since \
the table is at order-item grain.
- Date rules:
  - `order_date` is the only date column to use for analytics. Treat every
    year, month, date, period, time trend, or date-range reference as a
    reference to `order_date`, including phrases such as "for the year 2026",
    "in 2025", and "last year".
  - For a specific year YYYY, filter from DATE 'YYYY-01-01' inclusive to
    DATE 'YYYY+1-01-01' exclusive, replacing YYYY+1 with the next calendar year.
  - For year-over-year analysis, use EXTRACT(YEAR FROM order_date).
  - Do not claim that a year has no data before executing the query.
- Return only the raw SQL (or the CANNOT_ANSWER line) with no markdown code \
fences and no explanation.
"""


def _client() -> OpenAI:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set. Add it to your .env file.")
    # Bound every call so a slow/hung provider request can't stall the
    # request indefinitely, and retry transient failures once.
    return OpenAI(api_key=api_key, timeout=20.0, max_retries=1)


def generate_sql(question: str) -> str:
    """Return either a raw SQL SELECT string, or a 'CANNOT_ANSWER: ...' string."""
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        schema_context=load_obt_schema_context()
    )

    response = _client().chat.completions.create(
        model=MODEL,
        temperature=0,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question},
        ],
    )

    content = response.choices[0].message.content
    if not content:
        return "CANNOT_ANSWER: The model returned an empty response."
    return content.strip()


def generate_natural_language_answer(
    question: str, sql: str, rows: list[dict]
) -> tuple[str, str, str]:
    """Explain verified results and recommend a safe presentation mode."""
    prompt = f"""You are an analytics answer writer.
Answer the user's question using only the verified SQL result below.
Return a JSON object with exactly these keys:
{{"answer": "concise Markdown answer", "preferred_view": "summary", "visualization": "kpi"}}
Use `summary` for a single metric or direct fact and `kpi` visualization for
one or more aggregate metrics. Use `table` for detailed row-level results.
Use `chart` visualization for grouped or time-series results, including
breakdowns, trends, rankings, and comparisons. If visualization is `chart`,
preferred_view must also be `chart`; the client must not present it as a raw
table by default. If the question explicitly asks for a chart, graph, plot,
or trend/visualization (e.g. "show a chart of...", "plot...", "graph..."),
you must use `chart` whenever the result has two or more rows with a
plottable numeric value; only fall back to `kpi`/`table` if the result
genuinely cannot be charted (a single row, or no numeric column at all).
The answer should still be a concise Markdown explanation.
For a single metric, state the metric, value, and relevant time period naturally.
Use **bold** for the key answer. If there are no rows, clearly say that no
matching records were found. Never invent, estimate, or recompute values.

Question: {question}
SQL: {sql}
Result rows (first 50 rows): {json.dumps(rows[:50], default=str)}
"""
    response = _client().chat.completions.create(
        model=MODEL,
        temperature=0,
        response_format={"type": "json_object"},
        messages=[{"role": "user", "content": prompt}],
    )
    raw = response.choices[0].message.content.strip()
    try:
        # Be defensive if a provider wraps otherwise-valid JSON in Markdown.
        json_text = raw
        if json_text.startswith("```"):
            json_text = json_text.removeprefix("```json").removeprefix("```")
            json_text = json_text.removesuffix("```").strip()
        result = json.loads(json_text)
        answer = str(result["answer"]).strip()
        if not answer:
            raise ValueError("The answer was empty")
        preferred_view = result.get("preferred_view", "summary")
        visualization = result.get("visualization", "kpi")
        if visualization not in {"kpi", "chart", "table"}:
            visualization = "kpi"
        if visualization == "chart":
            preferred_view = "chart"
        elif preferred_view not in {"summary", "table"}:
            preferred_view = "summary"
        visualization, preferred_view = _resolve_presentation(question, rows, visualization, preferred_view)
        return answer, preferred_view, visualization
    except (ValueError, KeyError, TypeError, json.JSONDecodeError):
        visualization, preferred_view = _resolve_presentation(question, rows, "kpi", "summary")
        return _fallback_answer(rows), preferred_view, visualization


_CHART_REQUEST_PATTERN = re.compile(r"\b(chart|graph|plot|visuali[sz]e|visuali[sz]ation|trend line)\b", re.IGNORECASE)


def _resolve_presentation(
    question: str, rows: list[dict], visualization: str, preferred_view: str
) -> tuple[str, str]:
    """Correct the model's suggested presentation against the actual result
    shape. A KPI card can only ever represent a single row; a multi-row
    result mislabeled as `kpi` would otherwise silently render just the
    first row and misrepresent the full answer (e.g. a 'top 5' ranking
    collapsing to a card for only the first item)."""
    columns = list(rows[0].keys()) if rows else []
    has_numeric_column = any(
        isinstance(rows[0][col], (int, float)) and not isinstance(rows[0][col], bool)
        for col in columns
    )
    is_plottable = len(rows) >= 2 and len(columns) >= 2 and has_numeric_column and len(rows) <= 50

    # The user explicitly asked for a chart/graph/plot: honor that whenever
    # the data can actually be plotted, regardless of what the model chose.
    if _CHART_REQUEST_PATTERN.search(question) and is_plottable:
        return "chart", "chart"

    if len(rows) <= 1 or visualization != "kpi":
        return visualization, preferred_view
    if is_plottable:
        return "chart", "chart"
    return "table", "table"


def _fallback_answer(rows: list[dict]) -> str:
    """Guarantee a useful answer even if the explanation call fails."""
    if not rows:
        return "**No matching records were found.**"
    if len(rows) == 1:
        values = list(rows[0].items())
        details = ", ".join(f"**{key}:** {value}" for key, value in values)
        return f"The query returned **1 result**: {details}."
    return f"The query returned **{len(rows):,} results**. See the table view for the details."
