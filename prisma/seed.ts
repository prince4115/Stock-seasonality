/**
 * Phase 2 seed orchestrator.
 *
 * Run: `npm run db:seed` (or `npx prisma db seed`).
 *
 * Order matters:
 *   1. Categories (Stocks + festival-category links depend on these)
 *   2. Stocks (PriceHistory will reference these in Phase 2's ingestion step)
 *   3. FestivalEvents + festival↔category links
 *
 * Idempotent: every seed step upserts on a natural key (slug, ticker,
 * (slug, date)) so you can re-run after editing the seed data without
 * blowing away the database.
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { categoriesData } from "./seeds/categories";
import { stocksData } from "./seeds/stocks";
import { buildFestivalsData } from "./seeds/festivals";

async function seedCategories() {
  console.log(`[seed] categories: upserting ${categoriesData.length}`);
  for (const c of categoriesData) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description },
      create: c,
    });
  }
}

async function seedStocks() {
  console.log(`[seed] stocks: upserting ${stocksData.length}`);
  const categoriesBySlug = new Map((await prisma.category.findMany()).map((c) => [c.slug, c.id]));

  let missingCategory = 0;
  for (const s of stocksData) {
    const categoryId = categoriesBySlug.get(s.categorySlug);
    if (!categoryId) {
      console.warn(`[seed] stocks: skipping ${s.ticker} — unknown category "${s.categorySlug}"`);
      missingCategory++;
      continue;
    }

    await prisma.stock.upsert({
      where: { ticker: s.ticker },
      update: {
        name: s.name,
        exchange: s.exchange,
        currency: s.currency ?? "USD",
        delisted: s.delisted ?? false,
        delistedAt: s.delistedAt ?? null,
        categoryId,
      },
      create: {
        ticker: s.ticker,
        name: s.name,
        exchange: s.exchange,
        currency: s.currency ?? "USD",
        delisted: s.delisted ?? false,
        delistedAt: s.delistedAt ?? null,
        categoryId,
      },
    });
  }
  if (missingCategory > 0) {
    throw new Error(
      `[seed] ${missingCategory} stocks skipped due to unknown categories — fix categories.ts or stocks.ts`,
    );
  }
}

async function seedFestivals() {
  const festivals = buildFestivalsData();
  console.log(`[seed] festivals: upserting ${festivals.length} occurrences`);

  const categoriesBySlug = new Map((await prisma.category.findMany()).map((c) => [c.slug, c.id]));

  for (const f of festivals) {
    const event = await prisma.festivalEvent.upsert({
      where: { slug_date: { slug: f.slug, date: f.date } },
      update: {
        name: f.name,
        durationDays: f.durationDays ?? 1,
        region: f.region ?? "US",
        description: f.description ?? null,
      },
      create: {
        slug: f.slug,
        name: f.name,
        date: f.date,
        durationDays: f.durationDays ?? 1,
        region: f.region ?? "US",
        description: f.description ?? null,
      },
    });

    // Replace category links for this occurrence so weight changes in seed
    // propagate cleanly.
    await prisma.festivalEventCategory.deleteMany({
      where: { festivalEventId: event.id },
    });
    for (const link of f.affects ?? []) {
      const categoryId = categoriesBySlug.get(link.categorySlug);
      if (!categoryId) {
        console.warn(
          `[seed] festivals: ${f.slug} ${f.date.toISOString().slice(0, 10)} — unknown category "${link.categorySlug}"`,
        );
        continue;
      }
      await prisma.festivalEventCategory.create({
        data: {
          festivalEventId: event.id,
          categoryId,
          weight: link.weight ?? 1.0,
        },
      });
    }
  }
}

async function main() {
  console.log("[seed] starting");
  await seedCategories();
  await seedStocks();
  await seedFestivals();
  console.log("[seed] done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
