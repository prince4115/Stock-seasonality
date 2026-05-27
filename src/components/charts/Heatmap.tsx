/**
 * Colorblind-friendly diverging blue↔orange heatmap. Server-renderable
 * (no client JS) — uses CSS grid plus computed RGB cell backgrounds.
 *
 * `rows` is a list of row labels + numeric values (one per column).
 * Sample-size cells (n=0) render as a hatched neutral block so the
 * "we have no data" case is visually distinct from "0% return".
 */
import { divergingColor, textOnBackground } from "@/lib/colors";

export type HeatmapRow = {
  label: string;
  /** Display values, one per column. null/undefined = no data. */
  values: Array<number | null | undefined>;
  /** Optional per-cell sample size; rendered in a tooltip. */
  sampleSizes?: number[];
};

type Props = {
  rows: HeatmapRow[];
  colLabels: string[];
  /** Cap absolute value for color scaling. Defaults to the max abs value in data. */
  scaleMax?: number;
  /** Format a number for display. Defaults to "+12.3%" / "-5.6%". */
  formatValue?: (v: number) => string;
  /** Caption shown above the grid for legend (e.g., "month × year"). */
  caption?: string;
};

const defaultFormat = (v: number) => `${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)}%`;

export function Heatmap({
  rows,
  colLabels,
  scaleMax,
  formatValue = defaultFormat,
  caption,
}: Props) {
  const allValues = rows
    .flatMap((r) => r.values)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  const computedScaleMax = scaleMax ?? Math.max(0.01, ...allValues.map((v) => Math.abs(v)));

  return (
    <div className="overflow-x-auto">
      {caption ? <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">{caption}</p> : null}
      <div
        role="table"
        className="inline-grid gap-px rounded-md border border-zinc-200 bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-700"
        style={{
          gridTemplateColumns: `minmax(60px, auto) repeat(${colLabels.length}, minmax(48px, 1fr))`,
        }}
      >
        {/* Header row */}
        <div
          role="columnheader"
          className="bg-white px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
        >
          &nbsp;
        </div>
        {colLabels.map((c) => (
          <div
            key={c}
            role="columnheader"
            className="bg-white px-2 py-1 text-center text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
          >
            {c}
          </div>
        ))}

        {/* Data rows */}
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <div
              role="rowheader"
              className="bg-white px-2 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              {row.label}
            </div>
            {row.values.map((v, i) => {
              const sample = row.sampleSizes?.[i];
              const hasData = typeof v === "number" && Number.isFinite(v);
              if (!hasData) {
                return (
                  <div
                    key={i}
                    role="cell"
                    title="no data"
                    className="bg-zinc-50 text-[10px] text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600"
                    style={{ textAlign: "center", padding: "6px 4px" }}
                  >
                    —
                  </div>
                );
              }
              const bg = divergingColor(v, computedScaleMax);
              const fg = textOnBackground(v, computedScaleMax);
              const tooltip = sample != null ? `${formatValue(v)} · n=${sample}` : formatValue(v);
              return (
                <div
                  key={i}
                  role="cell"
                  title={tooltip}
                  style={{ background: bg, color: fg, padding: "6px 4px" }}
                  className="text-center text-[11px] font-medium tabular-nums"
                >
                  {formatValue(v)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
