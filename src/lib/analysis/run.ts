/**
 * DB orchestrator for the analysis engine.
 *
 * Reads PriceHistory from Prisma, runs the pure-function modules, writes
 * results to SeasonalityScore + EventWindowScore.
 *
 * Strategy: per stock, delete the old cached scores and createMany the new
 * batch inside a transaction. That's ~4 SQL round-trips per stock regardless
 * of row count — much faster than ~150 individual upserts. Idempotent.
 */
import { prisma } from "@/lib/prisma";
import { aggregateEventWindow } from "./event-window";
import { computeSeasonality } from "./seasonality";
import { EVENT_WINDOW_KINDS, type PriceBar } from "./types";

const DEFAULT_WINDOW_YEARS = [5, 10, 15] as const;
const COVID_TOGGLES = [false, true] as const;

export type AnalysisOptions = {
  /** If set, only analyze this ticker. Otherwise: all stocks (filtered by `includeDelisted`). */
  ticker?: string;
  /** If set, only this trailing-year window. Otherwise: 5, 10, 15. */
  windowYears?: number;
  /** Right edge of the analysis window. Defaults to "now". */
  asOf?: Date;
  /** Include delisted stocks. Default false. */
  includeDelisted?: boolean;
  /** Logger hook. Defaults to console.log. */
  log?: (msg: string) => void;
};

type StockRow = { id: string; ticker: string; delisted: boolean };

type RunResult = {
  stocksProcessed: number;
  stocksSkippedNoData: number;
  seasonalityRows: number;
  eventWindowRows: number;
  durationMs: number;
};

/**
 * Convert Prisma's PriceHistory rows into plain PriceBar values. Prisma's
 * Decimal type stringifies cleanly, so Number() on either Decimal, string,
 * or raw number works.
 */
async function fetchBarsForStock(stockId: string): Promise<PriceBar[]> {
  const rows = await prisma.priceHistory.findMany({
    where: { stockId },
    select: { date: true, adjClose: true },
    orderBy: { date: "asc" },
  });
  return rows.map((r) => ({ date: r.date, adjClose: Number(r.adjClose) }));
}

async function fetchFestivalOccurrencesBySlug(): Promise<Map<string, Date[]>> {
  const events = await prisma.festivalEvent.findMany({
    select: { slug: true, date: true },
    orderBy: { date: "asc" },
  });
  const out = new Map<string, Date[]>();
  for (const e of events) {
    const arr = out.get(e.slug);
    if (arr) arr.push(e.date);
    else out.set(e.slug, [e.date]);
  }
  return out;
}

