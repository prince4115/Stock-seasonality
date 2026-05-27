"use client";

/**
 * Window selector + COVID-exclusion toggle. Drives state via URL search
 * params (window, excludeCovid) so the page can be server-rendered and
 * shared/bookmarked at a particular configuration.
 *
 * Used on /stock/[ticker] and /category/[slug].
 */
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const WINDOWS = [5, 10, 15] as const;
type Window = (typeof WINDOWS)[number];

type Props = {
  /** Current window selection (read from URL by the server page). */
  window: Window;
  /** Current COVID-exclude toggle. */
  excludeCovid: boolean;
};

export function AnalysisControls({ window, excludeCovid }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function buildHref(updates: { window?: Window; excludeCovid?: boolean }) {
    const params = new URLSearchParams(searchParams.toString());
    if (updates.window != null) {
      params.set("window", String(updates.window));
    }
    if (updates.excludeCovid != null) {
      if (updates.excludeCovid) params.set("excludeCovid", "1");
      else params.delete("excludeCovid");
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2 text-xs">
        <span className="font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Window
        </span>
        <div
          role="group"
          aria-label="Analysis window in years"
          className="inline-flex overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700"
        >
          {WINDOWS.map((w, i) => {
            const isActive = window === w;
            return (
              <Link
                key={w}
                href={buildHref({ window: w })}
                aria-current={isActive ? "true" : undefined}
                className={
                  "px-3 py-1 text-xs tabular-nums transition-colors " +
                  (i > 0 ? "border-l border-zinc-200 dark:border-zinc-700 " : "") +
                  (isActive
                    ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                    : "bg-white text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800")
                }
              >
                {w}y
              </Link>
            );
          })}
        </div>
      </div>

      <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" aria-hidden />

      <div className="flex items-center gap-2 text-xs">
        <span className="font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          COVID years
        </span>
        <Link
          href={buildHref({ excludeCovid: !excludeCovid })}
          role="switch"
          aria-checked={excludeCovid}
          className={
            "inline-flex items-center gap-2 rounded-md border px-2.5 py-1 transition-colors " +
            (excludeCovid
              ? "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-300"
              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800")
          }
        >
          <span
            aria-hidden
            className={
              "inline-block h-2 w-2 rounded-full " +
              (excludeCovid ? "bg-sky-500" : "bg-zinc-400 dark:bg-zinc-600")
            }
          />
          {excludeCovid ? "excluded" : "included"}
          <span className="hidden text-zinc-400 sm:inline">(2020–2021)</span>
        </Link>
      </div>
    </div>
  );
}
