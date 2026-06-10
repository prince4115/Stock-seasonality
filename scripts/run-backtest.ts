#!/usr/bin/env tsx
/**
 * Phase 7 backtest CLI.
 *
 * Walk-forward simulation of the monthly seasonality strategy against the
 * full PriceHistory table, benchmarked against SPY buy-and-hold.
 *
 * Usage
 * -----
 *   npm run backtest                                  # defaults below
 *   npm run backtest -- --top-k 3 --cost-bps 20
 *   npm run backtest -- --start 2018-01 --end 2025-12
 *   npm run backtest -- --out docs/backtest/k3.md     # custom report path
 *
 * Defaults: window 10y, top-k 5, min-n 5, min-pos 0.6, cost 10 bps/side,
 * start 2017-01, end = last fully completed month. Reports are written to
 * docs/backtest/latest.md + latest.json unless --out overrides the name.
 */
import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { PriceBar } from "../src/lib/analysis/types";
import { runBacktest } from "../src/lib/backtest/engine";
import { makeMonthKey, parseMonthKey } from "../src/lib/backtest/months";
import type { BacktestResult, StrategyConfig } from "../src/lib/backtest/types";
import { prisma } from "../src/lib/prisma";

function lastCompletedMonth(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth(); // 0-based; as 1-based this is "previous month"
  return m === 0 ? makeMonthKey(y - 1, 12) : makeMonthKey(y, m);
}

function parseArgs(): { config: StrategyConfig; outPath: string | null } {
  const args = process.argv.slice(2);
  const config: StrategyConfig = {
    windowYears: 10,
    topK: 5,
    minSampleSize: 5,
    minPctPositive: 0.6,
    costBpsPerSide: 10,
    startMonth: "2017-01",
    endMonth: lastCompletedMonth(),
  };
  let outPath: string | null = null;

  for (let i = 0; i < args.length; i++) {
    const next = () => {
      const v = args[++i];
      if (v === undefined) throw new Error(`missing value after ${args[i - 1]}`);
      return v;
    };
    switch (args[i]) {
      case "--window":
        config.windowYears = Number(next());
        break;
      case "--top-k":
        config.topK = Number(next());
        break;
      case "--min-n":
        config.minSampleSize = Number(next());
        break;
      case "--min-pos":
        config.minPctPositive = Number(next());
        break;
      case "--cost-bps":
        config.costBpsPerSide = Number(next());
        break;
      case "--start":
        config.startMonth = next();
        break;
      case "--end":
        config.endMonth = next();
        break;
      case "--out":
        outPath = next();
        break;
      default:
        throw new Error(`unknown flag: ${args[i]}`);
    }
  }
  parseMonthKey(config.startMonth);
  parseMonthKey(config.endMonth);
  return { config, outPath };
}

async function loadBars(): Promise<{
  barsByTicker: Map<string, PriceBar[]>;
  spyBars: PriceBar[];
}> {
  const stocks = await prisma.stock.findMany({
    where: { category: { slug: { not: "benchmark" } } },
    select: { id: true, ticker: true },
    orderBy: { ticker: "asc" },
  });

  const barsByTicker = new Map<string, PriceBar[]>();
  for (const stock of stocks) {
    const rows = await prisma.priceHistory.findMany({
      where: { stockId: stock.id },
      select: { date: true, adjClose: true },
      orderBy: { date: "asc" },
    });
    if (rows.length === 0) continue;
    barsByTicker.set(
      stock.ticker,
      rows.map((r) => ({ date: r.date, adjClose: Number(r.adjClose) })),
    );
  }

  const spy = await prisma.stock.findUnique({
    where: { ticker: "SPY" },
    select: { id: true },
  });
  if (!spy) {
    throw new Error("SPY not found — run `npm run db:seed` then ingest SPY first.");
  }
  const spyRows = await prisma.priceHistory.findMany({
    where: { stockId: spy.id },
    select: { date: true, adjClose: true },
    orderBy: { date: "asc" },
  });
  if (spyRows.length === 0) {
    throw new Error(
      "SPY has no price history — run `python ingest_prices.py --ticker SPY --window 15y`.",
    );
  }

  return {
    barsByTicker,
    spyBars: spyRows.map((r) => ({ date: r.date, adjClose: Number(r.adjClose) })),
  };
}

const pct = (v: number, digits = 1) => `${v >= 0 ? "+" : ""}${(v * 100).toFixed(digits)}%`;

function yearlyBreakdown(result: BacktestResult): Array<{
  year: number;
  strategy: number;
  spy: number;
}> {
  const byYear = new Map<number, { s: number; b: number }>();
  for (const m of result.months) {
    const { year } = parseMonthKey(m.month);
    const acc = byYear.get(year) ?? { s: 1, b: 1 };
    acc.s *= 1 + m.netReturn;
    acc.b *= 1 + (m.spyReturn ?? 0);
    byYear.set(year, acc);
  }
  return Array.from(byYear.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, { s, b }]) => ({ year, strategy: s - 1, spy: b - 1 }));
}

