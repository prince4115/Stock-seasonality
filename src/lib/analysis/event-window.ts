/**
 * Event-window returns.
 *
 * For an event date T, compute the return in three trading-day windows:
 *   PRE30_PRE7  : T-30 → T-7   (the run-up)
 *   PRE7_EVENT  : T-7  → T     (the week leading in)
 *   EVENT_POST7 : T    → T+7   (the week after)
 *
 * "Trading day" means index in the bars array, so weekends/holidays are
 * skipped naturally (yfinance only returns trading days). When an event
 * falls on a non-trading day we anchor at the first trading day on or after
 * the event date — the typical event-study convention.
 */
import type { EventScore, EventWindowKind, PriceBar } from "./types";
import { fractionGreaterThan, isCovidYear, mean, pctReturn, sortBars } from "./returns";

const WINDOW_OFFSETS: Record<EventWindowKind, [number, number]> = {
  PRE30_PRE7: [-30, -7],
  PRE7_EVENT: [-7, 0],
  EVENT_POST7: [0, 7],
};

/**
 * Binary-search the first bar whose date >= target. Returns -1 if no bar
 * is on or after the target (i.e., the target is past the end of data).
 *
 * Assumes `bars` is sorted ascending by date.
 */
export function indexAtOrAfter(bars: PriceBar[], target: Date): number {
  const t = target.getTime();
  let lo = 0;
  let hi = bars.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (bars[mid].date.getTime() < t) lo = mid + 1;
    else hi = mid;
  }
  return lo < bars.length ? lo : -1;
}

/**
 * Event-window return for one occurrence. Trading-day offsets, anchored at
 * the first bar on/after eventDate. Returns null when either anchor falls
 * outside the available bars or the start anchor's price is zero.
 */
export function eventWindowReturn(
  bars: PriceBar[],
  eventDate: Date,
  kind: EventWindowKind,
): number | null {
  if (bars.length === 0) return null;
  const eventIdx = indexAtOrAfter(bars, eventDate);
  if (eventIdx === -1) return null;

  const [startOffset, endOffset] = WINDOW_OFFSETS[kind];
  const startIdx = eventIdx + startOffset;
  const endIdx = eventIdx + endOffset;
  if (startIdx < 0 || endIdx >= bars.length) return null;
  const startBar = bars[startIdx];
  const endBar = bars[endIdx];
  if (startBar.adjClose === 0) return null;
  return pctReturn(startBar.adjClose, endBar.adjClose);
}

/**
 * Aggregate across N occurrences of a festival. Returns the standard
 * (avgReturn, pctYearsPositive, sampleSize) triple. `bars` may be
 * unsorted; we sort defensively.
 */
export function aggregateEventWindow(
  bars: PriceBar[],
  festivalSlug: string,
  eventDates: Date[],
  kind: EventWindowKind,
  excludeCovid: boolean,
): EventScore {
  const sorted = sortBars(bars);
  const returns: number[] = [];
  for (const date of eventDates) {
    if (excludeCovid && isCovidYear(date)) continue;
    const ret = eventWindowReturn(sorted, date, kind);
    if (ret !== null) returns.push(ret);
  }
  if (returns.length === 0) {
    return {
      festivalSlug,
      windowKind: kind,
      avgReturn: 0,
      pctYearsPositive: 0,
      sampleSize: 0,
    };
  }
  return {
    festivalSlug,
    windowKind: kind,
    avgReturn: mean(returns),
    pctYearsPositive: fractionGreaterThan(returns, 0),
    sampleSize: returns.length,
  };
}
