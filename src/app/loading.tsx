/**
 * Default route loading state. Renders while the server component fetches
 * its data. Specific routes (stock/[ticker], category/[slug]) override with
 * shape-matched skeletons.
 */
import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <>
      <div className="mb-8 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-3/4 max-w-xl" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="mt-3 h-3 w-full" />
            <Skeleton className="mt-1 h-3 w-3/4" />
            <Skeleton className="mt-5 h-10 w-full" />
          </div>
        ))}
      </div>
    </>
  );
}
