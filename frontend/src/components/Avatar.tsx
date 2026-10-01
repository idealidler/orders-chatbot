export function Avatar({ role }: { role: "user" | "assistant" }) {
  if (role === "assistant") {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-600 text-xs font-semibold text-white shadow-sm ring-1 ring-black/5">
        AI
      </span>
    );
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-900 text-xs font-semibold text-white shadow-sm ring-1 ring-black/5 dark:bg-stone-100 dark:text-stone-900">
      YOU
    </span>
  );
}
