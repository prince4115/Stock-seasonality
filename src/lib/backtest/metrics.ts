/**
 * Performance metrics over a series of monthly returns. Pure functions.
 */
import type { Metrics } from "./types";

export function totalReturn(monthlyReturns: number[]): number {
  let equity = 1;
  for (const r of monthlyReturns) equity *= 1 + r;
  return equity - 1;
}

/** Annualized growth rate from monthly returns. 0 for an empty series. */
export function cagr(monthlyReturns: number[]): number {
  const n = monthlyReturns.length;
  if (n === 0) return 0;
  const total = totalReturn(monthlyReturns);
  return Math.pow(1 + total, 12 / n) - 1;
}

/**
 * Annualized Sharpe ratio with risk-free rate treated as 0: monthly
 * mean / sample standard deviation × √12. Returns 0 when the standard
 * deviation is 0 or there are fewer than 2 observations.
 */
export function sharpe(monthlyReturns: number[]): number {
  const n = monthlyReturns.length;
  if (n < 2) return 0;
  const mean = monthlyReturns.reduce((a, b) => a + b, 0) / n;
  const variance = monthlyReturns.reduce((a, r) => a + (r - mean) ** 2, 0) / (n - 1);
  const sd = Math.sqrt(variance);
  if (sd === 0) return 0;
  return (mean / sd) * Math.sqrt(12);
}

/** Max peak-to-trough drawdown as a positive fraction. */
export function maxDrawdown(monthlyReturns: number[]): number {
  let equity = 1;
  let peak = 1;
  let worst = 0;
  for (const r of monthlyReturns) {
    equity *= 1 + r;
    if (equity > peak) peak = equity;
    const dd = (peak - equity) / peak;
    if (dd > worst) worst = dd;
  }
  return worst;
}

/** Fraction of months with a strictly positive return. */
export function hitRate(monthlyReturns: number[]): number {
  if (monthlyReturns.length === 0) return 0;
  return monthlyReturns.filter((r) => r > 0).length / monthlyReturns.length;
}

export function computeMetrics(monthlyReturns: number[]): Metrics {
  return {
    totalReturn: totalReturn(monthlyReturns),
    cagr: cagr(monthlyReturns),
    sharpe: sharpe(monthlyReturns),
    maxDrawdown: maxDrawdown(monthlyReturns),
    hitRate: hitRate(monthlyReturns),
    nMonths: monthlyReturns.length,
  };
}
