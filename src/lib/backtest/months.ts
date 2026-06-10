/**
 * MonthKey ("YYYY-MM") helpers. Plain string math — no Date objects, no
 * timezone exposure.
 */
import type { MonthKey } from "./types";

export function makeMonthKey(year: number, month: number): MonthKey {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function parseMonthKey(key: MonthKey): { year: number; month: number } {
  const [y, m] = key.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) {
    throw new Error(`parseMonthKey: invalid month key "${key}"`);
  }
  return { year: y, month: m };
}

export function nextMonthKey(key: MonthKey): MonthKey {
  const { year, month } = parseMonthKey(key);
  return month === 12 ? makeMonthKey(year + 1, 1) : makeMonthKey(year, month + 1);
}

/** Inclusive range. Throws if start > end (string compare works for YYYY-MM). */
export function enumerateMonths(start: MonthKey, end: MonthKey): MonthKey[] {
  parseMonthKey(start);
  parseMonthKey(end);
  if (start > end) {
    throw new Error(`enumerateMonths: start ${start} is after end ${end}`);
  }
  const out: MonthKey[] = [];
  let cur = start;
  while (cur <= end) {
    out.push(cur);
    cur = nextMonthKey(cur);
  }
  return out;
}
