/**
 * Pure return-math helpers. No I/O, no Prisma. Tested independently.
 */
import type { PriceBar } from "./types";

/** Simple percent return: (end - start) / start. */
export function pctReturn(start: number, end: number): number {
  if (!Number.isFinite(start) || start === 0) {
    throw new Error(`pctReturn: invalid start ${start}`);
  }
  if (!Number.isFinite(end)) {
    throw new Error(`pctReturn: invalid end ${end}`);
  }
  return (end - start) / start;
}

/** UTC month key "YYYY-MM" — month is 1-indexed in the output string. */
export function monthKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

/**
 * Group bars by UTC month. Preserves input order within each group; pass
 * pre-sorted bars (or call sortBars first) so first/last semantics are
 * meaningful.
 */
export function groupByMonth(bars: PriceBar[]): Map<string, PriceBar[]> {
  const out = new Map<string, PriceBar[]>();
  for (const bar of bars) {
    const key = monthKey(bar.date);
    const arr = out.get(key);
    if (arr) arr.push(bar);
    else out.set(key, [bar]);
  }
  return out;
}

/**
 * Monthly return = first bar's adjClose -> last bar's adjClose.
 * Returns null when there are fewer than 2 bars (no return computable).
 */
export function monthlyReturn(barsInMonth: PriceBar[]): number | null {
  if (barsInMonth.length < 2) return null;
  const first = barsInMonth[0];
  const last = barsInMonth[barsInMonth.length - 1];
  if (first.adjClose === 0) return null;
  return pctReturn(first.adjClose, last.adjClose);
}

/** Defensive ascending sort by date. Returns a new array. */
export function sortBars(bars: PriceBar[]): PriceBar[] {
  return [...bars].sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** True iff bar.date falls in [start, end] (both inclusive, UTC midnight). */
export function inDateRange(bar: PriceBar, start: Date, end: Date): boolean {
  const t = bar.date.getTime();
  return t >= start.getTime() && t <= end.getTime();
}

/** UTC date `years` years before `asOf` (same month/day). Handles Feb 29. */
export function yearsBefore(asOf: Date, years: number): Date {
  const d = new Date(asOf.getTime());
  d.setUTCFullYear(d.getUTCFullYear() - years);
  return d;
}

/** True if date falls in 2020 or 2021 (the COVID toggle range from the brief). */
export function isCovidYear(date: Date): boolean {
  const y = date.getUTCFullYear();
  return y === 2020 || y === 2021;
}

/** Mean of an array. Throws on empty (you should check sampleSize first). */
export function mean(xs: number[]): number {
  if (xs.length === 0) throw new Error("mean: empty array");
  let sum = 0;
  for (const x of xs) sum += x;
  return sum / xs.length;
}

/** Fraction of values strictly greater than threshold (0..1). */
export function fractionGreaterThan(xs: number[], threshold: number): number {
  if (xs.length === 0) return 0;
  let n = 0;
  for (const x of xs) if (x > threshold) n++;
  return n / xs.length;
}
