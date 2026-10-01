import { formatColumnName, formatValue } from "../utils/format";

const BAR_COLORS = [
  "from-emerald-500 to-teal-500",
  "from-sky-500 to-indigo-500",
  "from-violet-500 to-fuchsia-500",
  "from-amber-500 to-orange-500",
];

export function ResultChart({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows.length) return <p className="text-sm text-slate-500 dark:text-slate-400">No matching records were found.</p>;
  const columns = Object.keys(rows[0]);
  const valueColumn = columns.find((column) => typeof rows[0][column] === "number") ?? columns[1];
  const max = Math.max(...rows.map((row) => Number(row[valueColumn]) || 0), 1);

  return (
    <div
      className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      role="img"
      aria-label={`Chart of ${formatColumnName(valueColumn)}`}
    >
      {rows.slice(0, 12).map((row, index) => {
        const value = Number(row[valueColumn]) || 0;
        const widthPct = Math.max((value / max) * 100, 3);
        return (
          <div key={index} className="grid grid-cols-[minmax(80px,1fr)_3fr_auto] items-center gap-3 text-sm">
            <span className="truncate text-slate-600 dark:text-slate-300" title={formatValue(row[columns[0]], columns[0])}>
              {formatValue(row[columns[0]], columns[0])}
            </span>
            <div className="h-3.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${BAR_COLORS[index % BAR_COLORS.length]} transition-all duration-500`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
              {formatValue(row[valueColumn], valueColumn)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
