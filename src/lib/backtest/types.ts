/**
 * Backtest types.
 *
 * The backtest answers one question honestly: if we had traded the
 * seasonality rules every month for the last N years — using only the data
 * that existed at each decision point — would we have beaten just buying
 * SPY? Everything here is pure data; the engine and strategy modules are
 * pure functions over it.
 */

/** "YYYY-MM" — the same month-key format the analysis library uses. */
export type MonthKey = string;

export type StrategyConfig = {
  /** Trailing years of history used to score a month. */
  windowYears: number;
  /** Maximum simultaneous positions per month (equal-weighted). */
  topK: number;
  /** Minimum years of history a (stock, month) needs to be eligible. */
  minSampleSize: number;
  /** Minimum fraction of past years positive to be eligible (0..1). */
  minPctPositive: number;
  /** One-way transaction cost in basis points (10 = 0.10% per side). */
  costBpsPerSide: number;
  /** First traded month, inclusive. */
  startMonth: MonthKey;
  /** Last traded month, inclusive. */
  endMonth: MonthKey;
};

export type CandidatePick = {
  ticker: string;
  /** Average same-calendar-month return across the window (the ranking key). */
  score: number;
  pctPositive: number;
  sampleSize: number;
};

export type MonthResult = {
  month: MonthKey;
  picks: CandidatePick[];
  /** Mean realized return across picks before costs (0 when in cash). */
  grossReturn: number;
  /** After round-trip transaction costs on invested slices. */
  netReturn: number;
  /** SPY's return for the same month; null when SPY has no data. */
  spyReturn: number | null;
  /** Picks that had no bars in the traded month (slice held as cash). */
  missedPicks: string[];
};

export type Metrics = {
  totalReturn: number;
  cagr: number;
  /** Annualized monthly Sharpe (mean/sd × √12, risk-free rate treated as 0). */
  sharpe: number;
  /** Max peak-to-trough drawdown as a positive fraction (0.25 = −25%). */
  maxDrawdown: number;
  /** Fraction of months with a positive return. */
  hitRate: number;
  nMonths: number;
};

export type EquityPoint = {
  month: MonthKey;
  strategy: number;
  spy: number;
};

export type BacktestResult = {
  config: StrategyConfig;
  months: MonthResult[];
  /** Cumulative equity, starting at 1.0 before the first traded month. */
  equityCurve: EquityPoint[];
  strategyMetrics: Metrics;
  spyMetrics: Metrics;
  /** Fraction of months the strategy outperformed SPY (months with SPY data). */
  pctMonthsBeatSpy: number;
  monthsInvested: number;
  monthsInCash: number;
};
