import { formatColumnName, formatValue, pickMetricColumn } from "../utils/format";

export function KpiCard({ rows }: { rows: Record<string, unknown>[] }) {
  const row = rows[0];
  if (!row) return <p className="text-sm text-stone-500 dark:text-stone-400">No matching records were found.</p>;

  const metricColumn = pickMetricColumn(row);
  const otherColumns = Object.keys(row).filter((column) => column !== metricColumn);
  const label = otherColumns.length
    ? otherColumns.map((column) => formatValue(row[column], column)).join(" · ")
    : formatColumnName(metricColumn ?? "Result");
  const value = metricColumn ? row[metricColumn] : Object.values(row)[0];
  const valueColumn = metricColumn ?? Object.keys(row)[0] ?? "";

  return (
    <div className="rounded-xl border border-stone-200 border-l-4 border-l-amber-500 bg-white p-5 shadow-sm dark:border-stone-800 dark:border-l-amber-500 dark:bg-stone-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">{label}</p>
      <p className="mt-2 text-4xl font-bold tracking-tight text-stone-900 dark:text-white">
        {formatValue(value, valueColumn)}
      </p>
      <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-500">Verified from the orders warehouse</p>
    </div>
  );
}
