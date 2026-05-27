import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { getUpcomingFestivals, type UpcomingEvent } from "@/lib/data/festivals";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Calendar",
  description:
    "Upcoming holidays, festivals, and consumer-spending events with the categories they historically affect.",
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function monthKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

function monthHeading(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return `${MONTH_NAMES[m! - 1]} ${y}`;
}

const REGION_LABEL: Record<string, string> = {
  US: "🇺🇸 US",
  IN: "🇮🇳 India",
  CN: "🇨🇳 China",
  global: "🌐 Global",
};

export default async function CalendarPage() {
  const events = await getUpcomingFestivals({ limit: 40 });

  // Group by year-month so the page reads like a calendar.
  const byMonth = new Map<string, UpcomingEvent[]>();
  for (const e of events) {
    const key = monthKey(e.date);
    const arr = byMonth.get(key);
    if (arr) arr.push(e);
    else byMonth.set(key, [e]);
  }
  const monthGroups = Array.from(byMonth.entries()).sort(([a], [b]) => a.localeCompare(b));

  return (
    <>
      <PageHeader
        eyebrow="Calendar"
        title="Upcoming events"
        description="Holidays, festivals, and consumer-spending events on the horizon. Each row shows historically affected categories with the weights Phase 3 uses to scale event-window returns."
      />

      {events.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400">
          <p>No upcoming events in the next window.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {monthGroups.map(([key, monthEvents]) => (
            <section key={key}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {monthHeading(key)}
              </h2>
              <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                {monthEvents.map((e) => (
                  <li
                    key={`${e.slug}-${e.date.toISOString()}`}
                    className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{e.name}</p>
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {e.date.toISOString().slice(0, 10)} · T+{e.daysUntil}d ·{" "}
                        {REGION_LABEL[e.region] ?? e.region}
                        {e.durationDays > 1 ? ` · ${e.durationDays}d window` : ""}
                      </p>
                      {e.description ? (
                        <p className="mt-1 max-w-2xl text-xs text-zinc-600 dark:text-zinc-400">
                          {e.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {e.affects.map((a) => (
                        <Link
                          key={a.slug}
                          href={`/category/${a.slug}`}
                          className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs text-zinc-700 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-orange-700 dark:hover:bg-orange-950/30 dark:hover:text-orange-300"
                          title={`Weight ${a.weight.toFixed(1)}`}
                        >
                          {a.name}
                          <span className="ml-1 tabular-nums text-zinc-500 dark:text-zinc-400">
                            ×{a.weight.toFixed(1)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
