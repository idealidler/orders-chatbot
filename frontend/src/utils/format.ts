export function timeLabel(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function formatColumnName(column: string) {
  return column
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bId\b/g, "ID")
    .replace(/\bSk\b/g, "SK");
}

export function formatValue(value: unknown, column: string) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    return value.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (column.endsWith("_date") && typeof value === "string") {
    const date = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  }
  return String(value);
}

// Columns that are numeric but represent a dimension (a year, an id) rather
// than the aggregate metric a KPI card or chart bar should be measuring.
const DIMENSION_COLUMN_PATTERN = /(^|_)(year|month|day|quarter|id)$/i;

function isMeasure(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

/** Pick the column that best represents the metric to highlight for a row,
 * preferring numeric columns that aren't obviously a date/id dimension. */
export function pickMetricColumn(row: Record<string, unknown>): string | null {
  const entries = Object.entries(row);
  if (!entries.length) return null;
  const numericEntries = entries.filter(([, value]) => isMeasure(value));
  const nonDimensionNumeric = numericEntries.filter(([column]) => !DIMENSION_COLUMN_PATTERN.test(column));
  if (nonDimensionNumeric.length) return nonDimensionNumeric[nonDimensionNumeric.length - 1][0];
  if (numericEntries.length) return numericEntries[numericEntries.length - 1][0];
  return entries[entries.length - 1][0];
}
