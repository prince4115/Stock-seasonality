/**
 * Festival event data access.
 */
import { prisma } from "@/lib/prisma";

export type UpcomingEvent = {
  slug: string;
  name: string;
  date: Date;
  daysUntil: number;
  durationDays: number;
  region: string;
  description: string | null;
  affects: Array<{ slug: string; name: string; weight: number }>;
};

const REGIONS = ["US", "IN", "CN", "global"] as const;
type Region = (typeof REGIONS)[number];

export function parseRegion(raw: string | null | undefined): Region | undefined {
  if (raw == null || raw === "") return undefined;
  return (REGIONS as readonly string[]).includes(raw) ? (raw as Region) : undefined;
}

/** Upcoming events (date >= today UTC), optionally filtered by region. */
export async function getUpcomingFestivals(
  opts: {
    limit?: number;
    region?: Region;
  } = {},
): Promise<UpcomingEvent[]> {
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const events = await prisma.festivalEvent.findMany({
    where: {
      date: { gte: today },
      ...(opts.region ? { region: opts.region } : {}),
    },
    orderBy: { date: "asc" },
    take: limit,
    include: {
      categories: {
        include: { category: { select: { slug: true, name: true } } },
      },
    },
  });

  const dayMs = 24 * 60 * 60 * 1000;
  return events.map((e) => ({
    slug: e.slug,
    name: e.name,
    date: e.date,
    daysUntil: Math.round((e.date.getTime() - today.getTime()) / dayMs),
    durationDays: e.durationDays,
    region: e.region,
    description: e.description,
    affects: e.categories.map((c) => ({
      slug: c.category.slug,
      name: c.category.name,
      weight: c.weight,
    })),
  }));
}
