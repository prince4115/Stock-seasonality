import { describe, expect, it } from "vitest";
import type { PriceBar } from "./types";
import { computeSeasonality, filterToWindow, monthlyReturnsByMonthKey } from "./seasonality";

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

/**
 * Build a synthetic price series: one bar at day 1 and day 28 of every month.
 * Multiplier pattern lets us inject known seasonality:
 *   - January (m=1): +10%
 *   - July (m=7): -5%
 *   - all others: 0%
 */
function buildSynth(yearStart: number, years: number): PriceBar[] {
  let close = 100;
  const bars: PriceBar[] = [];
  for (let y = yearStart; y < yearStart + years; y++) {
    for (let m = 1; m <= 12; m++) {
      let multiplier = 1.0;
      if (m === 1) multiplier = 1.1;
      else if (m === 7) multiplier = 0.95;
      const startClose = close;
      const endClose = close * multiplier;
      bars.push({ date: utc(y, m, 1), adjClose: startClose });
      bars.push({ date: utc(y, m, 28), adjClose: endClose });
      close = endClose;
    }
  }
  return bars;
}

describe("filterToWindow", () => {
  it("drops bars outside the trailing window", () => {
    const bars = [
      { date: utc(2010, 5, 1), adjClose: 100 },
      { date: utc(2021, 5, 19), adjClose: 200 }, // exactly 5y before asOf
      { date: utc(2024, 6, 1), adjClose: 250 },
    ];
    const filtered = filterToWindow(bars, {
      asOf: utc(2026, 5, 19),
      windowYears: 5,
      excludeCovid: false,
    });
    expect(filtered).toHaveLength(2);
    expect(filtered[0].adjClose).toBe(200);
  });

  it("excludes COVID years when toggled", () => {
    const bars = [
      { date: utc(2019, 12, 31), adjClose: 100 },
      { date: utc(2020, 6, 1), adjClose: 90 },
      { date: utc(2021, 12, 31), adjClose: 110 },
      { date: utc(2022, 1, 1), adjClose: 115 },
    ];
    const out = filterToWindow(bars, {
      asOf: utc(2026, 5, 19),
      windowYears: 10,
      excludeCovid: true,
    });
    expect(out).toHaveLength(2);
    expect(out.map((b) => b.adjClose)).toEqual([100, 115]);
  });

  it("includes COVID bars when toggle is off", () => {
    const bars = [{ date: utc(2020, 6, 1), adjClose: 90 }];
    expect(
      filterToWindow(bars, {
        asOf: utc(2026, 5, 19),
        windowYears: 10,
        excludeCovid: false,
      }),
    ).toHaveLength(1);
  });
});

describe("monthlyReturnsByMonthKey", () => {
  it("computes per-month returns from a synthetic series", () => {
    const bars = buildSynth(2020, 1); // 1 year
    const m = monthlyReturnsByMonthKey(bars);
    expect(m.get("2020-01")).toBeCloseTo(0.1, 10);
    expect(m.get("2020-07")).toBeCloseTo(-0.05, 10);
    expect(m.get("2020-03")).toBeCloseTo(0, 10);
  });

  it("skips months with fewer than 2 bars", () => {
    const bars: PriceBar[] = [{ date: utc(2020, 1, 15), adjClose: 100 }];
    expect(monthlyReturnsByMonthKey(bars).size).toBe(0);
  });
});

describe("computeSeasonality", () => {
  it("reports the seeded seasonality pattern across 10 years", () => {
    const bars = buildSynth(2014, 10); // covers 2014–2023 (10 years)
    const scores = computeSeasonality(bars, {
      asOf: utc(2024, 1, 1),
      windowYears: 10,
      excludeCovid: false,
    });
    const jan = scores.find((s) => s.month === 1)!;
    const jul = scores.find((s) => s.month === 7)!;
    const mar = scores.find((s) => s.month === 3)!;

    // January was up every year
    expect(jan.sampleSize).toBe(10);
    expect(jan.avgReturn).toBeCloseTo(0.1, 10);
    expect(jan.pctYearsPositive).toBe(1);

    // July was down every year
    expect(jul.sampleSize).toBe(10);
    expect(jul.avgReturn).toBeCloseTo(-0.05, 10);
    expect(jul.pctYearsPositive).toBe(0);

    // March was flat
    expect(mar.sampleSize).toBe(10);
    expect(mar.avgReturn).toBeCloseTo(0, 10);
  });

  it("returns 12 entries even when months have no data", () => {
    const bars: PriceBar[] = [];
    const scores = computeSeasonality(bars, {
      asOf: utc(2024, 1, 1),
      windowYears: 10,
      excludeCovid: false,
    });
    expect(scores).toHaveLength(12);
    for (const s of scores) {
      expect(s.sampleSize).toBe(0);
      expect(s.avgReturn).toBe(0);
    }
  });

  it("pctYearsBeatMean compares against the overall mean within the window", () => {
    // 10 years where Jan = +10%, all other months = 0%.
    // Overall mean across 120 (year × month) returns = 10% / 12 ≈ 0.83%.
    // Jan should beat that 100% of the time; other months 0%.
    const series: PriceBar[] = [];
    let close = 100;
    for (let y = 2014; y < 2024; y++) {
      for (let m = 1; m <= 12; m++) {
        const startClose = close;
        const multiplier = m === 1 ? 1.1 : 1.0;
        const endClose = close * multiplier;
        series.push({ date: utc(y, m, 1), adjClose: startClose });
        series.push({ date: utc(y, m, 28), adjClose: endClose });
        close = endClose;
      }
    }

    const scores = computeSeasonality(series, {
      asOf: utc(2024, 1, 1),
      windowYears: 10,
      excludeCovid: false,
    });
    const jan = scores.find((s) => s.month === 1)!;
    const jul = scores.find((s) => s.month === 7)!;
    expect(jan.pctYearsBeatMean).toBe(1); // Jan always beats the overall mean
    expect(jul.pctYearsBeatMean).toBe(0); // Jul (0% return) never beats the positive overall mean
  });

  it("respects excludeCovid", () => {
    const bars = buildSynth(2018, 8); // 2018–2025
    const withCovid = computeSeasonality(bars, {
      asOf: utc(2026, 1, 1),
      windowYears: 10,
      excludeCovid: false,
    });
    const withoutCovid = computeSeasonality(bars, {
      asOf: utc(2026, 1, 1),
      windowYears: 10,
      excludeCovid: true,
    });
    const janWith = withCovid.find((s) => s.month === 1)!;
    const janWithout = withoutCovid.find((s) => s.month === 1)!;
    // Dropping 2 years (2020, 2021) leaves 6 years of January data
    expect(janWith.sampleSize).toBe(8);
    expect(janWithout.sampleSize).toBe(6);
  });
});
