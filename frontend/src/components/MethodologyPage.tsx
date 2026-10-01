function Step({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
        {number}
      </span>
      <div>
        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{title}</p>
        <div className="mt-1 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{children}</div>
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700 dark:bg-stone-800 dark:text-stone-200">
      {children}
    </span>
  );
}

export function MethodologyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-10 sm:px-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">How it's built</p>
        <h2 className="font-display mt-1.5 text-2xl font-semibold tracking-tight text-stone-950 dark:text-white">
          A dbt-modeled warehouse, grounding an LLM text-to-SQL pipeline
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
          This project pairs two skill sets: <strong className="font-semibold text-stone-800 dark:text-stone-100">analytics
          engineering with dbt</strong> to build a clean, tested, well-documented data model, and{" "}
          <strong className="font-semibold text-stone-800 dark:text-stone-100">applied LLM engineering</strong> to turn that
          model into a chatbot that generates its own SQL — safely. Below is a plain-language walkthrough of the pipeline,
          end to end.
        </p>
      </section>

      <section className="space-y-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500">
          1. The data layer — dbt + DuckDB
        </h3>
        <Step number="1" title="Raw data lands as dbt seeds">
          Raw customer, order, and order-item CSVs are loaded as dbt seeds — the starting point for the pipeline, version
          controlled alongside the rest of the project.
        </Step>
        <Step number="2" title="Staging models normalize each source">
          Three staging models (<code>stg_customers</code>, <code>stg_orders</code>, <code>stg_order_items</code>) apply a
          consistent 1:1 layer over the raw seeds, each with its own surrogate key. dbt data tests enforce{" "}
          <code>unique</code>, <code>not_null</code>, and <code>relationships</code> constraints, so a broken foreign key
          or duplicate row fails the build instead of reaching the chatbot.
        </Step>
        <Step number="3" title="A single mart: the One-Big-Table (OBT)">
          The staging models are joined into <code>obt_orders</code>, a denormalized mart at order-item grain. This is a
          deliberate modeling choice: one wide, well-documented table is far easier for an LLM to query correctly than
          several normalized tables it would have to join itself. The model is documented and tested column-by-column in
          dbt's schema files.
        </Step>
        <Step number="4" title="dbt docs become the LLM's schema context">
          Rather than hand-maintaining a schema description for the prompt, the backend reads column names and
          descriptions directly out of dbt's generated <code>manifest.json</code>. The dbt docs <em>are</em> the single
          source of truth — if a column's description changes in dbt, the chatbot's grounding updates automatically on
          the next deploy.
        </Step>
      </section>

      <section className="space-y-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500">
          2. The reasoning layer — LLM text-to-SQL
        </h3>
        <Step number="1" title="Question → SQL">
          Each question is sent to an OpenAI model (<code>gpt-4o-mini</code>, temperature 0 for consistency) along with a
          system prompt built from the dbt schema context above. The model is explicitly instructed to query only{" "}
          <code>obt_orders</code>, to only ever write a single <code>SELECT</code>, and to answer{" "}
          <code>CANNOT_ANSWER</code> rather than guess when a question needs data the table doesn't have (e.g. cost or
          supplier data).
        </Step>
        <Step number="2" title="Grain-aware prompting">
          Because <code>obt_orders</code> is at order-item grain, naively counting rows would overcount orders. The
          prompt teaches the model this explicitly — to count distinct orders using{" "}
          <code>COUNT(DISTINCT order_id)</code> rather than <code>COUNT(*)</code> — and gives it concrete date-range
          rules for year and year-over-year questions, so trend questions are built consistently rather than
          reinvented per query.
        </Step>
        <Step number="3" title="SQL is verified, never trusted">
          Generated SQL is parsed with a SQL parser (sqlglot) and allow-listed: it must resolve to exactly one{" "}
          <code>SELECT</code> statement, or it's rejected outright. It then runs against a{" "}
          <strong className="font-semibold text-stone-800 dark:text-stone-100">read-only</strong> DuckDB connection, so
          even a malformed or adversarial query has no path to modify data — the guarantee is structural, not just a
          string check.
        </Step>
        <Step number="4" title="Results → natural-language answer">
          The verified query results (never the model's own assumptions) are sent back to the LLM in a second call,
          which writes a concise, cited answer and proposes how to present it — as a single-value summary, a
          ranked/trend chart, or a detailed table.
        </Step>
        <Step number="5" title="Presentation is double-checked deterministically">
          Model-suggested presentation is treated as a suggestion, not a guarantee. A single-value "KPI" card is only
          ever shown for a true single-row result; a multi-row ranking or comparison is automatically corrected to a
          chart or table based on the real shape of the data, so the UI can't misrepresent a 5-row ranking as a single
          number.
        </Step>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500">Stack</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pill>dbt-duckdb</Pill>
          <Pill>DuckDB</Pill>
          <Pill>FastAPI</Pill>
          <Pill>OpenAI API (gpt-4o-mini)</Pill>
          <Pill>sqlglot</Pill>
          <Pill>React + Vite + TypeScript</Pill>
          <Pill>Tailwind CSS</Pill>
          <Pill>Render</Pill>
          <Pill>Vercel</Pill>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500">Design principles</h3>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
          <li>
            <strong className="font-semibold text-stone-800 dark:text-stone-100">Ground everything in the warehouse.</strong>{" "}
            The model only ever sees the schema dbt actually produced, and only ever answers from rows DuckDB actually
            returned — it never fabricates figures.
          </li>
          <li>
            <strong className="font-semibold text-stone-800 dark:text-stone-100">Fail safely, not silently.</strong> SQL
            that doesn't parse as a single read-only query is rejected before it ever reaches the database.
          </li>
          <li>
            <strong className="font-semibold text-stone-800 dark:text-stone-100">Don't fully trust the model's UI judgment.</strong>{" "}
            Code, not the LLM, has the final say on how a result is visualized, because it can check the actual data shape.
          </li>
        </ul>
      </section>
    </div>
  );
}
