import type { QueryResponse } from "./api";

export type Tab = "chat" | "data" | "methodology";

export type ChatMessage =
  | { role: "user"; text: string; timestamp: number }
  | {
      role: "assistant";
      result: Extract<QueryResponse, { status: "ok" }>;
      view: "summary" | "table" | "chart";
      question: string;
      timestamp: number;
      feedback?: "up" | "down";
    }
  | { role: "assistant-error"; text: string; timestamp: number };
