/**
 * Shared types for the analysis library.
 *
 * Bars are normalized into plain JS values at the I/O boundary
 * (src/lib/analysis/run.ts) so the pure-function modules never have to
 * touch Prisma's Decimal type.
 */
export type PriceBar = {
  /** UTC midnight on the bar's trading day. */
  date: Date;
  /** Split- and dividend-adjusted close. Used for all return math. */
  adjClose: number;
};

export type SeasonalityOptions = {
  /** How many trailing years from `asOf` to include. 5 / 10 / 15. */
  windowYears: number;
  /** Reference date — usually today. Used as the right edge of the window. */
  asOf: Date;
  /** Drop bars dated 2020-01-01 .. 2021-12-31 inclusive. */
  excludeCovid: boolean;
};

export type MonthScore = {
  month: number; // 1..12
  avgReturn: number;
  pctYearsPositive: number; // 0..1
  /**
   * Fraction of years where this month's return exceeded the stock's
   * overall mean monthly return across the window. Matches the brief's
   * "% of years a month was positive AND beat the stock's overall mean".
   */
  pctYearsBeatMean: number; // 0..1
  sampleSize: number; // years with data for this (stock, month)
};

export type EventWindowKind = "PRE30_PRE7" | "PRE7_EVENT" | "EVENT_POST7";

export const EVENT_WINDOW_KINDS: EventWindowKind[] = ["PRE30_PRE7", "PRE7_EVENT", "EVENT_POST7"];

export type EventScore = {
  festivalSlug: string;
  windowKind: EventWindowKind;
  avgReturn: number;
  pctYearsPositive: number;
  sampleSize: number; // occurrences with enough data to compute the window
};
