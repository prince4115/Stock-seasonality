/**
 * Monthly seasonality scoring.
 *
 * For a stock's adjusted-close history, this module computes, per calendar
 * month (1..12), the average monthly return, the fraction of years it was
 * positive, the fraction that beat the stock's overall mean, and the sample
 * size — over a configurable trailing window (5y / 10y / 15y) with an
 * optional COVID-years exclusion toggle.
 *
 * All pure functions; no Prisma, no I/O. The DB orchestrator
 * (src/lib/analysis/run.ts) feeds in plain PriceBar[].
 */
import type { MonthScore, PriceBar, SeasonalityOptions } from "./types";
import {
  fractionGreaterThan,
  groupByMonth,
  inDateRange,
  isCovidYear,
  mean,
  monthlyReturn,
  sortBars,
  yearsBefore,
} from "./returns";

/**
 * Apply the trailing-window filter and (optionally) drop COVID years.
 * Returns a new array; never mutates input.
 */
export function filterToWindow(bars: PriceBar[], options: SeasonalityOptions): PriceBar[] {
  const windowStart = yearsBefore(options.asOf, options.windowYears);
  return bars.filter((bar) => {
    if (!inDateRange(bar, windowStart, options.asOf)) return false;
    if (options.excludeCovid && isCovidYear(bar.date)) return false;
    return true;
  });
}

/**
 * Compute monthly return for every (year, month) bucket present in `bars`.
 * Keys are "YYYY-MM"; months with fewer than 2 bars are skipped.
 */
export function monthlyReturnsByMonthKey(bars: PriceBar[]): Map<string, number> {
  const sorted = sortBars(bars);
  const grouped = groupByMonth(sorted);
  const out = new Map<string, number>();
  for (const [key, monthBars] of grouped) {
    const ret = monthlyReturn(monthBars);
    if (ret !== null) out.set(key, ret);
  }
  return out;
}

/**
 * Per-calendar-month seasonality scores. Always returns 12 entries even for
 * months with sampleSize == 0; the consumer decides how to render empty
 * cells. avgReturn/pct fields default to 0 when sampleSize is 0 — the
 * sampleSize gate is the source of truth.
 *
 * `pctYearsBeatMean` compares against the stock's overall mean monthly
 * return *within the same window* — the brief's "beat the stock's overall
 * mean". Per-month means would be self-referential (every month beats its
 * own mean ~50% of the time by definition).
 */
export function computeSeasonality(bars: PriceBar[], options: SeasonalityOptions): MonthScore[] {
  const filtered = filterToWindow(bars, options);
  const byKey = monthlyReturnsByMonthKey(filtered);

  const allReturns = Array.from(byKey.values());
  const overallMean = allReturns.length > 0 ? mean(allReturns) : 0;

  // Bucket returns by their month (1..12) once instead of scanning per month.
  const byMonth: number[][] = Array.from({ length: 12 }, () => []);
  for (const [key, ret] of byKey) {
    const month = Number(key.slice(-2)); // "YYYY-MM" -> month
    if (month >= 1 && month <= 12) byMonth[month - 1].push(ret);
  }

  const scores: MonthScore[] = [];
  for (let m = 1; m <= 12; m++) {
    const returns = byMonth[m - 1];
    if (returns.length === 0) {
      scores.push({
        month: m,
        avgReturn: 0,
        pctYearsPositive: 0,
        pctYearsBeatMean: 0,
        sampleSize: 0,
      });
      continue;
    }
    scores.push({
      month: m,
      avgReturn: mean(returns),
      pctYearsPositive: fractionGreaterThan(returns, 0),
      pctYearsBeatMean: fractionGreaterThan(returns, overallMean),
      sampleSize: returns.length,
    });
  }
  return scores;
}
