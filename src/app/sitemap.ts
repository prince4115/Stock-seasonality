/**
 * Generated /sitemap.xml — Next.js 14 picks this up automatically.
 *
 * We enumerate the static pages plus every active stock + category. The
 * lists come from Prisma at build/request time so newly seeded tickers
 * show up without a code change.
 */
import type { MetadataRoute } from "next";
import { getAllCategories } from "@/lib/data/categories";
import { prisma } from "@/lib/prisma";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [categories, stocks] = await Promise.all([
    getAllCategories(),
    prisma.stock.findMany({
      where: { delisted: false },
      select: { ticker: true },
      orderBy: { ticker: "asc" },
    }),
  ]);

  const staticPaths: MetadataRoute.Sitemap = [
    { url: `${APP_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${APP_URL}/categories`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${APP_URL}/calendar`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${APP_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  const categoryPaths: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${APP_URL}/category/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const stockPaths: MetadataRoute.Sitemap = stocks.map((s) => ({
    url: `${APP_URL}/stock/${s.ticker}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPaths, ...categoryPaths, ...stockPaths];
}
