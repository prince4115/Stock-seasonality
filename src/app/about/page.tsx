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

      <div className="prose prose-zinc dark:prose-invert max-w-none text-sm text-zinc-700 dark:text-zinc-300">
        <h2 className="mt-8 text-lg font-semibold text-zinc-900 dark:text-zinc-50">What this is</h2>
        <p>
          A research tool for spotting recurring seasonal and event-driven patterns in
          consumer-spending stocks. We compute average monthly returns over 5y / 10y / 15y windows,
          score the strength of each pattern, and align it with holidays and festivals.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          What this is not
        </h2>
        <p>
          <strong>Not investment advice.</strong> Past patterns do not guarantee future results.
          Sample sizes are small (10&ndash;15 years of history), and observed seasonality can vanish
          once enough people notice it.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Coming in later phases
        </h2>
        <ul className="list-inside list-disc">
          <li>Survivorship-bias handling (delisted stocks kept and flagged)</li>
          <li>Toggle to exclude COVID-era years (2020&ndash;2021)</li>
          <li>Confidence intervals next to every percentage</li>
          <li>Colorblind-friendly blue↔orange heatmaps</li>
        </ul>
      </div>
    </>
  );
}
