/**
 * Walk-forward backtest engine.
 *
 * For every month in [startMonth, endMonth]:
 *   1. Rank candidates using only pre-month history (strategy.ts).
 *   2. Enter the top-K equal-weighted at the first bar of the month, exit at
 *      the last bar — exactly the monthly-return definition the analysis
 *      library uses, so backtest results tie out with the displayed scores.
 *   3. Charge a round-trip cost (2 × costBpsPerSide) on each invested slice.
 *   4. Months with no eligible picks sit in cash at 0%.
 *
 * Realized returns come from monthlyReturnsByMonthKey over the full bar
 * history — including delisted tickers, so survivorship is handled the same
 * way as everywhere else in the project. A picked stock with no bars in the
 * traded month (delisted in between) holds that slice as cash and is
 * reported in `missedPicks`.
 */
import { monthlyReturnsByMonthKey } from "@/lib/analysis/seasonality";
import type { PriceBar } from "@/lib/analysis/types";
import { enumerateMonths } from "./months";
import { computeMetrics } from "./metrics";
import { rankCandidates, type ReturnsByTicker } from "./strategy";
import type { BacktestResult, EquityPoint, MonthResult, StrategyConfig } from "./types";

export function buildReturnsByTicker(barsByTicker: Map<string, PriceBar[]>): ReturnsByTicker {
  const out: ReturnsByTicker = new Map();
  for (const [ticker, bars] of barsByTicker) {
    out.set(ticker, monthlyReturnsByMonthKey(bars));
  }
  return out;
}

export function runBacktest(input: {
  barsByTicker: Map<string, PriceBar[]>;
  spyBars: PriceBar[];
  config: StrategyConfig;
}): BacktestResult {
  const { config } = input;
  const returnsByTicker = buildReturnsByTicker(input.barsByTicker);
  const spyReturns = monthlyReturnsByMonthKey(input.spyBars);

  const months = enumerateMonths(config.startMonth, config.endMonth);
  const roundTripCost = (2 * config.costBpsPerSide) / 10_000;

  const monthResults: MonthResult[] = [];
  const strategyReturns: number[] = [];
  const spyMonthly: number[] = [];
  const equityCurve: EquityPoint[] = [];

  let strategyEquity = 1;
  let spyEquity = 1;
  let monthsInvested = 0;
  let monthsInCash = 0;
  let beatSpy = 0;
  let spyComparableMonths = 0;

  for (const month of months) {
    const picks = rankCandidates(returnsByTicker, month, config);

    let grossReturn = 0;
    let netReturn = 0;
    const missedPicks: string[] = [];

    if (picks.length === 0) {
      monthsInCash++;
    } else {
      monthsInvested++;
      let grossSum = 0;
      let netSum = 0;
      for (const pick of picks) {
        const realized = returnsByTicker.get(pick.ticker)?.get(month);
        if (realized === undefined) {
          // No bars this month — slice stays in cash, no cost charged.
          missedPicks.push(pick.ticker);
          continue;
        }
        grossSum += realized;
        netSum += realized - roundTripCost;
      }
      grossReturn = grossSum / picks.length;
      netReturn = netSum / picks.length;
    }

    const spyReturn = spyReturns.get(month) ?? null;

    strategyEquity *= 1 + netReturn;
    if (spyReturn !== null) {
      spyEquity *= 1 + spyReturn;
      spyMonthly.push(spyReturn);
      spyComparableMonths++;
      if (netReturn > spyReturn) beatSpy++;
    }

    strategyReturns.push(netReturn);
    monthResults.push({ month, picks, grossReturn, netReturn, spyReturn, missedPicks });
    equityCurve.push({ month, strategy: strategyEquity, spy: spyEquity });
  }

  return {
    config,
    months: monthResults,
    equityCurve,
    strategyMetrics: computeMetrics(strategyReturns),
    spyMetrics: computeMetrics(spyMonthly),
    pctMonthsBeatSpy: spyComparableMonths > 0 ? beatSpy / spyComparableMonths : 0,
    monthsInvested,
    monthsInCash,
  };
}
