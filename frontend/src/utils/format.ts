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

// Columns that are numeric but represent a dimension (a year, an id) rather
// than the aggregate metric a KPI card or chart bar should be measuring.
// These should never get a thousands separator — "2,024" is not a year.
const DIMENSION_COLUMN_PATTERN = /(^|_)(year|month|day|quarter|id)$/i;

// Columns that hold a monetary value, regardless of how the LLM aliased the
// aggregate (total_revenue, avg_price, etc.) — always rendered with a
// leading $ and at most one decimal place.
const CURRENCY_COLUMN_PATTERN = /revenue|price|amount|cost|sales/i;

export function isCurrencyColumn(column: string): boolean {
  return CURRENCY_COLUMN_PATTERN.test(column);
}

export function formatValue(value: unknown, column: string) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    if (DIMENSION_COLUMN_PATTERN.test(column)) {
      return Math.round(value).toString();
    }
    if (isCurrencyColumn(column)) {
      return `$${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}`;
    }
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

/** Compact formatting for axis scale labels (e.g. "1.2K"), with the same
 * currency prefix and decimal cap as formatValue. */
export function formatCompactValue(value: number, column: string) {
  const formatted = value.toLocaleString(undefined, { maximumFractionDigits: 1, notation: "compact" });
  return isCurrencyColumn(column) ? `$${formatted}` : formatted;
}

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

