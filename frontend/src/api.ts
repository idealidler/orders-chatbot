export type QueryResponse =
  | {
      status: "ok";
      answer: string;
      preferred_view: "summary" | "table" | "chart";
      visualization: "kpi" | "chart" | "donut" | "table";
      sql: string;
      rows: Record<string, unknown>[];
    }
  | { status: "cannot_answer"; reason: string };

export class QueryError extends Error {}

function normalizeQueryResponse(payload: unknown): QueryResponse {
  if (!payload || typeof payload !== "object") throw new QueryError("The response was not in a usable format. Please try again.");
  const data = payload as Record<string, unknown>;
  if (data.status === "cannot_answer") return { status: "cannot_answer", reason: typeof data.reason === "string" ? data.reason : "I couldn't answer that question." };
  if (data.status !== "ok") throw new QueryError("The response was not in a usable format. Please try again.");

  const views = ["summary", "table", "chart"] as const;
  const visualizations = ["kpi", "chart", "donut", "table"] as const;
  const preferred_view = views.includes(data.preferred_view as typeof views[number]) ? data.preferred_view as typeof views[number] : "summary";
  const visualization = visualizations.includes(data.visualization as typeof visualizations[number]) ? data.visualization as typeof visualizations[number] : "table";
  const rows = Array.isArray(data.rows) ? data.rows.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object" && !Array.isArray(row)) : [];
  return { status: "ok", answer: typeof data.answer === "string" ? data.answer : "", preferred_view, visualization, sql: typeof data.sql === "string" ? data.sql : "", rows };
}

// VITE_API_BASE is injected by Vercel at build time. Keep localhost only for
// local Vite development; using it in a deployed build makes the browser call
// the visitor's own computer.
const configuredApiBase = import.meta.env.VITE_API_BASE?.trim();
const API_BASE = (configuredApiBase || (import.meta.env.DEV ? "http://127.0.0.1:8000" : ""))
  .replace(/\/+$/, "");

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

  return normalizeQueryResponse(await res.json());
}
