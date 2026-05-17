import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";

type Props = { params: { slug: string } };

export function generateMetadata({ params }: Props): Metadata {
  return {
    title: `${params.slug} category`,
    description: `Seasonality patterns for the ${params.slug} category.`,
  };
}

export default function CategoryDetailPage({ params }: Props) {
  return (
    <>
      <PageHeader
        eyebrow="Category"
        title={params.slug}
        description="Month × year heatmap, top seasonal stocks, and related festivals will render here. Wired up in Phase 5."
      />

      <section className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400">
        <p className="font-medium text-zinc-700 dark:text-zinc-300">Heatmap placeholder</p>
        <p className="mt-2">
          A colorblind-friendly blue↔orange diverging heatmap will live here. Sample size will be
          shown next to every percentage.
        </p>
      </section>
    </>
  );
}
