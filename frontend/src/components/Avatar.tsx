export function Avatar({ role }: { role: "user" | "assistant" }) {
  if (role === "assistant") {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-semibold text-white shadow-sm ring-1 ring-black/5">
        AI
      </span>
    );
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-semibold text-white shadow-sm ring-1 ring-black/5 dark:from-slate-200 dark:to-white dark:text-slate-900">
      YOU
    </span>
  );
}
