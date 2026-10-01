import { HistoryIcon, SchemaIcon, SparklesIcon } from "./icons";

const examples = ["How many total orders do we have?", "Revenue by year", "Top 5 categories by revenue"];

const schemaColumns: [string, string][] = [
  ["order_date", "Date the order was placed"],
  ["order_id", "Business order identifier"],
  ["category", "Product category"],
  ["line_item_revenue", "Price × quantity"],
  ["quantity", "Units purchased"],
  ["order_status", "Current order status"],
  ["customer_id", "Customer identifier"],
  ["region", "Customer region"],
];

export function Sidebar({
  open,
  onClose,
  history,
  onSelectQuestion,
}: {
  open: boolean;
  onClose: () => void;
  history: string[];
  onSelectQuestion: (question: string) => void;
}) {
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-20 bg-slate-950/40 backdrop-blur-sm lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-72 shrink-0 flex-col gap-6 overflow-y-auto border-r border-slate-200 bg-white px-5 py-6 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 dark:border-slate-800 dark:bg-slate-900 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
            <SparklesIcon width={18} height={18} />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight text-slate-950 dark:text-white">Orders Chatbot</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Order intelligence workspace</p>
          </div>
        </div>

        <div>
          <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            <SparklesIcon width={13} height={13} /> Try asking
          </p>
          <div className="flex flex-col gap-1.5">
            {examples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => onSelectQuestion(example)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-left text-xs font-medium text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            <HistoryIcon width={13} height={13} /> Recent questions
          </p>
          {history.length ? (
            <div className="flex flex-col gap-0.5">
              {history.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => onSelectQuestion(item)}
                  className="truncate rounded-lg px-3 py-1.5 text-left text-xs text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                >
                  {item}
                </button>
              ))}
            </div>
          ) : (
            <p className="px-3 text-xs text-slate-400 dark:text-slate-500">Your recent questions will appear here.</p>
          )}
        </div>

        <div>
          <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            <SchemaIcon width={13} height={13} /> obt_orders schema
          </p>
          <div className="flex flex-col gap-2.5">
            {schemaColumns.map(([name, description]) => (
              <div key={name} className="text-xs">
                <code className="font-semibold text-emerald-700 dark:text-emerald-400">{name}</code>
                <p className="mt-0.5 leading-snug text-slate-500 dark:text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
