import { SparklesIcon } from "./icons";

const examples = [
  { label: "Order volume", question: "How many total orders do we have?" },
  { label: "Revenue trend", question: "How has revenue changed by year?" },
  { label: "Top categories", question: "What are the top 5 categories by revenue?" },
  { label: "Customer insights", question: "Which customers have placed the most orders?" },
];

export function EmptyState({ onSelectExample }: { onSelectExample: (example: string) => void }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center py-12 text-center sm:py-16">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-sm">
        <SparklesIcon width={24} height={24} />
      </span>
      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-400">Order data assistant</p>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-stone-950 dark:text-white sm:text-4xl">Ask about your orders</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-stone-500 dark:text-stone-400">
          Explore order volume, revenue, customers, categories, and trends using plain language.
        </p>
      </div>
      <div className="mt-8 w-full text-left">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-400 dark:text-stone-500">Try a question</p>
        <div className="grid gap-2 sm:grid-cols-2">
        {examples.map((example) => (
          <button
            key={example.question}
            type="button"
            onClick={() => onSelectExample(example.question)}
            className="group rounded-xl border border-stone-200 bg-white px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md dark:border-stone-800 dark:bg-stone-900 dark:hover:border-amber-800"
          >
            <span className="block text-xs font-semibold text-amber-700 dark:text-amber-400">{example.label}</span>
            <span className="mt-1 block text-sm leading-5 text-stone-700 group-hover:text-stone-950 dark:text-stone-300 dark:group-hover:text-white">{example.question}</span>
          </button>
        ))}
        </div>
        <p className="mt-4 text-center text-xs text-stone-400 dark:text-stone-500">Tip: include a time period, category, or comparison for a more precise answer.</p>
      </div>
    </div>
  );
}
