import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { askQuestion, QueryError, type QueryResponse } from "./api";

type ChatMessage =
  | { role: "user"; text: string; timestamp: number }
  | { role: "assistant"; result: Extract<QueryResponse, { status: "ok" }>; view: "summary" | "table" | "chart"; question: string; timestamp: number; feedback?: "up" | "down" }
  | { role: "assistant-error"; text: string; timestamp: number };

const examples = [
  "How many total orders do we have?",
  "Revenue by year",
  "Top 5 categories by revenue",
];

const schemaColumns = [
  ["order_date", "Date the order was placed"], ["order_id", "Business order identifier"],
  ["category", "Product category"], ["line_item_revenue", "Price × quantity"],
  ["quantity", "Units purchased"], ["order_status", "Current order status"],
  ["customer_id", "Customer identifier"], ["region", "Customer region"],
];

function Avatar({ role }: { role: "user" | "assistant" }) {
  return <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${role === "assistant" ? "bg-emerald-600 text-white" : "bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900"}`}>{role === "assistant" ? "AI" : "YOU"}</span>;
}

function timeLabel(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatColumnName(column: string) {
  return column
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bId\b/g, "ID")
    .replace(/\bSk\b/g, "SK");
}

function formatValue(value: unknown, column: string) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    return value.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (column.endsWith("_date") && typeof value === "string") {
    const date = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  }
  return String(value);
}

function ResultTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (rows.length === 0) {
    return <p className="rounded-lg border border-dashed border-gray-300 px-4 py-5 text-sm text-gray-500">No matching records were found.</p>;
  }
  const [sort, setSort] = useState<{ column: string; direction: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const columns = Object.keys(rows[0]);
  const sortedRows = sort ? [...rows].sort((a, b) => {
    const left = String(a[sort.column] ?? "");
    const right = String(b[sort.column] ?? "");
    return left.localeCompare(right, undefined, { numeric: true }) * (sort.direction === "asc" ? 1 : -1);
  }) : rows;
  const pageCount = Math.ceil(sortedRows.length / pageSize);
  const visibleRows = sortedRows.slice(page * pageSize, (page + 1) * pageSize);
  function toggleSort(column: string) {
    setPage(0);
    setSort((current) => current?.column === column
      ? { column, direction: current.direction === "asc" ? "desc" : "asc" }
      : { column, direction: "asc" });
  }
  function exportCsv() {
    const csv = [columns, ...sortedRows.map((row) => columns.map((column) => JSON.stringify(row[column] ?? "")))].map((line) => line.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "orders-results.csv";
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="space-y-3">
      {rows.length > 100 && <p className="text-sm text-amber-700">Large result set: showing {pageSize} rows at a time.</p>}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{rows.length.toLocaleString()} results</span>
        <button type="button" onClick={exportCsv} className="font-medium text-gray-700 underline underline-offset-4 hover:text-gray-950">Export CSV</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <table className="min-w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
          <tr>
            {columns.map((col) => (
              <th key={col} scope="col" className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700 dark:border-slate-700 dark:text-slate-200">
                <button type="button" onClick={() => toggleSort(col)} className="focus:outline-none focus:ring-2 focus:ring-emerald-600">{formatColumnName(col)} {sort?.column === col ? (sort.direction === "asc" ? "↑" : "↓") : "↕"}</button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row, i) => (
            <tr key={i} className="border-b border-slate-100 even:bg-slate-50/70 hover:bg-blue-50/60 dark:border-slate-800 dark:even:bg-slate-800/60 dark:hover:bg-slate-700">
              {columns.map((col) => (
              <td key={col} className="whitespace-nowrap border-r border-slate-100 px-4 py-3 text-slate-700 last:border-r-0 dark:border-slate-800 dark:text-slate-200">
                  {formatValue(row[col], col)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {pageCount > 1 && <div className="flex items-center justify-between text-sm text-gray-600"><span>Page {page + 1} of {pageCount}</span><div className="flex gap-3"><button type="button" disabled={page === 0} onClick={() => setPage(page - 1)} className="underline disabled:text-gray-300">Previous</button><button type="button" disabled={page === pageCount - 1} onClick={() => setPage(page + 1)} className="underline disabled:text-gray-300">Next</button></div></div>}
    </div>
  );
}

function KpiCard({ rows }: { rows: Record<string, unknown>[] }) {
  const row = rows[0];
  if (!row) return <p className="text-sm text-gray-500">No matching records were found.</p>;
  const [label, value] = Object.entries(row)[0] ?? ["Result", "—"];
  return <div className="border border-emerald-200 bg-emerald-50/40 p-5 dark:border-emerald-800 dark:bg-emerald-950/40"><p className="text-sm font-medium text-gray-700 dark:text-slate-300">{formatColumnName(label)}</p><p className="mt-2 text-3xl font-semibold tracking-tight text-gray-950 dark:text-white">{formatValue(value, label)}</p><p className="mt-2 text-sm text-gray-600 dark:text-slate-400">Verified from the orders warehouse</p></div>;
}

function ResultChart({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows.length) return <p className="text-sm text-gray-500">No matching records were found.</p>;
  const columns = Object.keys(rows[0]);
  const valueColumn = columns.find((column) => typeof rows[0][column] === "number") ?? columns[1];
  const max = Math.max(...rows.map((row) => Number(row[valueColumn]) || 0), 1);
  return <div className="space-y-3" role="img" aria-label={`Chart of ${formatColumnName(valueColumn)}`}>
    {rows.slice(0, 12).map((row, index) => <div key={index} className="grid grid-cols-[minmax(90px,1fr)_3fr_auto] items-center gap-3 text-sm"><span className="truncate text-gray-600">{formatValue(row[columns[0]], columns[0])}</span><div className="h-3 bg-gray-100"><div className="h-full bg-emerald-600" style={{ width: `${Math.max((Number(row[valueColumn]) || 0) / max * 100, 2)}%` }} /></div><span className="font-medium text-gray-900">{formatValue(row[valueColumn], valueColumn)}</span></div>)}
  </div>;
}

function AssistantBubble({
  result,
  view,
  onToggleView,
  onFeedback,
  onRegenerate,
}: {
  result: Extract<QueryResponse, { status: "ok" }>;
  view: "summary" | "table" | "chart";
  onToggleView: () => void;
  onFeedback: (value: "up" | "down") => void;
  onRegenerate: () => void;
}) {
  const showingTable = view === "table";
  const showingChart = view === "chart";
  return (
    <div className="space-y-3">
      {!showingTable && !showingChart && (
        <>
          <div className="text-sm leading-relaxed text-gray-800"><ReactMarkdown>{result.answer}</ReactMarkdown></div>
          {result.visualization === "kpi" && <KpiCard rows={result.rows} />}
        </>
      )}
      {showingChart && <ResultChart rows={result.rows} />}
      {showingTable && (
        <>
          <div className="mb-2 text-xs text-gray-500">{result.rows.length.toLocaleString()} {result.rows.length === 1 ? "result" : "results"}</div>
          <ResultTable rows={result.rows} />
        </>
      )}
      <details className="pt-1 text-xs text-gray-400">
        <summary className="w-fit cursor-pointer select-none font-mono hover:text-gray-700">[Options]</summary>
        <div className="mt-3 space-y-3 border-l border-gray-200 pl-3">
          <button type="button" onClick={onToggleView} className="block font-medium text-gray-600 underline decoration-gray-300 underline-offset-4 hover:text-gray-950">
            {showingTable || showingChart ? "See natural answer" : result.visualization === "chart" ? "See chart view" : "See table view"}
          </button>
          <div className="flex gap-3 text-gray-600">
            <button type="button" onClick={() => navigator.clipboard?.writeText(result.answer)} className="underline underline-offset-4 hover:text-gray-950">Copy answer</button>
            <button type="button" onClick={onRegenerate} className="underline underline-offset-4 hover:text-gray-950">Regenerate</button>
            <button type="button" onClick={() => onFeedback("up")} aria-label="Helpful answer" className={result ? "hover:text-emerald-700" : ""}>👍</button>
            <button type="button" onClick={() => onFeedback("down")} aria-label="Unhelpful answer" className="hover:text-red-700">👎</button>
          </div>
          <details className="text-gray-500">
            <summary className="w-fit cursor-pointer select-none hover:text-gray-800">Show generated SQL</summary>
            <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-gray-900 p-3 text-left text-gray-100">{result.sql}</pre>
          </details>
        </div>
      </details>
    </div>
  );
}

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<string[]>(() => JSON.parse(localStorage.getItem("orders-chat-history") || "[]"));
  const [slowRequest, setSlowRequest] = useState(false);
  const slowRequestTimer = useRef<number | null>(null);

  function useExample(example: string) {
    setQuestion(example);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    const timestamp = Date.now();
    setMessages((prev) => [...prev, { role: "user", text: trimmed, timestamp }]);
    setHistory((prev) => { const next = [trimmed, ...prev.filter((item) => item !== trimmed)].slice(0, 12); localStorage.setItem("orders-chat-history", JSON.stringify(next)); return next; });
    setQuestion("");
    setLoading(true);
    setSlowRequest(false);
    slowRequestTimer.current = window.setTimeout(() => setSlowRequest(true), 4000);

    try {
      const result = await askQuestion(trimmed);
      if (result.status === "cannot_answer") {
        setMessages((prev) => [...prev, { role: "assistant-error", text: result.reason, timestamp: Date.now() }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", result, view: result.preferred_view, question: trimmed, timestamp: Date.now() }]);
      }
    } catch (err) {
      const text = err instanceof QueryError ? err.message : "Network error. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant-error", text, timestamp: Date.now() }]);
    } finally {
      if (slowRequestTimer.current !== null) {
        window.clearTimeout(slowRequestTimer.current);
        slowRequestTimer.current = null;
      }
      setSlowRequest(false);
      setLoading(false);
    }
  }

  function regenerate(questionText: string) { setQuestion(questionText); window.setTimeout(() => document.querySelector<HTMLFormElement>("#ask form")?.requestSubmit(), 0); }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col bg-white text-gray-900">
      <header className="border-b border-gray-200 bg-white px-5 py-5 text-gray-900 sm:px-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center border border-gray-900 font-mono text-[10px] font-bold tracking-tight text-gray-900" aria-hidden="true">OC</span>
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-600">Order intelligence</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-950">Ask your orders.</h1>
            <p className="mt-1 text-sm text-gray-600">A focused workspace for exploring e-commerce performance.</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-gray-700"><button type="button" onClick={() => setShowSchema((value) => !value)}>Schema</button><button type="button" onClick={() => setShowHistory((value) => !value)}>History</button>{messages.length > 0 && <button type="button" onClick={() => window.confirm("Clear this conversation?") && setMessages([])}>Clear</button>}</div>
        </div>
      </header>

      {showHistory && <aside className="border-b border-gray-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-7"><p className="mb-3 text-sm font-semibold">Saved queries</p>{history.length ? history.map((item) => <button key={item} type="button" onClick={() => setQuestion(item)} className="block w-full truncate py-1 text-left text-sm text-gray-700 hover:text-gray-950 dark:text-slate-300 dark:hover:text-white">{item}</button>) : <p className="text-sm text-gray-600 dark:text-slate-400">Your recent questions will appear here.</p>}</aside>}
      {showSchema && <aside className="border-b border-gray-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-7"><p className="mb-3 text-sm font-semibold">obt_orders schema</p><div className="grid gap-2 sm:grid-cols-2">{schemaColumns.map(([name, description]) => <div key={name} className="text-sm"><code className="font-medium text-emerald-700 dark:text-emerald-400">{name}</code><p className="text-gray-600 dark:text-slate-400">{description}</p></div>)}</div></aside>}

      <main id="conversation" aria-label="Conversation" className="flex-1 overflow-y-auto bg-white px-5 py-8 sm:px-7">
        <section aria-labelledby="conversation-heading" className="space-y-8">
        {messages.length > 0 && (
          <h2 id="conversation-heading" className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Conversation</h2>
        )}
        {messages.length === 0 && (
          <div className="border-y border-gray-200 py-8">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400">Start a conversation</p>
            <p className="mt-3 text-lg font-medium tracking-tight text-gray-900 dark:text-white">What would you like to know?</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">Ask in plain language. I’ll query the order data and explain the result.</p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3">
              {examples.map((example) => (
                <button key={example} type="button" onClick={() => useExample(example)} className="border-b border-gray-300 pb-1 text-left text-xs text-gray-600 transition hover:border-gray-900 hover:text-gray-950">
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => {
          if (msg.role === "user") {
            return (
              <div key={i} className="flex max-w-[90%] gap-3 text-sm leading-relaxed text-gray-900 dark:text-slate-100">
                <Avatar role="user" /><div><div className="mb-1 text-xs text-gray-400">You · {timeLabel(msg.timestamp)}</div><div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3 dark:bg-slate-800">{msg.text}</div></div>
              </div>
            );
          }
          if (msg.role === "assistant-error") {
            return (
              <div key={i} className="text-sm leading-relaxed text-red-700">
                <Avatar role="assistant" /><div><div className="mb-1 text-xs text-gray-400">AI · {timeLabel(msg.timestamp)}</div><div className="text-red-700">{msg.text}</div></div>
              </div>
            );
          }
          return <div key={i}>
            <div className="flex gap-3"><Avatar role="assistant" /><div className="min-w-0 flex-1"><div className="mb-2 text-xs text-gray-400">AI · {timeLabel(msg.timestamp)}</div><div className="border-l-2 border-emerald-600 pl-4">
              <AssistantBubble result={msg.result} view={msg.view} onFeedback={(feedback) => setMessages((prev) => prev.map((item, index) => index === i && item.role === "assistant" ? { ...item, feedback } : item))} onRegenerate={() => regenerate(msg.question)} onToggleView={() => setMessages((prev) => prev.map((item, index) => index === i && item.role === "assistant" ? { ...item, view: item.view === "summary" ? (item.result.visualization === "chart" ? "chart" : "table") : "summary" } : item))} />
            </div></div>
            </div>
          </div>;
        })}
        {loading && <div className="text-sm text-gray-500">
          <div className="mb-2 flex items-center gap-3 text-xs text-gray-400"><Avatar role="assistant" /> AI is working…</div>
          {slowRequest ? (
            <div>
              <p>The analytics service is waking up.</p>
              <p className="mt-1 text-xs text-gray-400">The free server may take up to a minute to respond on its first request.</p>
            </div>
          ) : (
            <div>Thinking…</div>
          )}
        </div>}
        </section>
      </main>

      <section id="ask" aria-labelledby="ask-heading" className="border-t border-gray-200 bg-white px-5 sm:px-7">
      <h2 id="ask-heading" className="sr-only">Ask a question</h2>
      <form onSubmit={handleSubmit} className="flex items-end gap-4 py-4">
        <textarea
          value={question}
          rows={1}
          onChange={(e) => {
            setQuestion(e.target.value);
            e.currentTarget.style.height = "auto";
            e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 160)}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="Ask a question about your orders…"
          aria-label="Question about your orders"
          className="min-w-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent px-0 py-2 text-sm leading-6 text-gray-900 outline-none placeholder:text-gray-400 focus:ring-0"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className={`pb-2 text-sm font-medium transition-colors ${question.trim() && !loading ? "text-gray-950 hover:text-gray-600" : "cursor-not-allowed text-gray-400"}`}
        >
          Send
        </button>
      </form>
      </section>
    </div>
  );
}

export default App;
