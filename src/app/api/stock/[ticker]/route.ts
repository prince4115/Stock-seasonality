/**
 * GET /api/stock/[ticker]
 *
 * Stock detail: stock info, 12 monthly seasonality scores, and all
 * event-window scores (one per festival × window kind).
 *
 * Query params:
 *   window=5|10|15   (default 15)
 *   excludeCovid=1   (default false)
 */
import { type NextRequest, NextResponse } from "next/server";
import { getStockByTicker } from "@/lib/data/stocks";
import {
  getEventScores,
  getMonthlyScores,
  parseExcludeCovid,
  parseWindow,
} from "@/lib/data/scores";
import { SCORES_CACHE } from "@/lib/http-cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { ticker: string } }) {
  const stock = await getStockByTicker(params.ticker);
  if (!stock) {
    return NextResponse.json(
      { error: "ticker not found", ticker: params.ticker.toUpperCase() },
      { status: 404 },
    );
  }

  const url = new URL(req.url);
  const window = parseWindow(url.searchParams.get("window"));
  const excludeCovid = parseExcludeCovid(url.searchParams.get("excludeCovid"));

  const [monthly, eventWindows] = await Promise.all([
    getMonthlyScores(stock.id, window, excludeCovid),
    getEventScores(stock.id, excludeCovid),
  ]);

  return NextResponse.json(
    {
      stock: {
        ticker: stock.ticker,
        name: stock.name,
        exchange: stock.exchange,
        delisted: stock.delisted,
        delistedAt: stock.delistedAt,
        category: stock.category,
      },
      monthly,
      eventWindows,
      window,
      excludeCovid,
    },
    { headers: { "Cache-Control": SCORES_CACHE } },
  );
}
