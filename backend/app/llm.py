"""Generates SQL from a natural-language question using an LLM, grounded
strictly in the obt_orders schema. The LLM is instructed to refuse rather
than guess when a question cannot be answered from the available columns."""
import os

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
- When counting orders, never use COUNT(*) directly on obt_orders. Use \
COUNT(DISTINCT order_id) or SUM of the is_first_item_in_order flag, since \
the table is at order-item grain.
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
