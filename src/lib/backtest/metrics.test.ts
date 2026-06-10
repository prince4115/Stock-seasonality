import { describe, expect, it } from "vitest";
import { cagr, computeMetrics, hitRate, maxDrawdown, sharpe, totalReturn } from "./metrics";
import { enumerateMonths, makeMonthKey, nextMonthKey, parseMonthKey } from "./months";

describe("month-key helpers", () => {
  it("zero-pads and round-trips", () => {
    expect(makeMonthKey(2024, 3)).toBe("2024-03");
    expect(parseMonthKey("2024-03")).toEqual({ year: 2024, month: 3 });
    expect(parseMonthKey("2024-12")).toEqual({ year: 2024, month: 12 });
  });

  it("nextMonthKey crosses year boundaries", () => {
    expect(nextMonthKey("2024-11")).toBe("2024-12");
    expect(nextMonthKey("2024-12")).toBe("2025-01");
  });

  it("enumerateMonths is inclusive on both ends", () => {
    expect(enumerateMonths("2024-11", "2025-02")).toEqual([
      "2024-11",
      "2024-12",
      "2025-01",
      "2025-02",
    ]);
    expect(enumerateMonths("2024-05", "2024-05")).toEqual(["2024-05"]);
  });

  it("rejects reversed ranges and malformed keys", () => {
    expect(() => enumerateMonths("2025-01", "2024-01")).toThrow();
    expect(() => parseMonthKey("2024-13")).toThrow();
    expect(() => parseMonthKey("garbage")).toThrow();
  });
});

describe("totalReturn", () => {
  it("compounds correctly", () => {
    // 1.1 × 0.95 − 1 = 0.045
    expect(totalReturn([0.1, -0.05])).toBeCloseTo(0.045, 10);
  });
  it("is 0 for an empty series", () => {
    expect(totalReturn([])).toBe(0);
  });
});

describe("cagr", () => {
  it("equals the total return for exactly 12 months", () => {
    const monthly = Array(12).fill(0.01);
    expect(cagr(monthly)).toBeCloseTo(Math.pow(1.01, 12) - 1, 10);
  });
  it("annualizes a 24-month series", () => {
    const monthly = Array(24).fill(0.01);
    // total = 1.01^24 − 1; cagr = (1.01^24)^(12/24) − 1 = 1.01^12 − 1
    expect(cagr(monthly)).toBeCloseTo(Math.pow(1.01, 12) - 1, 10);
  });
  it("is 0 for an empty series", () => {
    expect(cagr([])).toBe(0);
  });
});

describe("sharpe", () => {
  it("matches a hand-computed two-point series", () => {
    // mean 0.01, sample sd = sqrt(((0.01)² + (0.01)²)/1) ≈ 0.0141421
    // sharpe = 0.01/0.0141421 × √12 ≈ 2.4495
    expect(sharpe([0.02, 0])).toBeCloseTo(2.4495, 3);
  });
  it("returns 0 for constant returns (zero variance)", () => {
    expect(sharpe([0.01, 0.01, 0.01])).toBe(0);
  });
  it("returns 0 for fewer than 2 observations", () => {
    expect(sharpe([0.05])).toBe(0);
    expect(sharpe([])).toBe(0);
  });
});

describe("maxDrawdown", () => {
  it("measures peak-to-trough", () => {
    // equity: 1.1 → 0.55 → 0.66; peak 1.1, trough 0.55 → dd = 0.5
    expect(maxDrawdown([0.1, -0.5, 0.2])).toBeCloseTo(0.5, 10);
  });
  it("is 0 for a monotonically rising series", () => {
    expect(maxDrawdown([0.01, 0.02, 0.03])).toBe(0);
  });
});

describe("hitRate", () => {
  it("counts strictly positive months", () => {
    expect(hitRate([0.1, -0.05, 0])).toBeCloseTo(1 / 3, 10);
  });
  it("is 0 for empty input", () => {
    expect(hitRate([])).toBe(0);
  });
});

describe("computeMetrics", () => {
  it("bundles the pieces consistently", () => {
    const m = computeMetrics([0.1, -0.05]);
    expect(m.totalReturn).toBeCloseTo(0.045, 10);
    expect(m.nMonths).toBe(2);
    expect(m.hitRate).toBeCloseTo(0.5, 10);
  });
});
