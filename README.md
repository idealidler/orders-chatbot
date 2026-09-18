# Orders Chatbot — Text-to-SQL Analytics Engine

A portfolio project building a Text-to-SQL chatbot for e-commerce analytics.

## Goal

Transform raw e-commerce CSV data into a denormalized One-Big-Table (OBT),
optimized for an LLM to query for business KPIs, using a dbt + DuckDB pipeline.

## Stack

- **dbt-duckdb** — transformation layer, running locally against DuckDB
- **DuckDB** — local analytical database

## Project structure

```text
orders-chatbot/
├── orders_chatbot/        # dbt project
│   ├── models/
│   │   └── staging/       # 1:1 staging models over raw seeds
│   ├── seeds/              # raw CSV source data
│   └── dbt_project.yml
└── README.md
```

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install dbt-duckdb
cd orders_chatbot
dbt deps
dbt seed
dbt run
```

## Status

- [x] Environment setup (dbt-duckdb + DuckDB)
- [x] Staging models: `stg_customers`, `stg_orders`, `stg_order_items`
- [ ] Staging schema tests
- [ ] Intermediate / mart layer (OBT)
- [ ] LLM query interface
