export type QueryResponse =
  | { status: "ok"; sql: string; rows: Record<string, unknown>[] }
  | { status: "cannot_answer"; reason: string };

export class QueryError extends Error {}

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";

export async function askQuestion(question: string): Promise<QueryResponse> {
  const res = await fetch(`${API_BASE}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new QueryError(body?.detail ?? "Something went wrong. Please try again.");
  }

  return res.json();
}
