import { formatCompactValue } from "../utils/format";
import { ChartEmptyState } from "./ChartEmptyState";
import { mapRowsToChartData } from "./chartData";

const COLORS = ["#b45309", "#d97706", "#78716c", "#f59e0b", "#a8a29e", "#92400e"];
const CX = 145, CY = 125, R = 68, INNER = 42;
function point(angle: number, radius: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return { x: CX + radius * Math.cos(radians), y: CY + radius * Math.sin(radians) };
}
function arc(start: number, end: number) {
  const a = point(start, R), b = point(end, R), c = point(end, INNER), d = point(start, INNER), large = end - start > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${R} ${R} 0 ${large} 1 ${b.x} ${b.y} L ${c.x} ${c.y} A ${INNER} ${INNER} 0 ${large} 0 ${d.x} ${d.y} Z`;
}

/** Reusable categorical part-to-whole chart with callout labels and a compact legend. */
export function DonutChart({ rows }: { rows: unknown }) {
  const chart = mapRowsToChartData(rows, 6);
  const total = chart?.data.reduce((sum, datum) => sum + datum.value, 0) ?? 0;
  if (!chart || total <= 0) return <ChartEmptyState />;
  const slices = chart.data.map((datum, index) => {
    const start = chart.data.slice(0, index).reduce((sum, item) => sum + (item.value / total) * 360, 0);
    const end = start + (datum.value / total) * 360;
    return { ...datum, start, end, color: COLORS[index % COLORS.length] };
  });
  return (
    <figure className="rounded-xl bg-white p-4 dark:bg-stone-900" aria-label={`Donut chart: ${chart.title}`}>
      <figcaption className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500">{chart.title}</figcaption>
      <svg viewBox="0 0 330 250" className="mx-auto block w-full max-w-md overflow-visible" role="img" aria-label={chart.title}>
        {slices.map((slice) => {
          const mid = (slice.start + slice.end) / 2, edge = point(mid, R + 2), elbow = point(mid, R + 18), right = elbow.x >= CX, labelX = right ? 305 : 25;
          return <g key={slice.label}>
            <path d={arc(slice.start, slice.end)} fill={slice.color} stroke="white" strokeWidth="2" />
            <path d={`M ${edge.x} ${edge.y} L ${elbow.x} ${elbow.y} L ${labelX} ${elbow.y}`} fill="none" stroke="currentColor" className="text-stone-300 dark:text-stone-600" strokeWidth="1" />
            <text x={labelX + (right ? 3 : -3)} y={elbow.y - 2} textAnchor={right ? "start" : "end"} className="fill-stone-600 text-[9px] dark:fill-stone-300">{`${((slice.value / total) * 100).toFixed(0)}% · ${formatCompactValue(slice.value, chart.valueColumn)}`}</text>
          </g>;
        })}
        <text x={CX} y={CY - 3} textAnchor="middle" className="fill-stone-400 text-[9px] uppercase tracking-wide dark:fill-stone-500">Total</text>
        <text x={CX} y={CY + 12} textAnchor="middle" className="fill-stone-800 text-[13px] font-semibold dark:fill-stone-100">{formatCompactValue(total, chart.valueColumn)}</text>
      </svg>
      <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs text-stone-600 dark:text-stone-300" aria-label="Chart legend">
        {slices.map((slice) => <li key={slice.label} className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ backgroundColor: slice.color }} />{slice.label}</li>)}
      </ul>
    </figure>
  );
}
