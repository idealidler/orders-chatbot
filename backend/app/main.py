"""FastAPI backend: natural-language question -> LLM SQL -> validated,
read-only execution against obt_orders -> JSON response for the frontend."""
import logging
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .db import run_query
from .llm import generate_natural_language_answer, generate_sql
from .sql_guard import UnsafeSQLError, validate_select_only

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Orders Chatbot API")

# Comma-separated list of allowed frontend origins, e.g.
# "http://localhost:5173,https://orders-chatbot.vercel.app"
_default_origins = "http://localhost:5173"
allowed_origins = [
    origin.strip()
    for origin in os.environ.get("CORS_ORIGINS", _default_origins).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["POST"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


class QuestionRequest(BaseModel):
    question: str


@app.post("/query")
def query(request: QuestionRequest):
    llm_output = generate_sql(request.question)

    if llm_output.startswith("CANNOT_ANSWER"):
        reason = llm_output.split(":", 1)[1].strip() if ":" in llm_output else ""
        return {"status": "cannot_answer", "reason": reason}

    try:
        safe_sql = validate_select_only(llm_output)
        rows = run_query(safe_sql)
    except UnsafeSQLError:
        logger.warning("Blocked unsafe SQL from LLM: %s", llm_output)
        raise HTTPException(
            status_code=500,
            detail="Something went wrong generating a safe query. Please try rephrasing your question.",
        )
    except Exception:
        logger.exception("Unexpected error executing query")
        raise HTTPException(
            status_code=500,
            detail="Something went wrong running your query. Please try again.",
        )

    try:
        answer, preferred_view, visualization = generate_natural_language_answer(
            request.question, safe_sql, rows
        )
    except Exception:
        logger.exception("Unable to generate natural-language answer")
        answer = "The query completed successfully. See the table view for the results."
        preferred_view = "table"
        visualization = "table"
    return {
        "status": "ok",
        "answer": answer,
        "preferred_view": preferred_view,
        "visualization": visualization,
        "sql": safe_sql,
        "rows": rows,
    }
