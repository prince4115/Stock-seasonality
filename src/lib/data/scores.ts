/**
 * SeasonalityScore + EventWindowScore data access.
 *
 * Phase 3 populated these tables; Phase 4 reads from them. We never compute
 * scores on a request path — the brief calls for "cache aggressively;
 * historical seasonality doesn't change minute to minute".
 */
import { prisma } from "@/lib/prisma";

export type WindowYears = 5 | 10 | 15;

const ALLOWED_WINDOWS: WindowYears[] = [5, 10, 15];

/** Validate + coerce a window query param. Returns null if invalid. */
export function parseWindow(
  raw: string | null | undefined,
  fallback: WindowYears = 15,
): WindowYears {
  if (raw == null || raw === "") return fallback;
  const n = Number(raw.replace(/y$/i, ""));
  return ALLOWED_WINDOWS.includes(n as WindowYears) ? (n as WindowYears) : fallback;
}

/** Parse the excludeCovid query param. */
export function parseExcludeCovid(raw: string | null | undefined): boolean {
  if (raw == null) return false;
  return raw === "1" || raw.toLowerCase() === "true";
}

export type MonthlyScore = {
  month: number;
  avgReturn: number;
  pctYearsPositive: number;
  pctYearsBeatMean: number;
  sampleSize: number;
};

export async function getMonthlyScores(
  stockId: string,
  windowYears: WindowYears,
  excludeCovid: boolean,
): Promise<MonthlyScore[]> {
  const rows = await prisma.seasonalityScore.findMany({
    where: { stockId, windowYears, excludeCovid },
    orderBy: { month: "asc" },
    select: {
      month: true,
      avgReturn: true,
      pctYearsPositive: true,
      pctYearsBeatMean: true,
      sampleSize: true,
    },
  });
  return rows;
}

export type EventScoreRow = {
  festivalSlug: string;
  windowKind: "PRE30_PRE7" | "PRE7_EVENT" | "EVENT_POST7";
  avgReturn: number;
  pctYearsPositive: number;
  sampleSize: number;
};

export async function getEventScores(
  stockId: string,
  excludeCovid: boolean,
): Promise<EventScoreRow[]> {
  const rows = await prisma.eventWindowScore.findMany({
    where: { stockId, excludeCovid },
    orderBy: [{ festivalSlug: "asc" }, { windowKind: "asc" }],
    select: {
      festivalSlug: true,
      windowKind: true,
      avgReturn: true,
      pctYearsPositive: true,
      sampleSize: true,
    },
  });
  return rows as EventScoreRow[];
}

/**
 * Category-level monthly aggregate: averages avgReturn across all
 * non-delisted stocks for each (windowYears, excludeCovid). Used by the
 * /category/[slug] heatmap.
 */
export type CategoryMonthly = {
  month: number;
  avgReturn: number;
  stocksCovered: number;
};

export async function getCategoryMonthlyAggregate(
  categorySlug: string,
  windowYears: WindowYears,
  excludeCovid: boolean,
): Promise<CategoryMonthly[]> {
  const rows = await prisma.$queryRaw<
    Array<{ month: number; avg_return: number; n_stocks: bigint }>
  >`
    SELECT
      s.month AS month,
      AVG(s."avgReturn") AS avg_return,
      COUNT(DISTINCT st.id) AS n_stocks
    FROM "SeasonalityScore" s
    JOIN "Stock" st ON st.id = s."stockId"
    JOIN "Category" c ON c.id = st."categoryId"
    WHERE c.slug = ${categorySlug}
      AND s."windowYears" = ${windowYears}
      AND s."excludeCovid" = ${excludeCovid}
      AND st.delisted = false
    GROUP BY s.month
    ORDER BY s.month
  `;
  return rows.map((r) => ({
    month: r.month,
    avgReturn: Number(r.avg_return),
    stocksCovered: Number(r.n_stocks),
  }));
}

/** Top N stocks in a category by avgReturn for a given month. */
export async function getTopSeasonalStocksForMonth(
  categorySlug: string,
  month: number,
  windowYears: WindowYears,
  excludeCovid: boolean,
  limit = 5,
) {
  const rows = await prisma.seasonalityScore.findMany({
    where: {
      month,
      windowYears,
      excludeCovid,
      stock: { category: { slug: categorySlug }, delisted: false },
    },
    orderBy: { avgReturn: "desc" },
    take: limit,
    select: {
      avgReturn: true,
      pctYearsPositive: true,
      sampleSize: true,
      stock: { select: { ticker: true, name: true } },
    },
  });
  return rows.map((r) => ({
    ticker: r.stock.ticker,
    name: r.stock.name,
    avgReturn: r.avgReturn,
    pctYearsPositive: r.pctYearsPositive,
    sampleSize: r.sampleSize,
  }));
}
