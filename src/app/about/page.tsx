import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "About",
  description: "Methodology, data sources, and disclaimers for the Stock Seasonality Analyzer.",
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="Methodology & disclaimers"
        description="How we compute seasonality, what biases we try to mitigate, and what this tool is not."
      />

      <div className="max-w-2xl space-y-8 text-sm text-zinc-700 dark:text-zinc-300">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            What this is
          </h2>
          <p>
            A research tool for spotting recurring seasonal and event-driven patterns in
            consumer-spending stocks. For every ticker in our universe we compute average monthly
            returns over 5-, 10-, and 15-year trailing windows, plus event-window returns around
            major retail holidays and festivals. Results are cached so a page render never triggers
            a recompute.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            What this is not
          </h2>
          <p>
            <strong>Not investment advice.</strong> Past patterns do not guarantee future results.
            Sample sizes are small (5&ndash;15 years of history), observed seasonality can vanish
            once enough people notice it, and the universe leans heavily on US-listed equities.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            How we compute it
          </h2>
          <ul className="ml-5 list-disc space-y-1.5">
            <li>
              <strong>Monthly return</strong> per stock per month = first trading day&apos;s
              adjusted close → last trading day&apos;s adjusted close. We use the adjusted close so
              splits and dividends don&apos;t create fake jumps.
            </li>
            <li>
              <strong>Seasonality score</strong> per (stock, month, window) = the average monthly
              return for that month across the window, plus the fraction of years it was positive
              and the fraction that beat the stock&apos;s overall mean monthly return.
            </li>
            <li>
              <strong>Event-window return</strong> = the return from the trading day N to the
              trading day M relative to the event date, averaged across all occurrences in the
              window. We use three windows: T&minus;30 → T&minus;7 (run-up), T&minus;7 → T
              (lead-in), and T → T+7 (post-event).
            </li>
            <li>
              <strong>COVID toggle.</strong> 2020 and 2021 had unusual moves that distort some
              seasonality patterns. Every score is cached in two flavors (covid included / excluded)
              so the toggle flips instantly.
            </li>
            <li>
              <strong>Sample size.</strong> Every percentage on this site displays the n it was
              computed from. A 12% return over n=5 years is very different from n=15.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Survivorship-bias handling
          </h2>
          <p>
            When a ticker is delisted (acquired, merged, taken private, or went to zero) we keep the
            row and its historical price data in the database with a{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">
              delisted=true
            </code>{" "}
            flag. That way a 10-year backtest of &ldquo;consumer retail in October&rdquo; isn&apos;t
            silently flattered by dropping the failures. Today the list of flagged tickers includes
            TIF (acquired by LVMH 2021), JWN (Nordstrom going private 2025), and the old SIX / SEAS
            / PARA tickers that were replaced after 2024–2025 mergers.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Known limitations
          </h2>
          <ul className="ml-5 list-disc space-y-1.5">
            <li>
              <strong>ADR currency mixing.</strong> ADRs like LVMUY (LVMH) and CFRUY (Richemont)
              trade in USD but reflect EUR / GBP underlying prices. Multi-week returns mix the
              stock&apos;s move with the FX move, which can materially distort event-window returns
              for luxury names. FX-aware analysis is on the roadmap.
            </li>
            <li>
              <strong>yfinance reliability.</strong> Our prototype data source has gaps for some
              recently-renamed or single-letter tickers (K = Kellanova currently affected). The
              schema supports swapping in Polygon.io without a rewrite.
            </li>
            <li>
              <strong>Universe bias.</strong> We deliberately picked consumer-spending names because
              the brief is about retail cyclicality. Tech, healthcare, and broad-market indices
              aren&apos;t represented — don&apos;t generalize the patterns past consumer spending.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Tech & data sources
          </h2>
          <ul className="ml-5 list-disc space-y-1.5">
            <li>Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS.</li>
            <li>
              Backend: Next.js API routes over a PostgreSQL database hosted on Supabase. Prisma ORM
              with the driver-adapter generator.
            </li>
            <li>
              Ingestion: Python with yfinance for daily OHLCV, run on a GitHub Actions cron Tue–Sat
              09:30 UTC.
            </li>
            <li>
              Charts: diverging blue ↔ orange palette throughout. Colorblind-friendly
              (deuteranopia-safe). The brand mark uses the same palette.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Disclaimer</h2>
          <p className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-xs dark:border-zinc-800 dark:bg-zinc-900/40">
            This tool is for educational and research purposes only. Nothing here is investment
            advice, a solicitation, or a recommendation to buy or sell any security. Past
            performance does not guarantee future results. Consult a qualified financial advisor
            before making any investment decision.
          </p>
        </section>
      </div>
    </>
  );
}
