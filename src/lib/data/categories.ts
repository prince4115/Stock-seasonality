/**
 * Category data access. Thin wrapper around Prisma.
 */
import { prisma } from "@/lib/prisma";

export type CategorySummary = {
  slug: string;
  name: string;
  description: string | null;
  stockCount: number;
};

export type CategoryDetail = CategorySummary & {
  id: string;
};

/** All categories with a count of active (non-delisted) stocks. */
export async function getAllCategories(): Promise<CategorySummary[]> {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { stocks: { where: { delisted: false } } },
      },
    },
  });
  return categories.map((c) => ({
    slug: c.slug,
    name: c.name,
    description: c.description,
    stockCount: c._count.stocks,
  }));
}

/** One category by URL slug, or null. */
export async function getCategoryBySlug(slug: string): Promise<CategoryDetail | null> {
  const c = await prisma.category.findUnique({
    where: { slug },
    include: {
      _count: { select: { stocks: { where: { delisted: false } } } },
    },
  });
  if (!c) return null;
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    stockCount: c._count.stocks,
  };
}