async function analyzeOneStock(
  stock: StockRow,
  asOf: Date,
  windowYears: readonly number[],
  festivalsBySlug: Map<string, Date[]>,
): Promise<{ seasonalityRows: number; eventWindowRows: number; skipped: boolean }> {
  const bars = await fetchBarsForStock(stock.id);
  if (bars.length === 0) {
    return { seasonalityRows: 0, eventWindowRows: 0, skipped: true };
  }

  // Build the seasonality rows in memory first.
  const seasonalityRows: Array<{
    stockId: string;
    windowYears: number;
    month: number;
    avgReturn: number;
    pctYearsPositive: number;
    pctYearsBeatMean: number;
    sampleSize: number;
    excludeCovid: boolean;
  }> = [];

  for (const w of windowYears) {
    for (const excludeCovid of COVID_TOGGLES) {
      const scores = computeSeasonality(bars, {
        windowYears: w,
        asOf,
        excludeCovid,
      });
      for (const s of scores) {
        if (s.sampleSize === 0) continue;
        seasonalityRows.push({
          stockId: stock.id,
          windowYears: w,
          month: s.month,
          avgReturn: s.avgReturn,
          pctYearsPositive: s.pctYearsPositive,
          pctYearsBeatMean: s.pctYearsBeatMean,
          sampleSize: s.sampleSize,
          excludeCovid,
        });
      }
    }
  }

  // Build the event-window rows. windowKind is a Prisma enum; we pass the
  // string literal and Prisma maps it.
  const eventWindowRows: Array<{
    stockId: string;
    festivalSlug: string;
    windowKind: (typeof EVENT_WINDOW_KINDS)[number];
    avgReturn: number;
    pctYearsPositive: number;
    sampleSize: number;
    excludeCovid: boolean;
  }> = [];

  for (const excludeCovid of COVID_TOGGLES) {
    for (const [slug, dates] of festivalsBySlug) {
      for (const kind of EVENT_WINDOW_KINDS) {
        const score = aggregateEventWindow(bars, slug, dates, kind, excludeCovid);
        if (score.sampleSize === 0) continue;
        eventWindowRows.push({
          stockId: stock.id,
          festivalSlug: slug,
          windowKind: kind,
          avgReturn: score.avgReturn,
          pctYearsPositive: score.pctYearsPositive,
          sampleSize: score.sampleSize,
          excludeCovid,
        });
      }
    }
  }

  // Atomic delete-then-createMany. If the createMany throws, the deleteMany
  // rolls back too, leaving last run's cache intact.
  await prisma.$transaction([
    prisma.seasonalityScore.deleteMany({ where: { stockId: stock.id } }),
    prisma.seasonalityScore.createMany({ data: seasonalityRows }),
    prisma.eventWindowScore.deleteMany({ where: { stockId: stock.id } }),
    prisma.eventWindowScore.createMany({ data: eventWindowRows }),
  ]);

  return {
    seasonalityRows: seasonalityRows.length,
    eventWindowRows: eventWindowRows.length,
    skipped: false,
  };
}

export async function runAnalysis(options: AnalysisOptions = {}): Promise<RunResult> {
  const log = options.log ?? ((m: string) => console.log(m));
  const asOf = options.asOf ?? new Date();
  const windowYears = options.windowYears ? [options.windowYears] : DEFAULT_WINDOW_YEARS;

  const startedAt = Date.now();

  const stocks: StockRow[] = await prisma.stock.findMany({
    where: {
      ticker: options.ticker ? options.ticker.toUpperCase() : undefined,
      delisted: options.includeDelisted ? undefined : false,
    },
    select: { id: true, ticker: true, delisted: true },
    orderBy: { ticker: "asc" },
  });

  log(
    `[analysis] ${stocks.length} stock(s), windows=${windowYears.join(",")} asOf=${asOf.toISOString().slice(0, 10)}`,
  );

  const festivalsBySlug = await fetchFestivalOccurrencesBySlug();
  log(
    `[analysis] ${festivalsBySlug.size} festival slug(s) across ${[...festivalsBySlug.values()].reduce((a, b) => a + b.length, 0)} occurrences`,
  );

  let stocksProcessed = 0;
  let stocksSkippedNoData = 0;
  let seasonalityRows = 0;
  let eventWindowRows = 0;

  for (const stock of stocks) {
    const tag = stock.delisted ? " [DELISTED]" : "";
    try {
      const result = await analyzeOneStock(stock, asOf, windowYears, festivalsBySlug);
      if (result.skipped) {
        log(`  - ${stock.ticker}${tag} — no price history, skipped`);
        stocksSkippedNoData++;
        continue;
      }
      log(
        `  + ${stock.ticker}${tag} — ${result.seasonalityRows} season + ${result.eventWindowRows} event-window`,
      );
      stocksProcessed++;
      seasonalityRows += result.seasonalityRows;
      eventWindowRows += result.eventWindowRows;
    } catch (e) {
      log(`  ! ${stock.ticker}${tag} — error: ${(e as Error).message}`);
    }
  }

  const durationMs = Date.now() - startedAt;
  log(
    `[analysis] done in ${(durationMs / 1000).toFixed(1)}s — ${stocksProcessed} stocks, ${seasonalityRows} season rows, ${eventWindowRows} event-window rows (${stocksSkippedNoData} skipped)`,
  );

  return {
    stocksProcessed,
    stocksSkippedNoData,
    seasonalityRows,
    eventWindowRows,
    durationMs,
  };
}
