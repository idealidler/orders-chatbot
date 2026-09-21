export type QueryResponse =
  | {
      status: "ok";
      answer: string;
      preferred_view: "summary" | "table";
      sql: string;
      rows: Record<string, unknown>[];
    }
  | { status: "cannot_answer"; reason: string };

export class QueryError extends Error {}

// VITE_API_BASE is injected by Vercel at build time. Keep localhost only for
// local Vite development; using it in a deployed build makes the browser call
// the visitor's own computer.
const configuredApiBase = import.meta.env.VITE_API_BASE?.trim();
const API_BASE = configuredApiBase || (import.meta.env.DEV ? "http://127.0.0.1:8000" : "");

export async function askQuestion(question: string): Promise<QueryResponse> {
  if (!API_BASE) {
    throw new QueryError("Backend URL is not configured. Set VITE_API_BASE in Vercel and redeploy.");
  }

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
