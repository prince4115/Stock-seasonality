import type { Metadata } from "next";
import Link from "next/link";
import { Sparkline } from "@/components/charts/Sparkline";
import { PageHeader } from "@/components/PageHeader";
import { getAllCategories } from "@/lib/data/categories";
import { getCategoryMonthlyAggregate } from "@/lib/data/scores";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Categories",
  description:
    "Consumer-spending categories with seasonal patterns: travel, retail, food, apparel, jewelry, cinema, and more.",
};

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// /categories defaults to the 10y window, COVID included — the middle-ground
// view that lets every category be visible at a glance. Detail pages let
// users change the window.
const DEFAULT_WINDOW = 10;
const DEFAULT_EXCLUDE_COVID = false;

export default async function CategoriesPage() {
  const categories = await getAllCategories();

  // Parallel fetch of monthly aggregates per category.
  const aggregates = await Promise.all(
    categories.map((c) =>
      getCategoryMonthlyAggregate(c.slug, DEFAULT_WINDOW, DEFAULT_EXCLUDE_COVID),
    ),
  );

  return (
    <>
      <PageHeader
        eyebrow="Categories"
        title="Consumer-spending categories"
        description="Each card shows a 12-month seasonality sparkline over the trailing 10 years. Click in for the heatmap and top stocks."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category, idx) => {
          const agg = aggregates[idx];
          // Build a values array indexed by (month-1), or null if missing.
          const sparkValues: number[] = Array(12).fill(0);
          let hasData = false;
          for (const m of agg) {
            sparkValues[m.month - 1] = m.avgReturn;
            hasData = true;
          }
          const bestMonth = agg.reduce<(typeof agg)[number] | null>(
            (best, m) => (best == null || m.avgReturn > best.avgReturn ? m : best),
            null,
          );

          return (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="group rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/60"
            >
              <div className="flex items-baseline justify-between">
                <h2 className="text-base font-semibold text-zinc-900 group-hover:text-sky-700 dark:text-zinc-50 dark:group-hover:text-sky-300">
                  {category.name}
                </h2>
                <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                  {category.stockCount} stocks
                </span>
              </div>
              <p className="mt-1.5 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                {category.description ?? ""}
              </p>

              <div className="mt-4 flex items-end justify-between gap-3">
                <div className="text-xs">
                  {bestMonth && hasData ? (
                    <>
                      <p className="text-zinc-500 dark:text-zinc-400">Best month</p>
                      <p className="mt-0.5 font-semibold text-zinc-900 dark:text-zinc-100">
                        {MONTH_LABELS[bestMonth.month - 1]}{" "}
                        <span className="tabular-nums text-orange-700 dark:text-orange-400">
                          {bestMonth.avgReturn >= 0 ? "+" : ""}
                          {(bestMonth.avgReturn * 100).toFixed(1)}%
                        </span>
                      </p>
                      <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">
                        n={bestMonth.stocksCovered} stocks
                      </p>
                    </>
                  ) : (
                    <p className="text-zinc-400 dark:text-zinc-500">no data</p>
                  )}
                </div>
                <div className="flex max-w-[140px] flex-1 justify-end">
                  {hasData ? (
                    <Sparkline values={sparkValues} width={140} height={42} />
                  ) : (
                    <div className="h-[42px] w-[140px] rounded bg-zinc-50 dark:bg-zinc-800/40" />
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-zinc-500 dark:text-zinc-400">
        Sparklines compare average monthly returns Jan–Dec; dashed line is zero. Categories shown
        over the trailing 10 years with COVID years included.
      </p>
    </>
  );
}
