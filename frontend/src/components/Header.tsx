import { MoonIcon, SunIcon, TrashIcon } from "./icons";

export function Header({
  theme,
  onToggleTheme,
  onToggleSidebar,
  hasMessages,
  onClear,
}: {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onToggleSidebar: () => void;
  hasMessages: boolean;
  onClear: () => void;
}) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3.5 backdrop-blur sm:px-6 dark:border-slate-800 dark:bg-slate-900/90">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:hidden dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Toggle sidebar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold tracking-tight text-slate-950 dark:text-white">Order Intelligence</h1>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">Ask anything about your orders, in plain language.</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {hasMessages && (
          <button
            type="button"
            onClick={() => window.confirm("Clear this conversation?") && onClear()}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-red-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-red-400"
            aria-label="Clear conversation"
            title="Clear conversation"
          >
            <TrashIcon width={16} height={16} />
          </button>
        )}
        <button
          type="button"
          onClick={onToggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label="Toggle theme"
          title="Toggle theme"
        >
          {theme === "dark" ? <SunIcon width={16} height={16} /> : <MoonIcon width={16} height={16} />}
        </button>
      </div>
    </header>
  );
}
