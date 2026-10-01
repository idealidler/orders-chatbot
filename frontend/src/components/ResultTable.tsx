import { useState } from "react";
import { formatColumnName, formatValue } from "../utils/format";
import { DownloadIcon } from "./icons";

export function ResultTable({ rows }: { rows: Record<string, unknown>[] }) {
  const [sort, setSort] = useState<{ column: string; direction: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(0);

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        No matching records were found.
      </p>
    );
  }

  const pageSize = 10;
  const columns = Object.keys(rows[0]);
  const sortedRows = sort
    ? [...rows].sort((a, b) => {
        const left = String(a[sort.column] ?? "");
        const right = String(b[sort.column] ?? "");
        return left.localeCompare(right, undefined, { numeric: true }) * (sort.direction === "asc" ? 1 : -1);
      })
    : rows;
  const pageCount = Math.ceil(sortedRows.length / pageSize);
  const visibleRows = sortedRows.slice(page * pageSize, (page + 1) * pageSize);

  function toggleSort(column: string) {
    setPage(0);
    setSort((current) =>
      current?.column === column
        ? { column, direction: current.direction === "asc" ? "desc" : "asc" }
        : { column, direction: "asc" },
    );
  }

  function exportCsv() {
    const csv = [columns, ...sortedRows.map((row) => columns.map((column) => JSON.stringify(row[column] ?? "")))]
      .map((line) => line.join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "orders-results.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      {rows.length > 100 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          Large result set — showing {pageSize} rows at a time.
        </p>
      )}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="font-medium">{rows.length.toLocaleString()} results</span>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <DownloadIcon width={14} height={14} /> Export CSV
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/80">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  scope="col"
                  className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:text-slate-300"
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(col)}
                    className="inline-flex items-center gap-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    {formatColumnName(col)}
                    <span className="text-slate-400">{sort?.column === col ? (sort.direction === "asc" ? "↑" : "↓") : "↕"}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-slate-100 transition-colors last:border-b-0 even:bg-slate-50/60 hover:bg-emerald-50/60 dark:border-slate-800 dark:even:bg-slate-800/40 dark:hover:bg-slate-800"
              >
                {columns.map((col) => (
                  <td key={col} className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-200">
                    {formatValue(row[col], col)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Page {page + 1} of {pageCount}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="rounded-md border border-slate-200 px-2.5 py-1 font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page === pageCount - 1}
              onClick={() => setPage(page + 1)}
              className="rounded-md border border-slate-200 px-2.5 py-1 font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
