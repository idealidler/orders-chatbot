import { useRef } from "react";
import { SendIcon } from "./icons";

export function Composer({
  question,
  onChange,
  onSubmit,
  loading,
}: {
  question: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <section
      id="ask"
      aria-labelledby="ask-heading"
      className="border-t border-stone-200 bg-white/90 px-4 pb-4 pt-3 backdrop-blur sm:px-6 dark:border-stone-800 dark:bg-stone-900/90"
    >
      <h2 id="ask-heading" className="sr-only">
        Ask a question
      </h2>
      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-stone-200 bg-white px-3 py-2 shadow-sm transition focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:focus-within:ring-amber-900/40"
      >
        <textarea
          value={question}
          rows={1}
          onChange={(e) => {
            onChange(e.target.value);
            e.currentTarget.style.height = "auto";
            e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 160)}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              formRef.current?.requestSubmit();
            }
          }}
          placeholder="Ask a question about your orders…"
          aria-label="Question about your orders"
          className="min-w-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent px-2 py-2 text-sm leading-6 text-stone-900 outline-none placeholder:text-stone-400 focus:ring-0 dark:text-white"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          aria-label="Send question"
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition ${
            question.trim() && !loading
              ? "bg-amber-600 hover:bg-amber-700 active:bg-amber-800"
              : "cursor-not-allowed bg-stone-300 dark:bg-stone-700"
          }`}
        >
          <SendIcon width={16} height={16} />
        </button>
      </form>
      <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-stone-400 dark:text-stone-500">
        Answers are generated from your order data and may be imprecise. Verify important figures.
      </p>
    </section>
  );
}
