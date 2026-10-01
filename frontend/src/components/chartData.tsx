import { formatColumnName, formatValue, pickMetricColumn } from "../utils/format";

export type ChartDatum = { label: string; value: number; formattedValue: string };
export type ChartData = { labelColumn: string; valueColumn: string; title: string; data: ChartDatum[] };
type UnknownRow = Record<string, unknown>;

function isRow(value: unknown): value is UnknownRow {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Converts an untrusted result payload into the exact shape chart components render. */
export function mapRowsToChartData(rows: unknown, limit = 12): ChartData | null {
  if (!Array.isArray(rows)) return null;
  const firstRow = rows.find(isRow);
  if (!firstRow) return null;
  const columns = Object.keys(firstRow);
  const valueColumn = pickMetricColumn(firstRow) ?? columns[1] ?? columns[0];
  const labelColumn = columns.find((column) => column !== valueColumn) ?? columns[0];
  if (!valueColumn || !labelColumn || valueColumn === labelColumn) return null;
  const data = rows.filter(isRow).slice(0, limit).map((row) => {
    const value = row[valueColumn];
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
    return { label: formatValue(row[labelColumn], labelColumn), value, formattedValue: formatValue(value, valueColumn) };
  }).filter((datum): datum is ChartDatum => datum !== null);
  if (!data.length) return null;
  return { labelColumn, valueColumn, title: `${formatColumnName(valueColumn)} by ${formatColumnName(labelColumn)}`, data };
}
