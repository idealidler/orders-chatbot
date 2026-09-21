# Orders Chatbot — Text-to-SQL Analytics Engine

A portfolio project building a Text-to-SQL chatbot for e-commerce analytics.

## Goal

Transform raw e-commerce CSV data into a denormalized One-Big-Table (OBT),
optimized for an LLM to query for business KPIs, using a dbt + DuckDB pipeline.

## Stack

- **dbt-duckdb** — transformation layer, running locally against DuckDB
- **DuckDB** — local analytical database
- **FastAPI** — backend API: LLM text-to-SQL, SQL safety validation, read-only query execution
- **OpenAI API** — natural language to SQL generation
- **React + Vite + TypeScript + Tailwind** — chat frontend

## Project structure

```text
orders-chatbot/
├── orders_chatbot/        # dbt project
│   ├── models/
│   │   ├── staging/       # 1:1 staging models over raw seeds
│   │   └── marts/         # obt_orders: denormalized OBT for LLM queries
│   ├── seeds/              # raw CSV source data
│   └── dbt_project.yml
├── backend/               # FastAPI app: LLM SQL generation + safe execution
├── frontend/              # React + Vite + TypeScript + Tailwind chat UI
└── README.md
```

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cd orders_chatbot
dbt deps
dbt seed
dbt run
```

Copy `.env.example` to `.env` at the repo root and add your `OPENAI_API_KEY`.

Run the backend:

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Run the frontend:

```bash
cd frontend
npm install
npm run dev
```

## Deploying

Deploy `frontend` as a Vercel project and set this build-time environment variable:

```text
VITE_API_BASE=https://<your-render-service>.onrender.com
```

In Render, set `OPENAI_API_KEY` and set `CORS_ORIGINS` to the exact Vercel URL,
for example `https://<your-project>.vercel.app` (include additional comma-separated
origins if you use a custom domain). Redeploy both services after changing these
variables. Verify the backend at `https://<your-render-service>.onrender.com/health`.

## Status

- [x] Environment setup (dbt-duckdb + DuckDB)
- [x] Staging models: `stg_customers`, `stg_orders`, `stg_order_items`
- [x] Staging schema tests (unique, not_null, relationships)
- [x] Intermediate / mart layer (OBT): `obt_orders`, tested and documented
- [x] FastAPI backend: LLM text-to-SQL with SQL safety allowlist, read-only DuckDB execution
- [x] React + Vite + TypeScript + Tailwind chat frontend
