/**
 * Global 404 page. Triggered by Next.js when a route doesn't match, or
 * when a server component calls `notFound()` (e.g., unknown ticker or
 * category slug).
 */
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-12">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-sky-600 dark:text-sky-400">
        404
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        We couldn&apos;t find that page.
      </h1>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        The ticker or category you requested isn&apos;t in our universe right now. Our active list
        is 89 consumer-spending tickers across 9 categories &mdash; full list on{" "}
        <Link href="/categories" className="text-sky-600 hover:underline dark:text-sky-400">
          /categories
        </Link>
        .
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Back home
        </Link>
        <Link
          href="/categories"
          className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Browse categories
        </Link>
        <Link
          href="/calendar"
          className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Calendar
        </Link>
      </div>
    </div>
  );
}
