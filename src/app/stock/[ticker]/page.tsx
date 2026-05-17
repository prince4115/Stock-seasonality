import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";

type Props = { params: { ticker: string } };

export function generateMetadata({ params }: Props): Metadata {
  return {
    title: params.ticker.toUpperCase(),
    description: `Seasonality fingerprint and event-window returns for ${params.ticker.toUpperCase()}.`,
  };
}

export default function StockDetailPage({ params }: Props) {
  const ticker = params.ticker.toUpperCase();
  return (
    <>
      <PageHeader
        eyebrow="Stock"
        title={ticker}
        description="Seasonality fingerprint, event-window table, and backtest preview will render here. Wired up in Phase 5."
      />

      <section className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400">
        <p className="font-medium text-zinc-700 dark:text-zinc-300">Fingerprint placeholder</p>
        <p className="mt-2">
          Average monthly returns, % of years a month was positive, and event-window returns will
          appear here once Phase 2 + 3 are complete.
        </p>
      </section>
    </>
  );
}
