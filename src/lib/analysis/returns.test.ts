import { describe, expect, it } from "vitest";
import type { PriceBar } from "./types";
import {
  fractionGreaterThan,
  groupByMonth,
  inDateRange,
  isCovidYear,
  mean,
  monthKey,
  monthlyReturn,
  pctReturn,
  sortBars,
  yearsBefore,
} from "./returns";

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));
const bar = (y: number, m: number, d: number, adjClose: number): PriceBar => ({
  date: utc(y, m, d),
  adjClose,
});

describe("pctReturn", () => {
  it("computes a positive return", () => {
    expect(pctReturn(100, 110)).toBeCloseTo(0.1, 10);
  });

  it("computes a negative return", () => {
    expect(pctReturn(100, 90)).toBeCloseTo(-0.1, 10);
  });

  it("computes zero return when prices match", () => {
    expect(pctReturn(50, 50)).toBe(0);
  });

  it("throws on zero start (division by zero)", () => {
    expect(() => pctReturn(0, 100)).toThrow();
  });

  it("throws on NaN inputs", () => {
    expect(() => pctReturn(NaN, 100)).toThrow();
    expect(() => pctReturn(100, NaN)).toThrow();
  });
});

describe("monthKey", () => {
  it("zero-pads single-digit months", () => {
    expect(monthKey(utc(2024, 1, 15))).toBe("2024-01");
    expect(monthKey(utc(2024, 9, 1))).toBe("2024-09");
  });

  it("handles double-digit months without padding mishaps", () => {
    expect(monthKey(utc(2024, 10, 1))).toBe("2024-10");
    expect(monthKey(utc(2024, 12, 31))).toBe("2024-12");
  });

  it("is timezone-stable (uses UTC, not local)", () => {
    // UTC midnight on Jan 1 — in a -8 TZ this would look like Dec 31 of prev year.
    expect(monthKey(new Date(Date.UTC(2024, 0, 1, 0, 0, 0)))).toBe("2024-01");
  });
});

describe("groupByMonth", () => {
  it("buckets bars by UTC month", () => {
    const bars = [bar(2024, 1, 2, 100), bar(2024, 1, 31, 110), bar(2024, 2, 1, 111)];
    const grouped = groupByMonth(bars);
    expect(grouped.get("2024-01")?.length).toBe(2);
    expect(grouped.get("2024-02")?.length).toBe(1);
  });

  it("preserves input order within a bucket", () => {
    const bars = [bar(2024, 1, 2, 100), bar(2024, 1, 31, 110)];
    const grouped = groupByMonth(bars);
    const jan = grouped.get("2024-01") ?? [];
    expect(jan[0].adjClose).toBe(100);
    expect(jan[1].adjClose).toBe(110);
  });

  it("returns an empty map for no bars", () => {
    expect(groupByMonth([]).size).toBe(0);
  });
});

describe("monthlyReturn", () => {
  it("returns first→last percent change", () => {
    const bars = [bar(2024, 1, 2, 100), bar(2024, 1, 15, 105), bar(2024, 1, 31, 110)];
    expect(monthlyReturn(bars)).toBeCloseTo(0.1, 10);
  });

  it("returns null for a single bar (no change computable)", () => {
    expect(monthlyReturn([bar(2024, 1, 2, 100)])).toBeNull();
  });

  it("returns null for an empty month", () => {
    expect(monthlyReturn([])).toBeNull();
  });

  it("returns null when the first bar has zero adjClose", () => {
    expect(monthlyReturn([bar(2024, 1, 2, 0), bar(2024, 1, 31, 50)])).toBeNull();
  });

  it("handles negative returns", () => {
    expect(monthlyReturn([bar(2024, 1, 2, 100), bar(2024, 1, 31, 80)])).toBeCloseTo(-0.2, 10);
  });
});

describe("sortBars", () => {
  it("sorts ascending by date and does not mutate input", () => {
    const input = [bar(2024, 2, 1, 110), bar(2024, 1, 2, 100), bar(2024, 1, 31, 105)];
    const out = sortBars(input);
    expect(out.map((b) => b.adjClose)).toEqual([100, 105, 110]);
    // input untouched
    expect(input[0].date.getTime()).toBe(utc(2024, 2, 1).getTime());
  });
});

describe("inDateRange", () => {
  it("is inclusive on both ends", () => {
    const b = bar(2024, 6, 15, 100);
    expect(inDateRange(b, utc(2024, 6, 15), utc(2024, 6, 15))).toBe(true);
    expect(inDateRange(b, utc(2024, 6, 14), utc(2024, 6, 16))).toBe(true);
    expect(inDateRange(b, utc(2024, 6, 16), utc(2024, 6, 17))).toBe(false);
  });
});

describe("yearsBefore", () => {
  it("subtracts the right number of years", () => {
    expect(yearsBefore(utc(2026, 5, 19), 5).getTime()).toBe(utc(2021, 5, 19).getTime());
    expect(yearsBefore(utc(2026, 5, 19), 15).getTime()).toBe(utc(2011, 5, 19).getTime());
  });

  it("handles Feb 29 by rolling to Mar 1 (Date semantics)", () => {
    // 2024-02-29 minus 1 year = 2023-03-01 (since 2023 is not a leap year)
    const result = yearsBefore(utc(2024, 2, 29), 1);
    expect(result.getUTCMonth()).toBe(2); // 0-indexed → March
    expect(result.getUTCDate()).toBe(1);
  });
});

describe("isCovidYear", () => {
  it("flags 2020 and 2021 only", () => {
    expect(isCovidYear(utc(2019, 12, 31))).toBe(false);
    expect(isCovidYear(utc(2020, 1, 1))).toBe(true);
    expect(isCovidYear(utc(2020, 12, 31))).toBe(true);
    expect(isCovidYear(utc(2021, 6, 1))).toBe(true);
    expect(isCovidYear(utc(2021, 12, 31))).toBe(true);
    expect(isCovidYear(utc(2022, 1, 1))).toBe(false);
  });
});

describe("mean", () => {
  it("averages a list", () => {
    expect(mean([1, 2, 3, 4, 5])).toBe(3);
  });
  it("handles negatives", () => {
    expect(mean([-1, 1])).toBe(0);
  });
  it("throws on empty (caller should check sampleSize)", () => {
    expect(() => mean([])).toThrow();
  });
});

describe("fractionGreaterThan", () => {
  it("counts strictly greater", () => {
    expect(fractionGreaterThan([1, 2, 3, 4, 5], 2)).toBeCloseTo(0.6, 10);
    expect(fractionGreaterThan([1, 2, 3], 3)).toBe(0); // strictly
  });
  it("returns 0 on empty input", () => {
    expect(fractionGreaterThan([], 0)).toBe(0);
  });
});
