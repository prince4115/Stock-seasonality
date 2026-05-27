import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnalysisControls } from "@/components/controls/AnalysisControls";
import { Heatmap, type HeatmapRow } from "@/components/charts/Heatmap";
import { PageHeader } from "@/components/PageHeader";
import { StatNumber } from "@/components/StatNumber";
import { getCategoryBySlug } from "@/lib/data/categories";
import { getUpcomingFestivals } from "@/lib/data/festivals";
import {
  getCategoryMonthlyAggregate,
  getTopSeasonalStocksForMonth,
  parseExcludeCovid,
  parseWindow,
} from "@/lib/data/scores";
import { getStocksByCategorySlug } from "@/lib/data/stocks";

export const dynamic = "force-dynamic";

type Props = {
  params: { slug: string };
  searchParams: { window?: string; excludeCovid?: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategoryBySlug(params.slug);
  return {
    title: category?.name ?? "Category",
    description: category?.description ?? `Seasonality patterns for the ${params.slug} category.`,
  };
}

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

export default async function CategoryDetailPage({ params, searchParams }: Props) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) {
    notFound();
  }

  const window = parseWindow(searchParams.window);
  const excludeCovid = parseExcludeCovid(searchParams.excludeCovid);

  const [stocks, monthlyAgg, upcomingFestivals] = await Promise.all([
    getStocksByCategorySlug(category.slug, { includeDelisted: true }),
    getCategoryMonthlyAggregate(category.slug, window, excludeCovid),
    getUpcomingFestivals({ limit: 40 }),
  ]);

  // Top 3 per month, parallel.
  const topByMonth = await Promise.all(
    Array.from({ length: 12 }, (_, i) =>
      getTopSeasonalStocksForMonth(category.slug, i + 1, window, excludeCovid, 3),
    ),
  );

  // Heatmap row from monthly aggregate.
  const aggByMonth: Array<{ avgReturn: number; n: number } | null> = Array(12).fill(null);
  for (const m of monthlyAgg) {
    aggByMonth[m.month - 1] = { avgReturn: m.avgReturn, n: m.stocksCovered };
  }
  const aggregateRow: HeatmapRow[] = [
    {
      label: "category avg",
      values: aggByMonth.map((c) => c?.avgReturn ?? null),
      sampleSizes: aggByMonth.map((c) => c?.n ?? 0),
    },
  ];

  // Best/worst aggregate months.
  const validAggMonths = monthlyAgg.filter((m) => m.stocksCovered > 0);
  const bestAgg = validAggMonths.reduce<(typeof validAggMonths)[number] | null>(
    (best, m) => (best == null || m.avgReturn > best.avgReturn ? m : best),
    null,
  );
  const worstAgg = validAggMonths.reduce<(typeof validAggMonths)[number] | null>(
    (worst, m) => (worst == null || m.avgReturn < worst.avgReturn ? m : worst),
    null,
  );

  // Related festivals: any upcoming festival whose `affects` includes this category.
  const relatedFestivals = upcomingFestivals.filter((f) =>
    f.affects.some((a) => a.slug === category.slug),
  );

  const activeStocks = stocks.filter((s) => !s.delisted);
  const delistedStocks = stocks.filter((s) => s.delisted);

  return (
    <>
      <PageHeader
        eyebrow="Category"
        title={category.name}
        description={
          category.description ??
          `Consumer-spending category with ${category.stockCount} active stocks.`
        }
      />

      <div className="mb-6">
        <AnalysisControls window={window} excludeCovid={excludeCovid} />
      </div>

      {validAggMonths.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400">
          <p className="font-medium text-zinc-700 dark:text-zinc-300">No analysis data</p>
          <p className="mt-2">
            No cached seasonality scores for this category at the {window}y window.
          </p>
        </div>
      ) : (
        <>
          <section className="mb-8 grid grid-cols-2 gap-6 rounded-lg border border-zinc-200 bg-white p-5 sm:grid-cols-4 dark:border-zinc-800 dark:bg-zinc-900">
            <StatNumber
              label="Active stocks"
              value={null}
              size="md"
              secondary={`${activeStocks.length} (+${delistedStocks.length} delisted)`}
            />
            <StatNumber
              label={`Best month (${window}y avg)`}
              value={bestAgg?.avgReturn ?? null}
              n={bestAgg?.stocksCovered}
              secondary={bestAgg ? MONTH_LABELS[bestAgg.month - 1] : undefined}
            />
            <StatNumber
              label={`Worst month (${window}y avg)`}
              value={worstAgg?.avgReturn ?? null}
              n={worstAgg?.stocksCovered}
              secondary={worstAgg ? MONTH_LABELS[worstAgg.month - 1] : undefined}
            />
            <StatNumber
              label="Upcoming events"
              value={null}
              size="md"
              secondary={`${relatedFestivals.length} affecting this category`}
            />
          </section>

          <section className="mb-10">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Category-wide monthly pattern
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                avg return across all {activeStocks.length} active stocks · n=stocks covered
              </p>
            </div>
            <Heatmap rows={aggregateRow} colLabels={MONTH_LABELS} />
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Top seasonal stocks by month
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {topByMonth.map((stocks, i) => {
                const month = MONTH_LABELS[i];
                return (
                  <div
                    key={month}
                    className="rounded-lg border border-zinc-200 bg-white p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <p className="mb-2 font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      {month}
                    </p>
                    {stocks.length === 0 ? (
                      <p className="text-zinc-400">no data</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {stocks.map((s) => (
                          <li key={s.ticker} className="flex items-center justify-between gap-2">
                            <Link
                              href={`/stock/${s.ticker}`}
                              className="font-medium text-zinc-800 hover:underline dark:text-zinc-200"
                            >
                              {s.ticker}
                            </Link>
                            <span className="tabular-nums text-zinc-700 dark:text-zinc-300">
                              {s.avgReturn >= 0 ? "+" : ""}
                              {(s.avgReturn * 100).toFixed(1)}%
                            </span>
                            <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
                              n={s.sampleSize}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      <section className="mb-10">
        <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Stocks in this category ({activeStocks.length})
        </h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Ticker</th>
                <th className="px-4 py-2 text-left font-medium">Name</th>
                <th className="px-4 py-2 text-left font-medium">Exchange</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {[...activeStocks, ...delistedStocks].map((s) => (
                <tr
                  key={s.ticker}
                  className="bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                >
                  <td className="px-4 py-2">
                    <Link
                      href={`/stock/${s.ticker}`}
                      className="font-medium text-sky-700 hover:underline dark:text-sky-400"
                    >
                      {s.ticker}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">{s.name}</td>
                  <td className="px-4 py-2 text-zinc-500 dark:text-zinc-400">
                    {s.exchange ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {s.delisted ? (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        delisted
                        {s.delistedAt ? ` ${s.delistedAt.toISOString().slice(0, 7)}` : ""}
                      </span>
                    ) : (
                      <span className="text-zinc-400 dark:text-zinc-500">active</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {relatedFestivals.length > 0 ? (
        <section className="mb-10">
          <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Upcoming events affecting {category.name}
          </h2>
          <ul className="space-y-2">
            {relatedFestivals.map((f) => {
              const weight = f.affects.find((a) => a.slug === category.slug)?.weight ?? 0;
              return (
                <li
                  key={`${f.slug}-${f.date.toISOString()}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div>
                    <p className="font-medium text-zinc-800 dark:text-zinc-200">{f.name}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {f.date.toISOString().slice(0, 10)} · T+{f.daysUntil}d · {f.region}
                    </p>
                  </div>
                  <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-950/30 dark:text-orange-300">
                    weight {weight.toFixed(1)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </>
  );
}
