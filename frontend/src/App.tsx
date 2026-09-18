import { useState } from "react";
import { askQuestion, QueryError, type QueryResponse } from "./api";

type ChatMessage =
  | { role: "user"; text: string }
  | { role: "assistant"; result: QueryResponse }
  | { role: "assistant-error"; text: string };

function ResultTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-500">Query returned no rows.</p>;
  }
  const columns = Object.keys(rows[0]);
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-3 py-2 text-left font-medium text-gray-600">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((col) => (
                <td key={col} className="px-3 py-2 text-gray-800">
                  {String(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AssistantBubble({ result }: { result: QueryResponse }) {
  if (result.status === "cannot_answer") {
    return (
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 text-sm">
        Can't answer this from the available data: {result.reason}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <ResultTable rows={result.rows} />
      <details className="text-xs text-gray-500">
        <summary className="cursor-pointer select-none">Show generated SQL</summary>
        <pre className="mt-1 whitespace-pre-wrap rounded bg-gray-900 p-3 text-gray-100">
          {result.sql}
        </pre>
      </details>
    </div>
  );
}

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setQuestion("");
    setLoading(true);

    try {
      const result = await askQuestion(trimmed);
      setMessages((prev) => [...prev, { role: "assistant", result }]);
    } catch (err) {
      const text = err instanceof QueryError ? err.message : "Network error. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant-error", text }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex h-screen max-w-3xl flex-col bg-white">
      <header className="border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">Orders Chatbot</h1>
        <p className="text-sm text-gray-500">Ask questions about e-commerce orders and KPIs</p>
      </header>

      <main className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
        {messages.length === 0 && (
          <p className="text-sm text-gray-400">
            Try: "How many total orders do we have?" or "Top 5 categories by revenue"
          </p>
        )}
        {messages.map((msg, i) => {
          if (msg.role === "user") {
            return (
              <div key={i} className="flex justify-end">
                <div className="max-w-[80%] rounded-lg bg-gray-900 px-4 py-2 text-white text-sm">
                  {msg.text}
                </div>
              </div>
            );
          }
          if (msg.role === "assistant-error") {
            return (
              <div key={i} className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
                {msg.text}
              </div>
            );
          }
          return (
            <div key={i}>
              <AssistantBubble result={msg.result} />
            </div>
          );
        })}
        {loading && <p className="text-sm text-gray-400">Thinking…</p>}
      </main>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-gray-200 px-6 py-4">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about your orders…"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </div>
  );
}

export default App;
