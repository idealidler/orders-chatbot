import { MoonIcon, SparklesIcon, SunIcon, TrashIcon } from "./icons";
import type { Tab } from "../types";

const TABS: { id: Tab; label: string }[] = [
  { id: "chat", label: "Chat" },
  { id: "data", label: "Data & Schema" },
  { id: "methodology", label: "Methodology" },
];

export function Header({
  theme,
  onToggleTheme,
  activeTab,
  onSelectTab,
  hasMessages,
  onClear,
}: {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  activeTab: Tab;
  onSelectTab: (tab: Tab) => void;
  hasMessages: boolean;
  onClear: () => void;
}) {
  return (
    <header className="border-b border-stone-200 bg-white/90 backdrop-blur dark:border-stone-800 dark:bg-stone-900/90">
      <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-600 text-white shadow-sm">
            <SparklesIcon width={16} height={16} />
          </span>
          <div className="min-w-0">
            <h1 className="font-display truncate text-base font-semibold tracking-tight text-stone-950 dark:text-white">Order Intelligence</h1>
            <p className="truncate text-xs text-stone-500 dark:text-stone-400">Ask anything about your orders, in plain language.</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {activeTab === "chat" && hasMessages && (
            <button
              type="button"
              onClick={() => window.confirm("Clear this conversation?") && onClear()}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-100 hover:text-rose-600 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-rose-400"
              aria-label="Clear conversation"
              title="Clear conversation"
            >
              <TrashIcon width={16} height={16} />
            </button>
          )}
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-white"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === "dark" ? <SunIcon width={16} height={16} /> : <MoonIcon width={16} height={16} />}
          </button>
        </div>
      </div>
      <nav aria-label="Sections" className="flex gap-1 px-4 sm:px-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            aria-current={activeTab === tab.id ? "page" : undefined}
            className={`relative px-3 py-2.5 text-sm font-medium transition ${
              activeTab === tab.id
                ? "text-amber-700 dark:text-amber-400"
                : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-amber-600 dark:bg-amber-400" />
            )}
          </button>
        ))}
      </nav>
    </header>
  );
}

