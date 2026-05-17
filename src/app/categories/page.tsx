import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Categories",
  description:
    "Consumer-spending categories with seasonal patterns: travel, retail, food, apparel, jewelry, cinema, and more.",
};

const placeholderCategories = [
  "Travel",
  "Retail",
  "Food & beverage",
  "Apparel",
  "Jewelry",
  "Cinema & entertainment",
];

export default function CategoriesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Categories"
        title="Consumer-spending categories"
        description="Mini sparklines and seasonal strength scores per category will live here. Phase 5 wires this up to the data layer."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {placeholderCategories.map((name) => (
          <div
            key={name}
            className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{name}</h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Sparkline placeholder</p>
            <div className="mt-4 h-16 rounded bg-gradient-to-r from-sky-100 to-orange-100 dark:from-sky-950 dark:to-orange-950" />
          </div>
        ))}
      </div>
    </>
  );
}
