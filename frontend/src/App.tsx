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

function formatValue(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") return value.toLocaleString();
  return String(value);
}

function ResultTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (rows.length === 0) {
    return <p className="rounded-lg border border-dashed border-gray-300 px-4 py-5 text-sm text-gray-500">No matching records were found.</p>;
  }
  const columns = Object.keys(rows[0]);
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((col) => (
              <th key={col} className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((col) => (
              <td key={col} className="whitespace-nowrap px-4 py-2.5 text-gray-800">
                  {formatValue(row[col])}
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
        <div className="prose prose-sm max-w-none text-gray-800">
          <ReactMarkdown>{result.answer}</ReactMarkdown>
        </div>
      )}
      {showingTable && (
        <>
          <div className="mb-2 text-xs text-gray-500">{result.rows.length.toLocaleString()} {result.rows.length === 1 ? "result" : "results"}</div>
          <ResultTable rows={result.rows} />
        </>
      )}
      <div className="flex items-center gap-3 text-xs">
        <button type="button" onClick={onToggleView} className="font-medium text-gray-600 underline decoration-gray-300 underline-offset-4 hover:text-gray-950">
          {showingTable ? "See natural answer" : "See table view"}
        </button>
        <span className="text-gray-400">·</span>
        <details className="text-gray-500">
          <summary className="cursor-pointer select-none hover:text-gray-800">Show generated SQL</summary>
          <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-gray-900 p-3 text-left text-gray-100">{result.sql}</pre>
        </details>
      </div>
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
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col bg-white shadow-sm">
      <header className="border-b border-gray-200 bg-white px-5 py-5 sm:px-8">
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

      <main className="flex-1 space-y-5 overflow-y-auto bg-slate-50/60 px-5 py-6 sm:px-8">
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
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-gray-900 px-4 py-3 text-sm leading-relaxed text-white shadow-sm">
                  {msg.text}
                </div>
              </div>
            );
          }
          if (msg.role === "assistant-error") {
            return (
              <div key={i} className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {msg.text}
              </div>
            );
          }
          return <div key={i}><AssistantBubble result={msg.result} view={msg.view} onToggleView={() => setMessages((prev) => prev.map((item, index) => index === i && item.role === "assistant" ? { ...item, view: item.view === "summary" ? "table" : "summary" } : item))} /></div>;
        })}
        {loading && <div className="flex items-center gap-2 text-sm text-gray-500"><span className="h-2 w-2 animate-pulse rounded-full bg-gray-400" /> Thinking…</div>}
      </main>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-gray-200 bg-white px-5 py-4 sm:px-8">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about your orders…"
          aria-label="Question about your orders"
          className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </div>
  );
}

export default App;
