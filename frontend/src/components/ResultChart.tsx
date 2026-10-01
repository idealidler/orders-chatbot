import { formatCompactValue } from "../utils/format";
import { ChartEmptyState } from "./ChartEmptyState";
import { mapRowsToChartData } from "./chartData";

const BAR_COLORS = ["bg-amber-600", "bg-amber-500", "bg-stone-700", "bg-amber-400"];

const GRID_STEPS = 4;

export function ResultChart({ rows }: { rows: unknown }) {
  const chart = mapRowsToChartData(rows);
  if (!chart) return <ChartEmptyState />;
  const max = Math.max(...chart.data.map(({ value }) => value), 1);
  const gridLines = Array.from({ length: GRID_STEPS + 1 }, (_, i) => (max / GRID_STEPS) * (GRID_STEPS - i));

  return (
    <div
      className="rounded-xl bg-white p-4 dark:bg-stone-900"
      role="img"
      aria-label={`Chart of ${chart.title}`}
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500">
        {chart.title}
      </p>
      <div className="grid grid-cols-[3rem_1fr] gap-2">
        <div className="flex h-60 flex-col justify-between pb-6 text-right text-[10px] text-stone-400 dark:text-stone-500">
          {gridLines.map((value) => (
            <span key={value}>{formatCompactValue(value, chart.valueColumn)}</span>
          ))}
        </div>
        <div className="relative h-60 border-b border-l border-stone-200 dark:border-stone-700">
          <div className="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between">
            {gridLines.map((value, i) => (
              <div key={value} className={i === gridLines.length - 1 ? "" : "border-t border-dashed border-stone-200/80 dark:border-stone-700/70"} />
            ))}
          </div>
          <div className="relative flex h-[calc(100%-1.5rem)] items-end gap-2 px-2 sm:gap-3 sm:px-3">
            {chart.data.map((datum, index) => {
              const heightPct = datum.value === 0 ? 0 : Math.max((datum.value / max) * 100, 2);
              return (
                <div key={`${datum.label}-${index}`} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
                  <span className="mb-1 max-w-full truncate text-center text-[10px] font-medium tabular-nums text-stone-700 dark:text-stone-200" title={datum.formattedValue}>
                    {datum.formattedValue}
                  </span>
                  <div
                    className={`w-full min-w-1 rounded-t-sm ${BAR_COLORS[index % BAR_COLORS.length]} transition-all duration-500`}
                    style={{ height: `${heightPct}%` }}
                    aria-label={`${datum.label}: ${datum.formattedValue}`}
                  />
                </div>
              );
            })}
          </div>
          <div className="absolute inset-x-0 bottom-0 flex h-6 gap-2 px-2 sm:gap-3 sm:px-3">
            {chart.data.map((datum, index) => (
              <span key={`${datum.label}-${index}`} className="flex-1 truncate pt-1 text-center text-[10px] text-stone-500 dark:text-stone-400" title={datum.label}>
                {datum.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
