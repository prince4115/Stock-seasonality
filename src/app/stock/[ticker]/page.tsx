import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnalysisControls } from "@/components/controls/AnalysisControls";
import { Heatmap, type HeatmapRow } from "@/components/charts/Heatmap";
import { PageHeader } from "@/components/PageHeader";
import { StatNumber } from "@/components/StatNumber";
import {
  getEventScores,
  getMonthlyScores,
  parseExcludeCovid,
  parseWindow,
} from "@/lib/data/scores";
import { getStockByTicker } from "@/lib/data/stocks";

export const dynamic = "force-dynamic";

type Props = {
  params: { ticker: string };
  searchParams: { window?: string; excludeCovid?: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: params.ticker.toUpperCase(),
    description: `Seasonality fingerprint and event-window returns for ${params.ticker.toUpperCase()}.`,
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

const WINDOW_KIND_LABELS: Record<string, string> = {
  PRE30_PRE7: "T−30 → T−7",
  PRE7_EVENT: "T−7 → T",
  EVENT_POST7: "T → T+7",
};

function festivalLabel(slug: string): string {
  return slug
    .split("-")
    .map((p) => p[0]!.toUpperCase() + p.slice(1))
    .join(" ");
}

export default async function StockDetailPage({ params, searchParams }: Props) {
  const stock = await getStockByTicker(params.ticker);
  if (!stock) {
    notFound();
  }

  const window = parseWindow(searchParams.window);
  const excludeCovid = parseExcludeCovid(searchParams.excludeCovid);

  const [monthly, eventWindows] = await Promise.all([
    getMonthlyScores(stock.id, window, excludeCovid),
    getEventScores(stock.id, excludeCovid),
  ]);

  const ticker = stock.ticker;

  // Fingerprint heatmap: one row, 12 cols (months).
  const monthlyByIndex: Array<{ avgReturn: number; pctPositive: number; n: number } | null> =
    Array(12).fill(null);
  for (const m of monthly) {
    monthlyByIndex[m.month - 1] = {
      avgReturn: m.avgReturn,
      pctPositive: m.pctYearsPositive,
      n: m.sampleSize,
    };
  }
  const fingerprintRows: HeatmapRow[] = [
    {
      label: ticker,
      values: monthlyByIndex.map((c) => c?.avgReturn ?? null),
      sampleSizes: monthlyByIndex.map((c) => c?.n ?? 0),
    },
  ];

  // Summary stats: best/worst month, and a rough "annualized" sum.
  const validMonths = monthly.filter((m) => m.sampleSize > 0);
  const bestMonth = validMonths.reduce<(typeof validMonths)[number] | null>(
    (best, m) => (best == null || m.avgReturn > best.avgReturn ? m : best),
    null,
  );
  const worstMonth = validMonths.reduce<(typeof validMonths)[number] | null>(
    (worst, m) => (worst == null || m.avgReturn < worst.avgReturn ? m : worst),
    null,
  );
  const seasonalitySum = validMonths.reduce((a, m) => a + m.avgReturn, 0);

  // Group event-window scores by festival for the table.
  const byFestival = new Map<
    string,
    Record<string, { avgReturn: number; pctPositive: number; n: number }>
  >();
  for (const e of eventWindows) {
    const map = byFestival.get(e.festivalSlug) ?? {};
    map[e.windowKind] = {
      avgReturn: e.avgReturn,
      pctPositive: e.pctYearsPositive,
      n: e.sampleSize,
    };
    byFestival.set(e.festivalSlug, map);
  }
  // Sorted festival list by absolute size of the EVENT_POST7 return (most interesting first).
  const festivalEntries = Array.from(byFestival.entries()).sort((a, b) => {
    const aRet = Math.abs(a[1].EVENT_POST7?.avgReturn ?? 0);
    const bRet = Math.abs(b[1].EVENT_POST7?.avgReturn ?? 0);
    return bRet - aRet;
  });

  const eventHeatmapRows: HeatmapRow[] = festivalEntries.map(([slug, kinds]) => ({
    label: festivalLabel(slug),
    values: ["PRE30_PRE7", "PRE7_EVENT", "EVENT_POST7"].map((k) => kinds[k]?.avgReturn ?? null),
    sampleSizes: ["PRE30_PRE7", "PRE7_EVENT", "EVENT_POST7"].map((k) => kinds[k]?.n ?? 0),
  }));

  return (
    <>
      <div className="mb-3 flex items-center gap-3 text-xs">
        <Link
          href={`/category/${stock.category.slug}`}
          className="rounded-full border border-zinc-200 px-2.5 py-1 font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          ← {stock.category.name}
        </Link>
        {stock.exchange ? (
          <span className="text-zinc-500 dark:text-zinc-400">{stock.exchange}</span>
        ) : null}
        {stock.delisted ? (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            Delisted
            {stock.delistedAt ? ` (${stock.delistedAt.toISOString().slice(0, 10)})` : ""}
          </span>
        ) : null}
      </div>

      <PageHeader
        eyebrow={`${ticker} · ${stock.name}`}
        title="Seasonality fingerprint"
        description={`Average monthly returns over the trailing ${window} years and event-window returns around major retail/holiday events. Sample size shown next to every percentage.`}
      />

      <div className="mb-6">
        <AnalysisControls window={window} excludeCovid={excludeCovid} />
      </div>

      {validMonths.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400">
          <p className="font-medium text-zinc-700 dark:text-zinc-300">No analysis data</p>
          <p className="mt-2">
            We don&apos;t have cached seasonality scores for {ticker} at this window. This usually
            means the ticker had no price history available (see the SUMMARY for known data-source
            follow-ups).
          </p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <section className="mb-8 grid grid-cols-2 gap-6 rounded-lg border border-zinc-200 bg-white p-5 sm:grid-cols-4 dark:border-zinc-800 dark:bg-zinc-900">
            <StatNumber
              label={`Best month (${window}y)`}
              value={bestMonth?.avgReturn ?? null}
              n={bestMonth?.sampleSize}
              secondary={
                bestMonth
                  ? `${MONTH_LABELS[bestMonth.month - 1]}, ${Math.round(bestMonth.pctYearsPositive * 100)}% positive`
                  : undefined
              }
            />
            <StatNumber
              label={`Worst month (${window}y)`}
              value={worstMonth?.avgReturn ?? null}
              n={worstMonth?.sampleSize}
              secondary={
                worstMonth
                  ? `${MONTH_LABELS[worstMonth.month - 1]}, ${Math.round(worstMonth.pctYearsPositive * 100)}% positive`
                  : undefined
              }
            />
            <StatNumber
              label="Sum of monthly averages"
              value={seasonalitySum}
              secondary="rough annual baseline"
            />
            <StatNumber
              label="Months with data"
              value={null}
              size="md"
              secondary={`${validMonths.length} / 12 covered`}
            />
          </section>

          {/* Monthly fingerprint heatmap */}
          <section className="mb-10">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Monthly fingerprint
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                avg return per month, color = magnitude · hover for sample size
              </p>
            </div>
            <Heatmap rows={fingerprintRows} colLabels={MONTH_LABELS} />
          </section>

          {/* Event-window heatmap */}
          {eventHeatmapRows.length > 0 ? (
            <section className="mb-10">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  Event-window returns
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  return in the three windows around each event · sorted by post-event magnitude
                </p>
              </div>
              <Heatmap
                rows={eventHeatmapRows}
                colLabels={["PRE30→PRE7", "PRE7→EVENT", "EVENT→POST7"]}
                caption={`Window kinds: ${Object.entries(WINDOW_KIND_LABELS)
                  .map(([k, v]) => `${k} (${v})`)
                  .join(", ")}`}
              />
            </section>
          ) : null}

          {/* Backtest preview placeholder — Phase 6 territory */}
          <section className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-5 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400">
            <p className="font-medium text-zinc-700 dark:text-zinc-300">Backtest preview</p>
            <p className="mt-1">
              A &ldquo;what if you bought {ticker} every{" "}
              {bestMonth ? MONTH_LABELS[bestMonth.month - 1] : "[best month]"} 1 from{" "}
              {new Date().getFullYear() - window} to today&rdquo; walkthrough lands in the next
              iteration.
            </p>
          </section>
        </>
      )}
    </>
  );
}
