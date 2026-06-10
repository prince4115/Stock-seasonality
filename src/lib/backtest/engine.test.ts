import { describe, expect, it } from "vitest";
import type { PriceBar } from "@/lib/analysis/types";
import { runBacktest } from "./engine";
import type { StrategyConfig } from "./types";

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

/**
 * Build a chained bar series: two bars per month (day 1 open-equivalent,
 * day 28 close), where each month's return is given by `retFor`. Returning
 * null skips the month entirely (no bars — simulates a delisting gap).
 */
function buildBars(
  retFor: (y: number, m: number) => number | null,
  fromYear: number,
  toYear: number,
): PriceBar[] {
  let close = 100;
  const bars: PriceBar[] = [];
  for (let y = fromYear; y <= toYear; y++) {
    for (let m = 1; m <= 12; m++) {
      const r = retFor(y, m);
      if (r === null) continue;
      bars.push({ date: utc(y, m, 1), adjClose: close });
      const end = close * (1 + r);
      bars.push({ date: utc(y, m, 28), adjClose: end });
      close = end;
    }
  }
  return bars;
}

const config: StrategyConfig = {
  windowYears: 5,
  topK: 1,
  minSampleSize: 3,
  minPctPositive: 0.6,
  costBpsPerSide: 10, // round trip = 20 bps = 0.002
  startMonth: "2020-01",
  endMonth: "2020-12",
};

// AAA: +10% every July, flat otherwise. SPY: +1% every month.
const julyTenPct = (y: number, m: number) => (m === 7 ? 0.1 : 0);
const onePctEveryMonth = () => 0.01;

describe("runBacktest", () => {
  it("invests only in the eligible month and charges round-trip costs", () => {
    const result = runBacktest({
      barsByTicker: new Map([["AAA", buildBars(julyTenPct, 2014, 2020)]]),
      spyBars: buildBars(onePctEveryMonth, 2014, 2020),
      config,
    });

    // Flat months have 0% history → pctPositive 0 → cash. Only July trades.
    expect(result.monthsInvested).toBe(1);
    expect(result.monthsInCash).toBe(11);

    const july = result.months.find((m) => m.month === "2020-07")!;
    expect(july.picks.map((p) => p.ticker)).toEqual(["AAA"]);
    expect(july.grossReturn).toBeCloseTo(0.1, 10);
    expect(july.netReturn).toBeCloseTo(0.098, 10); // 10% − 20 bps

    // Equity = product of (1 + net) = 1.098 exactly (other months are 0).
    const final = result.equityCurve[result.equityCurve.length - 1];
    expect(final.strategy).toBeCloseTo(1.098, 10);
    expect(final.spy).toBeCloseTo(Math.pow(1.01, 12), 10);

    expect(result.strategyMetrics.hitRate).toBeCloseTo(1 / 12, 10);
    // Strategy beats SPY's +1% only in July.
    expect(result.pctMonthsBeatSpy).toBeCloseTo(1 / 12, 10);
  });

  it("realizes the traded month's actual return even when it breaks the pattern (no lookahead)", () => {
    // History says +10% every July; July 2020 actually crashes −50%.
    const crashJuly2020 = (y: number, m: number) => (m === 7 ? (y === 2020 ? -0.5 : 0.1) : 0);

    const result = runBacktest({
      barsByTicker: new Map([["AAA", buildBars(crashJuly2020, 2014, 2020)]]),
      spyBars: buildBars(onePctEveryMonth, 2014, 2020),
      config,
    });

    const july = result.months.find((m) => m.month === "2020-07")!;
    // The decision still picked AAA (made on pre-2020 history)…
    expect(july.picks.map((p) => p.ticker)).toEqual(["AAA"]);
    // …and ate the crash. This is the proof the engine can't peek.
    expect(july.netReturn).toBeCloseTo(-0.5 - 0.002, 10);
  });

  it("equal-weights multiple picks", () => {
    const julyEightPct = (y: number, m: number) => (m === 7 ? 0.08 : 0);
    const result = runBacktest({
      barsByTicker: new Map([
        ["AAA", buildBars(julyTenPct, 2014, 2020)],
        ["DDD", buildBars(julyEightPct, 2014, 2020)],
      ]),
      spyBars: buildBars(onePctEveryMonth, 2014, 2020),
      config: { ...config, topK: 2 },
    });

    const july = result.months.find((m) => m.month === "2020-07")!;
    expect(july.picks.map((p) => p.ticker)).toEqual(["AAA", "DDD"]);
    // ((0.10 − 0.002) + (0.08 − 0.002)) / 2 = 0.088
    expect(july.netReturn).toBeCloseTo(0.088, 10);
  });

  it("holds a slice in cash when a picked stock has no bars in the traded month", () => {
    // CCC has the best July history but delists end of 2019 (no 2020 bars).
    const ccc = buildBars((y, m) => (y >= 2020 ? null : m === 7 ? 0.2 : 0), 2014, 2020);
    const result = runBacktest({
      barsByTicker: new Map([
        ["AAA", buildBars(julyTenPct, 2014, 2020)],
        ["CCC", ccc],
      ]),
      spyBars: buildBars(onePctEveryMonth, 2014, 2020),
      config, // topK = 1 → CCC outranks AAA on history
    });

    const july = result.months.find((m) => m.month === "2020-07")!;
    expect(july.picks.map((p) => p.ticker)).toEqual(["CCC"]);
    expect(july.missedPicks).toEqual(["CCC"]);
    expect(july.netReturn).toBe(0); // slice sat in cash, no cost charged
  });

  it("reports SPY as null when the benchmark has no data for a month", () => {
    const spyMissingJuly = buildBars((y, m) => (y === 2020 && m === 7 ? null : 0.01), 2014, 2020);
    const result = runBacktest({
      barsByTicker: new Map([["AAA", buildBars(julyTenPct, 2014, 2020)]]),
      spyBars: spyMissingJuly,
      config,
    });
    const july = result.months.find((m) => m.month === "2020-07")!;
    expect(july.spyReturn).toBeNull();
    // The beat-SPY ratio only counts months where SPY existed.
    expect(result.spyMetrics.nMonths).toBe(11);
  });
});
