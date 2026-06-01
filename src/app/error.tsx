"use client";

/**
 * Global runtime error boundary. Renders for any uncaught exception inside
 * a server component (most likely a Prisma / Supabase failure).
 *
 * Next.js calls this with `error` (the thrown value) and `reset` (retry).
 */
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Forward to analytics when wired (Plausible custom event would go here).
    console.error("[global-error]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl py-12">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-orange-700 dark:text-orange-400">
        Something went wrong
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        We hit an error rendering this page.
      </h1>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        Most likely the database is temporarily unreachable or the requested data isn&apos;t
        available. The error has been logged.
      </p>

      {error.digest ? (
        <p className="mt-3 font-mono text-xs text-zinc-400 dark:text-zinc-500">
          Error ref: {error.digest}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
