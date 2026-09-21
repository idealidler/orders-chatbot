"""Generates SQL from a natural-language question using an LLM, grounded
strictly in the obt_orders schema. The LLM is instructed to refuse rather
than guess when a question cannot be answered from the available columns."""
import os
import json

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
    return OpenAI(api_key=api_key)


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

    return response.choices[0].message.content.strip()


def generate_natural_language_answer(
    question: str, sql: str, rows: list[dict]
) -> tuple[str, str]:
    """Explain verified results and recommend summary or table presentation."""
    prompt = f"""You are an analytics answer writer.
Answer the user's question using only the verified SQL result below.
Return a JSON object with exactly these keys:
{{"answer": "concise Markdown answer", "preferred_view": "summary"}}
Use `summary` for a single metric or direct fact. Use `table` for rankings,
breakdowns, lists, comparisons, or multiple rows where the table is the clearest
primary answer. The answer should still be a concise Markdown explanation.
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
        messages=[{"role": "user", "content": prompt}],
    )
    raw = response.choices[0].message.content.strip()
    try:
        result = json.loads(raw)
        answer = str(result["answer"]).strip()
        preferred_view = result.get("preferred_view", "summary")
        if preferred_view not in {"summary", "table"}:
            preferred_view = "summary"
        return answer, preferred_view
    except (ValueError, KeyError, TypeError):
        # Preserve a useful answer if a model response is not valid JSON.
        return raw, "summary"
