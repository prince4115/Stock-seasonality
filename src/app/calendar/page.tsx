import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Calendar",
  description:
    "Upcoming holidays, festivals, and consumer-spending events with the categories they historically affect.",
};

export default function CalendarPage() {
  return (
    <>
      <PageHeader
        eyebrow="Calendar"
        title="Upcoming events"
        description="Diwali, Christmas, Black Friday, Chinese New Year, summer travel, back-to-school, and more. Phase 2 will seed event dates; Phase 5 will render them here."
      />

      <section className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400">
        <p className="font-medium text-zinc-700 dark:text-zinc-300">Event list placeholder</p>
        <p className="mt-2">
          Each event will show affected categories and the historical (T&minus;30, T&minus;7),
          (T&minus;7, T), and (T, T+7) returns.
        </p>
      </section>
    </>
  );
}
