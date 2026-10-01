import { useRef, useState } from "react";
import { askQuestion, QueryError } from "../api";
import type { ChatMessage } from "../types";

const HISTORY_KEY = "orders-chat-history";

export function useConversation() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [slowRequest, setSlowRequest] = useState(false);
  const [history, setHistory] = useState<string[]>(
    () => JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"),
  );
  const slowRequestTimer = useRef<number | null>(null);

  async function submitQuestion(rawQuestion: string) {
    const trimmed = rawQuestion.trim();
    if (!trimmed || loading) return;

    const timestamp = Date.now();
    setMessages((prev) => [...prev, { role: "user", text: trimmed, timestamp }]);
    setHistory((prev) => {
      const next = [trimmed, ...prev.filter((item) => item !== trimmed)].slice(0, 12);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
    setLoading(true);
    setSlowRequest(false);
    slowRequestTimer.current = window.setTimeout(() => setSlowRequest(true), 4000);

    try {
      const result = await askQuestion(trimmed);
      if (result.status === "cannot_answer") {
        setMessages((prev) => [...prev, { role: "assistant-error", text: result.reason, timestamp: Date.now() }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", result, view: result.preferred_view, question: trimmed, timestamp: Date.now() },
        ]);
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

  function setFeedback(index: number, feedback: "up" | "down") {
    setMessages((prev) =>
      prev.map((item, i) => (i === index && item.role === "assistant" ? { ...item, feedback } : item)),
    );
  }

  function toggleView(index: number) {
    setMessages((prev) =>
      prev.map((item, i) => {
        if (i !== index || item.role !== "assistant") return item;
        const nextView = item.view === "summary" ? (item.result.visualization === "chart" ? "chart" : "table") : "summary";
        return { ...item, view: nextView };
      }),
    );
  }

  function clearConversation() {
    setMessages([]);
  }

  return {
    messages,
    loading,
    slowRequest,
    history,
    submitQuestion,
    setFeedback,
    toggleView,
    clearConversation,
  };
}
