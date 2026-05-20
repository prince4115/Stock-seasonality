import { describe, expect, it } from "vitest";
import type { PriceBar } from "./types";
import { aggregateEventWindow, eventWindowReturn, indexAtOrAfter } from "./event-window";

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

/**
 * Build a dense daily price series with adjClose = 100 + i (linear ramp).
 * Every calendar day is a bar — sufficient for testing the offsets without
 * worrying about weekends.
 */
function buildLinearSeries(start: Date, days: number): PriceBar[] {
  const bars: PriceBar[] = [];
  for (let i = 0; i < days; i++) {
    bars.push({
      date: new Date(start.getTime() + i * 24 * 60 * 60 * 1000),
      adjClose: 100 + i,
    });
  }
  return bars;
}

describe("indexAtOrAfter", () => {
  const bars = buildLinearSeries(utc(2024, 1, 1), 10);

  it("returns the exact index when target matches a bar", () => {
    expect(indexAtOrAfter(bars, utc(2024, 1, 5))).toBe(4);
  });

  it("returns the next index when target falls between bars", () => {
    // there's no bar Jan 0 — actually the data starts Jan 1, so a target
    // before Jan 1 returns index 0
    expect(indexAtOrAfter(bars, utc(2023, 12, 25))).toBe(0);
  });

  it("returns -1 when target is past the end", () => {
    expect(indexAtOrAfter(bars, utc(2024, 12, 31))).toBe(-1);
  });

  it("handles empty bars", () => {
    expect(indexAtOrAfter([], utc(2024, 1, 1))).toBe(-1);
  });
});

describe("eventWindowReturn", () => {
  // 100 bars starting Jan 1: adjClose = 100..199. Event at bar index 50
  // (Feb 20). PRE30_PRE7 = idx 20 → idx 43 = price 120 → 143.
  const bars = buildLinearSeries(utc(2024, 1, 1), 100);
  const eventDate = bars[50].date;

  it("computes PRE30_PRE7 correctly", () => {
    const ret = eventWindowReturn(bars, eventDate, "PRE30_PRE7");
    expect(ret).not.toBeNull();
    expect(ret!).toBeCloseTo((143 - 120) / 120, 10);
  });

  it("computes PRE7_EVENT correctly", () => {
    const ret = eventWindowReturn(bars, eventDate, "PRE7_EVENT");
    // idx 43 → idx 50 = 143 → 150
    expect(ret!).toBeCloseTo((150 - 143) / 143, 10);
  });

  it("computes EVENT_POST7 correctly", () => {
    const ret = eventWindowReturn(bars, eventDate, "EVENT_POST7");
    // idx 50 → idx 57 = 150 → 157
    expect(ret!).toBeCloseTo((157 - 150) / 150, 10);
  });

  it("returns null when window extends before data starts", () => {
    // Event at bar index 5; PRE30_PRE7 needs index -25
    expect(eventWindowReturn(bars, bars[5].date, "PRE30_PRE7")).toBeNull();
  });

  it("returns null when window extends past data end", () => {
    // Event at bar index 98 needs +7 = 105 (out of range)
    expect(eventWindowReturn(bars, bars[98].date, "EVENT_POST7")).toBeNull();
  });

  it("anchors at first bar on/after event when event falls in a gap", () => {
    // Take only every other bar so half the calendar days are gaps.
    const sparse = bars.filter((_, i) => i % 2 === 0);
    const eventInGap = utc(2024, 1, 2); // bars[1] in dense series, gap in sparse
    // First sparse bar on/after Jan 2 is Jan 3 (index 1 in sparse = price 102).
    // PRE30_PRE7 from sparse[-29] to sparse[-6] would be out of range,
    // but the anchor is at sparse index 1, so PRE30_PRE7 = idx -29 → -6
    // = out of range → null.
    expect(eventWindowReturn(sparse, eventInGap, "PRE30_PRE7")).toBeNull();
    // PRE7_EVENT also out of range (idx -6).
    expect(eventWindowReturn(sparse, eventInGap, "PRE7_EVENT")).toBeNull();
    // EVENT_POST7: idx 1 → idx 8 (in range). Sparse[1] price = 102, sparse[8] price = 116.
    const ret = eventWindowReturn(sparse, eventInGap, "EVENT_POST7");
    expect(ret!).toBeCloseTo((116 - 102) / 102, 10);
  });

  it("returns null on empty bars", () => {
    expect(eventWindowReturn([], utc(2024, 1, 1), "PRE7_EVENT")).toBeNull();
  });
});

describe("aggregateEventWindow", () => {
  it("aggregates returns across multiple occurrences", () => {
    const bars = buildLinearSeries(utc(2020, 1, 1), 365 * 4); // ~4 years of bars
    const events = [bars[100].date, bars[400].date, bars[700].date, bars[1000].date];
    const score = aggregateEventWindow(bars, "test-event", events, "EVENT_POST7", false);
    expect(score.sampleSize).toBe(4);
    expect(score.festivalSlug).toBe("test-event");
    expect(score.windowKind).toBe("EVENT_POST7");
    // Linear ramp + EVENT_POST7 over 7 bars: each occurrence returns
    // (start + 7 - start) / start. Different starts produce different
    // returns; all positive though, so pctYearsPositive = 1.
    expect(score.pctYearsPositive).toBe(1);
    expect(score.avgReturn).toBeGreaterThan(0);
  });

  it("excludes COVID years when toggled", () => {
    const bars = buildLinearSeries(utc(2019, 1, 1), 365 * 5); // covers 2019–2023
    const events = [utc(2019, 6, 1), utc(2020, 6, 1), utc(2021, 6, 1), utc(2022, 6, 1)];
    const withCovid = aggregateEventWindow(bars, "test", events, "EVENT_POST7", false);
    const withoutCovid = aggregateEventWindow(bars, "test", events, "EVENT_POST7", true);
    expect(withCovid.sampleSize).toBe(4);
    expect(withoutCovid.sampleSize).toBe(2); // 2020 + 2021 dropped
  });

  it("returns zero stats when no occurrence has enough data", () => {
    const bars = buildLinearSeries(utc(2024, 1, 1), 5); // only 5 bars
    const events = [utc(2024, 1, 3)]; // PRE30_PRE7 impossible
    const score = aggregateEventWindow(bars, "x", events, "PRE30_PRE7", false);
    expect(score.sampleSize).toBe(0);
    expect(score.avgReturn).toBe(0);
    expect(score.pctYearsPositive).toBe(0);
  });

  it("handles unsorted input by sorting defensively", () => {
    const sorted = buildLinearSeries(utc(2024, 1, 1), 100);
    const shuffled = [...sorted].reverse(); // reverse-sorted
    const event = sorted[50].date;
    const sortedScore = aggregateEventWindow(sorted, "t", [event], "PRE7_EVENT", false);
    const shuffledScore = aggregateEventWindow(shuffled, "t", [event], "PRE7_EVENT", false);
    expect(shuffledScore.avgReturn).toBeCloseTo(sortedScore.avgReturn, 10);
  });
});