function buildMarkdownReport(result: BacktestResult): string {
  const c = result.config;
  const s = result.strategyMetrics;
  const b = result.spyMetrics;
  const years = yearlyBreakdown(result);

  const lines: string[] = [];
  lines.push(`# Backtest report`);
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString().slice(0, 10)}`);
  lines.push("");
  lines.push(`## Configuration`);
  lines.push("");
  lines.push(`| Parameter | Value |`);
  lines.push(`| --- | --- |`);
  lines.push(`| Window | ${c.windowYears}y |`);
  lines.push(`| Top K | ${c.topK} |`);
  lines.push(`| Min sample size | ${c.minSampleSize} |`);
  lines.push(`| Min % positive | ${(c.minPctPositive * 100).toFixed(0)}% |`);
  lines.push(`| Cost per side | ${c.costBpsPerSide} bps |`);
  lines.push(`| Period | ${c.startMonth} → ${c.endMonth} |`);
  lines.push("");
  lines.push(`## Headline (strategy vs SPY buy-and-hold)`);
  lines.push("");
  lines.push(`| Metric | Strategy | SPY |`);
  lines.push(`| --- | ---: | ---: |`);
  lines.push(`| Total return | ${pct(s.totalReturn)} | ${pct(b.totalReturn)} |`);
  lines.push(`| CAGR | ${pct(s.cagr)} | ${pct(b.cagr)} |`);
  lines.push(`| Sharpe (rf=0) | ${s.sharpe.toFixed(2)} | ${b.sharpe.toFixed(2)} |`);
  lines.push(
    `| Max drawdown | −${(s.maxDrawdown * 100).toFixed(1)}% | −${(b.maxDrawdown * 100).toFixed(1)}% |`,
  );
  lines.push(
    `| Hit rate (months > 0) | ${(s.hitRate * 100).toFixed(0)}% | ${(b.hitRate * 100).toFixed(0)}% |`,
  );
  lines.push(`| Months | ${s.nMonths} | ${b.nMonths} |`);
  lines.push("");
  lines.push(
    `Months invested: ${result.monthsInvested} · in cash: ${result.monthsInCash} · ` +
      `beat SPY in ${(result.pctMonthsBeatSpy * 100).toFixed(0)}% of months`,
  );
  lines.push("");
  lines.push(`## Year by year (net)`);
  lines.push("");
  lines.push(`| Year | Strategy | SPY |`);
  lines.push(`| --- | ---: | ---: |`);
  for (const y of years) {
    lines.push(`| ${y.year} | ${pct(y.strategy)} | ${pct(y.spy)} |`);
  }
  lines.push("");
  lines.push(`## Caveats`);
  lines.push("");
  lines.push(`- Raw total returns; no market/factor adjustment. A bull market lifts both columns.`);
  lines.push(
    `- Equal-weighted, full monthly turnover assumed; cost model is ${c.costBpsPerSide} bps per side, no slippage or market impact.`,
  );
  lines.push(
    `- Strategy thresholds were not optimized out-of-sample — treat results as descriptive, not predictive.`,
  );
  lines.push(`- Not investment advice. Past patterns do not guarantee future results.`);
  lines.push("");
  return lines.join("\n");
}

async function main() {
  const { config, outPath } = parseArgs();
  console.log(`[backtest] config: ${JSON.stringify(config)}`);

  const { barsByTicker, spyBars } = await loadBars();
  console.log(`[backtest] loaded ${barsByTicker.size} candidate tickers + SPY`);

  const result = runBacktest({ barsByTicker, spyBars, config });

  const s = result.strategyMetrics;
  const b = result.spyMetrics;
  console.log("");
  console.log(`            Strategy      SPY`);
  console.log(`Total     ${pct(s.totalReturn).padStart(9)} ${pct(b.totalReturn).padStart(9)}`);
  console.log(`CAGR      ${pct(s.cagr).padStart(9)} ${pct(b.cagr).padStart(9)}`);
  console.log(`Sharpe    ${s.sharpe.toFixed(2).padStart(9)} ${b.sharpe.toFixed(2).padStart(9)}`);
  console.log(
    `Max DD    ${("−" + (s.maxDrawdown * 100).toFixed(1) + "%").padStart(9)} ${("−" + (b.maxDrawdown * 100).toFixed(1) + "%").padStart(9)}`,
  );
  console.log(
    `Hit rate  ${((s.hitRate * 100).toFixed(0) + "%").padStart(9)} ${((b.hitRate * 100).toFixed(0) + "%").padStart(9)}`,
  );
  console.log("");
  console.log(
    `invested ${result.monthsInvested} months, cash ${result.monthsInCash}, beat SPY ${(result.pctMonthsBeatSpy * 100).toFixed(0)}% of months`,
  );

  const mdPath = outPath ?? join("docs", "backtest", "latest.md");
  const jsonPath = mdPath.replace(/\.md$/, ".json");
  mkdirSync(dirname(mdPath), { recursive: true });
  writeFileSync(mdPath, buildMarkdownReport(result));
  writeFileSync(
    jsonPath,
    JSON.stringify(
      { config: result.config, strategyMetrics: s, spyMetrics: b, months: result.months },
      null,
      2,
    ),
  );
  console.log(`[backtest] report written: ${mdPath} + ${jsonPath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
