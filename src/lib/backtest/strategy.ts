/**
 * The strategy: rank candidates for a traded month using only history
 * strictly before that month.
 *
 * No-lookahead invariant: when scoring traded month 2024-07, the inputs are
 * July returns from years [2024 − windowYears, 2023]. The traded month's own
 * return never participates in its own ranking; neither does anything after
 * it. This mirrors what a live weekly job could actually know.
 */
import { fractionGreaterThan, mean } from "@/lib/analysis/returns";
import { makeMonthKey, parseMonthKey } from "./months";
import type { CandidatePick, MonthKey, StrategyConfig } from "./types";

/** Per-ticker map of "YYYY-MM" -> realized monthly return. */
export type ReturnsByTicker = Map<string, Map<MonthKey, number>>;

export function rankCandidates(
  returnsByTicker: ReturnsByTicker,
  tradedMonth: MonthKey,
  config: StrategyConfig,
): CandidatePick[] {
  const { year, month } = parseMonthKey(tradedMonth);

  const candidates: CandidatePick[] = [];
  for (const [ticker, returns] of returnsByTicker) {
    const history: number[] = [];
    for (let y = year - config.windowYears; y <= year - 1; y++) {
      const r = returns.get(makeMonthKey(y, month));
      if (r !== undefined) history.push(r);
    }
    if (history.length < config.minSampleSize) continue;

    const pctPositive = fractionGreaterThan(history, 0);
    if (pctPositive < config.minPctPositive) continue;

    candidates.push({
      ticker,
      score: mean(history),
      pctPositive,
      sampleSize: history.length,
    });
  }

  // Highest average first; ticker tie-break keeps runs deterministic.
  candidates.sort((a, b) => b.score - a.score || a.ticker.localeCompare(b.ticker));
  return candidates.slice(0, config.topK);
}
