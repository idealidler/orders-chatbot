import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { askQuestion, QueryError, type QueryResponse } from "./api";

type ChatMessage =
  | { role: "user"; text: string }
  | { role: "assistant"; result: Extract<QueryResponse, { status: "ok" }>; view: "summary" | "table" }
  | { role: "assistant-error"; text: string };

const examples = [
  "How many total orders do we have?",
  "Revenue by year",
  "Top 5 categories by revenue",
];

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
  const columns = Object.keys(rows[0]);
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-slate-100">
          <tr>
            {columns.map((col) => (
              <th key={col} scope="col" className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                {formatColumnName(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-100 even:bg-slate-50/70 hover:bg-blue-50/60">
              {columns.map((col) => (
              <td key={col} className="whitespace-nowrap border-r border-slate-100 px-4 py-3 text-slate-700 last:border-r-0">
                  {formatValue(row[col], col)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AssistantBubble({
  result,
  view,
  onToggleView,
}: {
  result: Extract<QueryResponse, { status: "ok" }>;
  view: "summary" | "table";
  onToggleView: () => void;
}) {
  const showingTable = view === "table";
  return (
    <div className="space-y-3">
      {!showingTable && (
        <div className="text-sm leading-relaxed text-gray-800">
          <ReactMarkdown>{result.answer}</ReactMarkdown>
        </div>
      )}
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
            {showingTable ? "See natural answer" : "See table view"}
          </button>
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

  function useExample(example: string) {
    setQuestion(example);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setQuestion("");
    setLoading(true);

    try {
      const result = await askQuestion(trimmed);
      if (result.status === "cannot_answer") {
        setMessages((prev) => [...prev, { role: "assistant-error", text: result.reason }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", result, view: result.preferred_view }]);
      }
    } catch (err) {
      const text = err instanceof QueryError ? err.message : "Network error. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant-error", text }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col bg-white">
      <header className="border-b border-gray-200 bg-white px-5 py-5 sm:px-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Analytics assistant</span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-gray-950">Orders Chatbot</h1>
            <p className="mt-1 text-sm text-gray-500">Ask questions about e-commerce orders and KPIs</p>
          </div>
          {messages.length > 0 && (
            <button type="button" onClick={() => setMessages([])} className="text-xs font-medium text-gray-500 hover:text-gray-900">
              Clear chat
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 space-y-8 overflow-y-auto bg-white px-5 py-8 sm:px-7">
        {messages.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-900">What would you like to know?</p>
            <p className="mt-1 text-sm text-gray-500">Try one of these questions to explore your order data.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {examples.map((example) => (
                <button key={example} type="button" onClick={() => useExample(example)} className="rounded-full border border-gray-200 bg-white px-3 py-2 text-left text-xs text-gray-600 transition hover:border-gray-400 hover:text-gray-950">
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => {
          if (msg.role === "user") {
            return (
              <div key={i} className="max-w-[85%] text-sm leading-relaxed text-gray-900">
                <div className="mb-2 font-mono text-[11px] font-semibold tracking-widest text-gray-400">[YOU]</div>
                <div>{msg.text}</div>
              </div>
            );
          }
          if (msg.role === "assistant-error") {
            return (
              <div key={i} className="text-sm leading-relaxed text-red-700">
                <div className="mb-2 font-mono text-[11px] font-semibold tracking-widest text-red-400">[AI]</div>
                <div>{msg.text}</div>
              </div>
            );
          }
          return <div key={i}>
            <div className="mb-2 font-mono text-[11px] font-semibold tracking-widest text-gray-400">[AI]</div>
            <AssistantBubble result={msg.result} view={msg.view} onToggleView={() => setMessages((prev) => prev.map((item, index) => index === i && item.role === "assistant" ? { ...item, view: item.view === "summary" ? "table" : "summary" } : item))} />
          </div>;
        })}
        {loading && <div className="text-sm text-gray-500"><div className="mb-2 font-mono text-[11px] font-semibold tracking-widest text-gray-400">[AI]</div><div>Thinking…</div></div>}
      </main>

      <form onSubmit={handleSubmit} className="flex items-end gap-4 border-t border-gray-200 bg-white px-5 py-4 sm:px-7">
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
    </div>
  );
}

export default App;
