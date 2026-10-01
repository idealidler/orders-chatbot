import { SparklesIcon } from "./icons";

const examples = ["How many total orders do we have?", "Revenue by year", "Top 5 categories by revenue"];

export function EmptyState({ onSelectExample }: { onSelectExample: (example: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-md">
        <SparklesIcon width={24} height={24} />
      </span>
      <div>
        <p className="font-display text-lg font-semibold tracking-tight text-stone-950 dark:text-white">What would you like to know?</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-stone-500 dark:text-stone-400">
          Ask in plain language — I'll query the order data and explain the result.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => onSelectExample(example)}
            className="rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-600 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:border-amber-800 dark:hover:bg-amber-950/40 dark:hover:text-amber-300"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
