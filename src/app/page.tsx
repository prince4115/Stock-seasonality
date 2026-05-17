import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";

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
      "Drill into a ticker's seasonality fingerprint and event-window returns across 10–15 years.",
    href: "/categories",
    cta: "Find a stock",
  },
  {
    title: "By event",
    description:
      "Diwali, Christmas, Black Friday, Chinese New Year, back-to-school — see what's coming and what historically moves.",
    href: "/calendar",
    cta: "Open calendar",
  },
];

export default function Home() {
  return (
    <>
      <PageHeader
        eyebrow="Phase 1 · Scaffold"
        title="Seasonal patterns in consumer-spending stocks."
        description="A research tool for analyzing how stock prices move around holidays, festivals, and recurring consumer-spending cycles. Methodology over hype — every percentage is shown with its sample size."
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

      <div className="mt-10 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-5 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400">
        <p className="font-medium text-zinc-700 dark:text-zinc-300">Build status</p>
        <p className="mt-1">
          Phase 1 — scaffold complete. Phase 2 (data layer) and Phase 3 (analysis engine) will
          populate categories, stocks, and event-window returns.
        </p>
      </div>
    </>
  );
}
