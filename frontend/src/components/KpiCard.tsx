import { formatColumnName, formatValue, pickMetricColumn } from "../utils/format";
import { SparklesIcon } from "./icons";

export function KpiCard({ rows }: { rows: Record<string, unknown>[] }) {
  const row = rows[0];
  if (!row) return <p className="text-sm text-slate-500 dark:text-slate-400">No matching records were found.</p>;

  const metricColumn = pickMetricColumn(row);
  const otherColumns = Object.keys(row).filter((column) => column !== metricColumn);
  const label = otherColumns.length
    ? otherColumns.map((column) => formatValue(row[column], column)).join(" · ")
    : formatColumnName(metricColumn ?? "Result");
  const value = metricColumn ? row[metricColumn] : Object.values(row)[0];
  const valueColumn = metricColumn ?? Object.keys(row)[0] ?? "";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/50 dark:to-teal-950/30">
      <SparklesIcon className="absolute -right-2 -top-2 h-16 w-16 text-emerald-200/60 dark:text-emerald-800/40" />
      <p className="relative text-xs font-semibold uppercase tracking-wide text-emerald-800/80 dark:text-emerald-300">
        {label}
      </p>
      <p className="relative mt-2 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
        {formatValue(value, valueColumn)}
      </p>
      <p className="relative mt-2 text-xs font-medium text-emerald-800/70 dark:text-emerald-400">
        Verified from the orders warehouse
      </p>
    </div>
  );
}
