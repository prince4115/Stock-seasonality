/**
 * GET /api/events/upcoming
 *
 * Upcoming festival occurrences (date >= today UTC).
 *
 * Query params:
 *   limit=N           (default 20, max 100)
 *   region=US|IN|CN|global (optional)
 */
import { type NextRequest, NextResponse } from "next/server";
import { getUpcomingFestivals, parseRegion } from "@/lib/data/festivals";
import { EVENTS_CACHE } from "@/lib/http-cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const rawLimit = url.searchParams.get("limit");
  const limit = rawLimit ? Number(rawLimit) : 20;
  const region = parseRegion(url.searchParams.get("region"));

  const events = await getUpcomingFestivals({ limit, region });
  return NextResponse.json(
    { events, region, limit },
    { headers: { "Cache-Control": EVENTS_CACHE } },
  );
}
