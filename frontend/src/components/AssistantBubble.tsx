import ReactMarkdown from "react-markdown";
import type { QueryResponse } from "../api";
import { KpiCard } from "./KpiCard";
import { DonutChart } from "./DonutChart";
import { ResultChart } from "./ResultChart";
import { ResultTable } from "./ResultTable";
import { ChartIcon, CopyIcon, RefreshIcon, TableIcon, ThumbsDownIcon, ThumbsUpIcon } from "./icons";

export function AssistantBubble({
  result,
  view,
  feedback,
  onToggleView,
  onFeedback,
  onRegenerate,
}: {
  result: Extract<QueryResponse, { status: "ok" }>;
  view: "summary" | "table" | "chart";
  feedback?: "up" | "down";
  onToggleView: () => void;
  onFeedback: (value: "up" | "down") => void;
  onRegenerate: () => void;
}) {
  const showingTable = view === "table";
  const showingChart = view === "chart";

  return (
    <div className="space-y-3">
      {!showingTable && !showingChart && (
        <>
          <div className="max-w-none text-sm leading-relaxed text-stone-800 [&_strong]:font-semibold [&_strong]:text-stone-950 dark:text-stone-200 dark:[&_strong]:text-white">
            <ReactMarkdown>{result.answer}</ReactMarkdown>
          </div>
          {/* A KPI card can only ever represent one row; guard against a
              multi-row result being mislabeled and silently showing just
              the first record. */}
          {result.visualization === "kpi" && (result.rows.length <= 1 ? <KpiCard rows={result.rows} /> : <ResultChart rows={result.rows} />)}
          {result.visualization === "donut" && <DonutChart rows={result.rows} />}
        </>
      )}
      {showingChart && (result.visualization === "donut" ? <DonutChart rows={result.rows} /> : <ResultChart rows={result.rows} />)}
      {showingTable && (
        <>
          <div className="text-xs text-stone-500 dark:text-stone-400">
            {result.rows.length.toLocaleString()} {result.rows.length === 1 ? "result" : "results"}
          </div>
          <ResultTable rows={result.rows} />
        </>
      )}

      <div className="flex flex-wrap items-center gap-1.5 border-t border-stone-100 pt-2.5 dark:border-stone-800">
        {(result.visualization === "chart" || result.visualization === "donut" || result.visualization === "table") && (
          <ToolbarButton onClick={onToggleView} label={showingTable || showingChart ? "Summary" : result.visualization === "table" ? "Table" : "Chart"}>
            {showingTable || showingChart || result.visualization !== "table" ? <ChartIcon width={14} height={14} /> : <TableIcon width={14} height={14} />}
          </ToolbarButton>
        )}
        <ToolbarButton onClick={() => navigator.clipboard?.writeText(result.answer)} label="Copy">
          <CopyIcon width={14} height={14} />
        </ToolbarButton>
        <ToolbarButton onClick={onRegenerate} label="Regenerate">
          <RefreshIcon width={14} height={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => onFeedback("up")}
          label="Helpful"
          active={feedback === "up"}
          activeClass="text-amber-600 dark:text-amber-400"
        >
          <ThumbsUpIcon width={14} height={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => onFeedback("down")}
          label="Not helpful"
          active={feedback === "down"}
          activeClass="text-rose-600 dark:text-rose-400"
        >
          <ThumbsDownIcon width={14} height={14} />
        </ToolbarButton>
        <details className="group ml-auto">
          <summary className="cursor-pointer select-none list-none rounded-md px-2 py-1 font-mono text-[11px] text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200">
            View SQL
          </summary>
          <pre className="mt-2 max-w-full overflow-x-auto whitespace-pre-wrap rounded-lg bg-stone-900 p-3 text-left text-xs text-stone-100 dark:bg-black">{result.sql}</pre>
        </details>
      </div>
    </div>
  );
}

function ToolbarButton({
  children,
  label,
  onClick,
  active,
  activeClass,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  activeClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100 ${active ? activeClass : ""}`}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
