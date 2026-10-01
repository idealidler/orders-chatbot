import { Avatar } from "./Avatar";
import { AssistantBubble } from "./AssistantBubble";
import type { ChatMessage } from "../types";
import { timeLabel } from "../utils/format";

export function UserMessage({ message }: { message: Extract<ChatMessage, { role: "user" }> }) {
  return (
    <div className="flex max-w-[92%] flex-row-reverse gap-3 self-end text-sm leading-relaxed">
      <Avatar role="user" />
      <div className="min-w-0">
        <div className="mb-1 text-right text-xs text-slate-400">You · {timeLabel(message.timestamp)}</div>
        <div className="rounded-2xl rounded-tr-sm bg-slate-900 px-4 py-2.5 text-white shadow-sm dark:bg-slate-700">{message.text}</div>
      </div>
    </div>
  );
}

export function ErrorMessage({ message }: { message: Extract<ChatMessage, { role: "assistant-error" }> }) {
  return (
    <div className="flex max-w-[92%] gap-3 text-sm leading-relaxed">
      <Avatar role="assistant" />
      <div className="min-w-0">
        <div className="mb-1 text-xs text-slate-400">AI · {timeLabel(message.timestamp)}</div>
        <div className="rounded-2xl rounded-tl-sm border border-red-200 bg-red-50 px-4 py-2.5 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {message.text}
        </div>
      </div>
    </div>
  );
}

export function AssistantMessage({
  message,
  onFeedback,
  onRegenerate,
  onToggleView,
}: {
  message: Extract<ChatMessage, { role: "assistant" }>;
  onFeedback: (feedback: "up" | "down") => void;
  onRegenerate: () => void;
  onToggleView: () => void;
}) {
  return (
    <div className="flex max-w-[92%] gap-3">
      <Avatar role="assistant" />
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 text-xs text-slate-400">AI · {timeLabel(message.timestamp)}</div>
        <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <AssistantBubble
            result={message.result}
            view={message.view}
            feedback={message.feedback}
            onFeedback={onFeedback}
            onRegenerate={onRegenerate}
            onToggleView={onToggleView}
          />
        </div>
      </div>
    </div>
  );
}

export function TypingIndicator({ slow }: { slow: boolean }) {
  return (
    <div className="flex max-w-[92%] gap-3 text-sm">
      <Avatar role="assistant" />
      <div className="min-w-0">
        <div className="mb-1.5 text-xs text-slate-400">AI is thinking…</div>
        <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="flex gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500" />
          </span>
          {slow && <span className="text-xs text-slate-400">Waking up the analytics service — this can take up to a minute…</span>}
        </div>
      </div>
    </div>
  );
}
