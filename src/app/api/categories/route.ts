/**
 * GET /api/categories
 *
 * All consumer-spending categories with a count of active (non-delisted)
 * stocks. No query params. Used by the /categories grid.
 */
import { NextResponse } from "next/server";
import { getAllCategories } from "@/lib/data/categories";

export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await getAllCategories();
  return NextResponse.json({ categories });
}
