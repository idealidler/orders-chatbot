import { formatColumnName, formatValue, pickMetricColumn } from "../utils/format";
import { ChartEmptyState } from "./ChartEmptyState";

export type KpiMetric = { label: string; value: unknown; valueColumn?: string; comparisonValue?: number | null };

export function KpiCard({ rows, metric }: { rows?: unknown; metric?: KpiMetric }) {
  const row = Array.isArray(rows) && rows[0] && typeof rows[0] === "object" && !Array.isArray(rows[0]) ? rows[0] as Record<string, unknown> : null;
  if (!metric && !row) return <ChartEmptyState />;

  const metricColumn = row ? pickMetricColumn(row) : null;
  const valueColumn = metric?.valueColumn ?? metricColumn ?? "value";
  const value = metric ? metric.value : metricColumn && row ? row[metricColumn] : undefined;
  if (value === undefined || value === null) return <ChartEmptyState />;
  const label = metric?.label ?? formatColumnName(valueColumn || "Result");
  const comparison = metric?.comparisonValue;
  const numericValue = typeof value === "number" && Number.isFinite(value) ? value : null;
  const change = comparison !== null && comparison !== undefined && numericValue !== null && Number.isFinite(comparison) && comparison !== 0 ? ((numericValue - comparison) / Math.abs(comparison)) * 100 : null;
  const positive = (change ?? 0) >= 0;

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-stone-200/70 dark:bg-stone-900 dark:ring-stone-800" aria-label={label}>
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">{label}</p>
      <p className="mt-3 text-4xl font-bold tracking-tight tabular-nums text-stone-900 dark:text-white">
        {formatValue(value, valueColumn)}
      </p>
      {change !== null && <p className={`mt-4 inline-flex items-center gap-1 text-xs font-medium ${positive ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}><span aria-hidden="true">{positive ? "↑" : "↓"}</span>{Math.abs(change).toFixed(1)}% vs comparison period</p>}
    </section>
  );
}
