/**
 * GET /api/category/[slug]
 *
 * Category detail: category info, its stocks, monthly aggregate heatmap
 * across the category, and the top seasonal stocks for each month.
 *
 * Query params:
 *   window=5|10|15   (default 15)
 *   excludeCovid=1   (default false)
 *   topPerMonth=N    (default 3, max 10)
 */
import { type NextRequest, NextResponse } from "next/server";
import { getCategoryBySlug } from "@/lib/data/categories";
import { getStocksByCategorySlug } from "@/lib/data/stocks";
import {
  getCategoryMonthlyAggregate,
  getTopSeasonalStocksForMonth,
  parseExcludeCovid,
  parseWindow,
} from "@/lib/data/scores";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params.slug;
  const category = await getCategoryBySlug(slug);
  if (!category) {
    return NextResponse.json({ error: "category not found", slug }, { status: 404 });
  }

  const url = new URL(req.url);
  const window = parseWindow(url.searchParams.get("window"));
  const excludeCovid = parseExcludeCovid(url.searchParams.get("excludeCovid"));
  const topPerMonth = Math.min(Math.max(Number(url.searchParams.get("topPerMonth") ?? 3), 1), 10);

  const [stocks, monthlyAggregate] = await Promise.all([
    getStocksByCategorySlug(slug),
    getCategoryMonthlyAggregate(slug, window, excludeCovid),
  ]);

  // Fetch top stocks per month in parallel.
  const topByMonth = await Promise.all(
    Array.from({ length: 12 }, (_, i) =>
      getTopSeasonalStocksForMonth(slug, i + 1, window, excludeCovid, topPerMonth),
    ),
  );

  return NextResponse.json({
    category,
    stocks,
    monthlyAggregate,
    topStocksByMonth: topByMonth.map((stocks, i) => ({ month: i + 1, stocks })),
    window,
    excludeCovid,
  });
}
