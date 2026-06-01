import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { WaitlistForm } from "@/components/WaitlistForm";
import { getAllCategories } from "@/lib/data/categories";
import { getUpcomingFestivals } from "@/lib/data/festivals";

export const dynamic = "force-dynamic";

const highlights = [
  {
    title: "By category",
    description:
      "Travel, retail, food, apparel, jewelry, cinema — see which baskets reliably move with which seasons.",
    href: "/categories",
    cta: "Browse categories",
  },
  {
    title: "By stock",
    description:
      "Drill into a ticker's seasonality fingerprint and event-window returns across up to 15 years.",
    href: "/category/jewelry-luxury",
    cta: "Try jewelry",
  },
  {
    title: "By event",
    description:
      "Diwali, Christmas, Black Friday, Chinese New Year, back-to-school — see what's coming and what historically moves.",
    href: "/calendar",
    cta: "Open calendar",
  },
];

export default async function Home() {
  const [categories, upcoming] = await Promise.all([
    getAllCategories(),
    getUpcomingFestivals({ limit: 3 }),
  ]);

  const totalStocks = categories.reduce((a, c) => a + c.stockCount, 0);

  return (
    <>
      <PageHeader
        eyebrow="Stock Seasonality Analyzer"
        title="Seasonal patterns in consumer-spending stocks."
        description={`A research tool for analyzing how stock prices move around holidays, festivals, and recurring consumer-spending cycles. ${categories.length} categories, ${totalStocks} tickers, 15 years of daily data. Every percentage shows its sample size.`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {highlights.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="group rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/60"
          >
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {item.title}
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{item.description}</p>
            <p className="mt-4 text-sm font-medium text-sky-600 group-hover:underline dark:text-sky-400">
              {item.cta} &rarr;
            </p>
          </Link>
        ))}
      </div>

      <section className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Coming up</h2>
          <Link href="/calendar" className="text-xs text-sky-600 hover:underline dark:text-sky-400">
            full calendar &rarr;
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-zinc-500">No upcoming events scheduled.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-3">
            {upcoming.map((e) => (
              <li
                key={`${e.slug}-${e.date.toISOString()}`}
                className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{e.name}</p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {e.date.toISOString().slice(0, 10)} · T+{e.daysUntil}d
                </p>
                <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                  Affects{" "}
                  {e.affects
                    .slice(0, 3)
                    .map((a) => a.name)
                    .join(", ")}
                  {e.affects.length > 3 ? `, +${e.affects.length - 3} more` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Get notified</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          New categories, new tickers, new event-window analyses — drop your email and we&apos;ll
          let you know.
        </p>
        <div className="mt-4">
          <WaitlistForm source="landing" />
        </div>
      </section>

      <div className="mt-10 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-5 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400">
        <p className="font-medium text-zinc-700 dark:text-zinc-300">Methodology in one line</p>
        <p className="mt-1">
          We compute average monthly returns and event-window returns (T−30 to T+7 around each
          event) for every active ticker over 5y / 10y / 15y trailing windows. Delisted tickers stay
          in history with a flag, so backtests aren&apos;t flattered by survivorship bias.{" "}
          <Link href="/about" className="text-sky-600 hover:underline dark:text-sky-400">
            Full methodology &rarr;
          </Link>
        </p>
      </div>
    </>
  );
}
