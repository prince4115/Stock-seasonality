/**
 * Stock data access.
 */
import { prisma } from "@/lib/prisma";

export type StockSummary = {
  ticker: string;
  name: string;
  exchange: string | null;
  delisted: boolean;
  delistedAt: Date | null;
  category: { slug: string; name: string };
};

export type StockDetail = StockSummary & { id: string };

/** Single stock by ticker (case-insensitive). */
export async function getStockByTicker(ticker: string): Promise<StockDetail | null> {
  const stock = await prisma.stock.findUnique({
    where: { ticker: ticker.toUpperCase() },
    include: { category: { select: { slug: true, name: true } } },
  });
  if (!stock) return null;
  return {
    id: stock.id,
    ticker: stock.ticker,
    name: stock.name,
    exchange: stock.exchange,
    delisted: stock.delisted,
    delistedAt: stock.delistedAt,
    category: stock.category,
  };
}

/**
 * Stocks in a category. By default delisted are excluded — pass
 * `includeDelisted: true` for the survivorship-aware view.
 */
export async function getStocksByCategorySlug(
  slug: string,
  opts: { includeDelisted?: boolean } = {},
): Promise<StockSummary[]> {
  const stocks = await prisma.stock.findMany({
    where: {
      category: { slug },
      delisted: opts.includeDelisted ? undefined : false,
    },
    orderBy: { ticker: "asc" },
    include: { category: { select: { slug: true, name: true } } },
  });
  return stocks.map((s) => ({
    ticker: s.ticker,
    name: s.name,
    exchange: s.exchange,
    delisted: s.delisted,
    delistedAt: s.delistedAt,
    category: s.category,
  }));
}
