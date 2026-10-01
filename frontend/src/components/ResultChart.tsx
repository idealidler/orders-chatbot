import { formatColumnName, formatValue, pickMetricColumn } from "../utils/format";

const BAR_COLORS = [
  "from-emerald-500 to-teal-400",
  "from-sky-500 to-indigo-400",
  "from-violet-500 to-fuchsia-400",
  "from-amber-500 to-orange-400",
];

const GRID_STEPS = 4;

export function ResultChart({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows.length) return <p className="text-sm text-slate-500 dark:text-slate-400">No matching records were found.</p>;
  const columns = Object.keys(rows[0]);
  const valueColumn = pickMetricColumn(rows[0]) ?? columns[1] ?? columns[0];
  const labelColumn = columns.find((column) => column !== valueColumn) ?? columns[0];
  const bars = rows.slice(0, 12);
  const max = Math.max(...bars.map((row) => Number(row[valueColumn]) || 0), 1);
  const gridLines = Array.from({ length: GRID_STEPS + 1 }, (_, i) => (max / GRID_STEPS) * (GRID_STEPS - i));

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      role="img"
      aria-label={`Chart of ${formatColumnName(valueColumn)} by ${formatColumnName(labelColumn)}`}
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {formatColumnName(valueColumn)} by {formatColumnName(labelColumn)}
      </p>
      <div className="grid grid-cols-[2.5rem_1fr] gap-2">
        <div className="flex h-52 flex-col justify-between py-0.5 text-right text-[10px] text-slate-400 dark:text-slate-500">
          {gridLines.map((value, i) => (
            <span key={i}>{value.toLocaleString(undefined, { maximumFractionDigits: 1, notation: "compact" })}</span>
          ))}
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute inset-0 flex h-52 flex-col justify-between">
            {gridLines.map((_, i) => (
              <div key={i} className="border-t border-slate-100 dark:border-slate-800" />
            ))}
          </div>
          <div className="relative flex h-52 items-end gap-2 sm:gap-3">
            {bars.map((row, index) => {
              const value = Number(row[valueColumn]) || 0;
              const heightPct = Math.max((value / max) * 100, value > 0 ? 2 : 0);
              return (
                <div key={index} className="group relative flex h-full flex-1 flex-col items-center justify-end">
                  <span className="mb-1 whitespace-nowrap rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-medium text-white opacity-0 shadow transition group-hover:opacity-100 dark:bg-slate-700">
                    {formatValue(value, valueColumn)}
                  </span>
                  <div
                    className={`w-full rounded-t-md bg-gradient-to-t ${BAR_COLORS[index % BAR_COLORS.length]} transition-all duration-500`}
                    style={{ height: `${heightPct}%` }}
                    title={`${formatValue(row[labelColumn], labelColumn)}: ${formatValue(value, valueColumn)}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-[2.5rem_1fr] gap-2">
        <div />
        <div className="flex gap-2 sm:gap-3">
          {bars.map((row, index) => (
            <span
              key={index}
              className="flex-1 truncate text-center text-[11px] text-slate-500 dark:text-slate-400"
              title={formatValue(row[labelColumn], labelColumn)}
            >
              {formatValue(row[labelColumn], labelColumn)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

