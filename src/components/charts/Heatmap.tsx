/**
 * Colorblind-friendly diverging blue↔orange heatmap. Server-renderable
 * (no client JS) — uses CSS grid plus computed RGB cell backgrounds.
 *
 * Mobile fixes (Phase 6):
 *   - First column (row labels) is sticky-left so the user keeps context
 *     while scrolling horizontally.
 *   - Cells shrink on small viewports (smaller padding + 10px text).
 *   - Edge gradient shadows hint that content scrolls when overflow happens.
 *
 * `rows` is a list of row labels + numeric values (one per column).
 * Sample-size cells (n=0) render as a neutral block so the "we have no data"
 * case is visually distinct from "0% return".
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
    <div className="relative">
      {caption ? <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">{caption}</p> : null}

      {/* Wrapper handles horizontal scroll. Edge shadows hint at scrollability. */}
      <div className="relative overflow-x-auto">
        <div
          role="table"
          className="inline-grid gap-px rounded-md border border-zinc-200 bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-700"
          style={{
            gridTemplateColumns: `minmax(64px, max-content) repeat(${colLabels.length}, minmax(36px, 1fr))`,
          }}
        >
          {/* Top-left corner — sticky so it stays visible during horizontal scroll */}
          <div
            role="columnheader"
            className="sticky left-0 z-10 bg-white px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
          >
            &nbsp;
          </div>
          {colLabels.map((c) => (
            <div
              key={c}
              role="columnheader"
              className="bg-white px-1.5 py-1 text-center text-[10px] font-medium uppercase tracking-wider text-zinc-500 sm:px-2 dark:bg-zinc-900 dark:text-zinc-400"
            >
              {c}
            </div>
          ))}

          {/* Data rows */}
          {rows.map((row) => (
            <div key={row.label} className="contents">
              <div
                role="rowheader"
                className="sticky left-0 z-10 bg-white px-2 py-1 text-xs font-medium text-zinc-700 shadow-[1px_0_0_0_rgba(0,0,0,0.04)] dark:bg-zinc-900 dark:text-zinc-200 dark:shadow-[1px_0_0_0_rgba(255,255,255,0.06)]"
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
                      className="bg-zinc-50 px-1 py-1.5 text-center text-[10px] text-zinc-400 sm:px-1.5 sm:py-1.5 dark:bg-zinc-900 dark:text-zinc-600"
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
                    style={{ background: bg, color: fg }}
                    className="px-1 py-1.5 text-center text-[10px] font-medium tabular-nums sm:px-2 sm:py-1.5 sm:text-[11px]"
                  >
                    {formatValue(v)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Right-edge fade — only visible on small screens with overflow.
            Pointer-events-none so it doesn't block scroll. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent sm:hidden dark:from-zinc-950"
        />
      </div>

      <p className="mt-1.5 text-[10px] text-zinc-400 sm:hidden dark:text-zinc-500">
        Swipe horizontally to see all columns
      </p>
    </div>
  );
}
