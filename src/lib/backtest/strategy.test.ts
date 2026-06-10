import { describe, expect, it } from "vitest";
import { rankCandidates, type ReturnsByTicker } from "./strategy";
import type { StrategyConfig } from "./types";

const baseConfig: StrategyConfig = {
  windowYears: 5,
  topK: 3,
  minSampleSize: 3,
  minPctPositive: 0.6,
  costBpsPerSide: 10,
  startMonth: "2020-01",
  endMonth: "2020-12",
};

/** Build a ticker's return map from {"YYYY-MM": ret} literals. */
function returnsOf(entries: Record<string, number>): Map<string, number> {
  return new Map(Object.entries(entries));
}

describe("rankCandidates", () => {
  it("ranks eligible tickers by average same-month return, descending", () => {
    const universe: ReturnsByTicker = new Map([
      // July avg +10%, always positive
      [
        "AAA",
        returnsOf({
          "2015-07": 0.1,
          "2016-07": 0.1,
          "2017-07": 0.1,
          "2018-07": 0.1,
          "2019-07": 0.1,
        }),
      ],
      // July avg +5%, always positive
      [
        "BBB",
        returnsOf({
          "2015-07": 0.05,
          "2016-07": 0.05,
          "2017-07": 0.05,
          "2018-07": 0.05,
          "2019-07": 0.05,
        }),
      ],
    ]);
    const picks = rankCandidates(universe, "2020-07", baseConfig);
    expect(picks.map((p) => p.ticker)).toEqual(["AAA", "BBB"]);
    expect(picks[0].score).toBeCloseTo(0.1, 10);
    expect(picks[0].sampleSize).toBe(5);
    expect(picks[0].pctPositive).toBe(1);
  });

  it("excludes tickers below minSampleSize", () => {
    const universe: ReturnsByTicker = new Map([
      ["THIN", returnsOf({ "2018-07": 0.2, "2019-07": 0.2 })], // only 2 samples
    ]);
    expect(rankCandidates(universe, "2020-07", baseConfig)).toEqual([]);
  });

  it("excludes tickers below minPctPositive", () => {
    const universe: ReturnsByTicker = new Map([
      // 2 of 5 positive = 0.4 < 0.6
      [
        "CHOP",
        returnsOf({
          "2015-07": 0.3,
          "2016-07": -0.1,
          "2017-07": 0.3,
          "2018-07": -0.1,
          "2019-07": -0.1,
        }),
      ],
    ]);
    expect(rankCandidates(universe, "2020-07", baseConfig)).toEqual([]);
  });

  it("never reads the traded month or anything after it (no lookahead)", () => {
    const universe: ReturnsByTicker = new Map([
      [
        "AAA",
        returnsOf({
          "2015-07": 0.1,
          "2016-07": 0.1,
          "2017-07": 0.1,
          "2018-07": 0.1,
          "2019-07": 0.1,
          "2020-07": -0.9, // the traded month itself — must be invisible
          "2021-07": -0.9, // the future — must be invisible
        }),
      ],
    ]);
    const picks = rankCandidates(universe, "2020-07", baseConfig);
    expect(picks).toHaveLength(1);
    expect(picks[0].score).toBeCloseTo(0.1, 10); // unchanged by 2020/2021 values
    expect(picks[0].sampleSize).toBe(5);
  });

  it("respects the trailing window (drops years older than windowYears)", () => {
    const universe: ReturnsByTicker = new Map([
      [
        "OLD",
        returnsOf({
          "2010-07": 9.9, // far outside the 5y window from 2020 — ignored
          "2015-07": 0.1,
          "2016-07": 0.1,
          "2017-07": 0.1,
          "2018-07": 0.1,
          "2019-07": 0.1,
        }),
      ],
    ]);
    const picks = rankCandidates(universe, "2020-07", baseConfig);
    expect(picks[0].score).toBeCloseTo(0.1, 10);
    expect(picks[0].sampleSize).toBe(5); // not 6
  });

  it("only uses the traded calendar month, not adjacent months", () => {
    const universe: ReturnsByTicker = new Map([
      [
        "JUNY",
        returnsOf({
          // great Junes, no July history at all
          "2017-06": 0.5,
          "2018-06": 0.5,
          "2019-06": 0.5,
        }),
      ],
    ]);
    expect(rankCandidates(universe, "2020-07", baseConfig)).toEqual([]);
  });

  it("caps at topK and tie-breaks deterministically by ticker", () => {
    const same = { "2017-07": 0.1, "2018-07": 0.1, "2019-07": 0.1 };
    const universe: ReturnsByTicker = new Map([
      ["ZZZ", returnsOf(same)],
      ["MMM", returnsOf(same)],
      ["AAA", returnsOf(same)],
      ["BBB", returnsOf(same)],
    ]);
    const picks = rankCandidates(universe, "2020-07", { ...baseConfig, topK: 2 });
    expect(picks.map((p) => p.ticker)).toEqual(["AAA", "BBB"]);
  });
});
