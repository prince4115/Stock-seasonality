/**
 * Loading state for /stock/[ticker] — shape matches the real page so the
 * transition feels like content arriving in place rather than a layout
 * shift.
 */
import { Skeleton } from "@/components/Skeleton";

export default function StockLoading() {
  return (
    <>
      <div className="mb-3 flex items-center gap-3">
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="mb-8 space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-2/3 max-w-md" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <Skeleton className="mb-6 h-12 w-72" />

      <section className="mb-8 grid grid-cols-2 gap-6 rounded-lg border border-zinc-200 bg-white p-5 sm:grid-cols-4 dark:border-zinc-800 dark:bg-zinc-900">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-8 w-20" />
            <Skeleton className="mt-1 h-3 w-16" />
          </div>
        ))}
      </section>

      <section className="mb-10">
        <Skeleton className="mb-3 h-5 w-48" />
        <Skeleton className="h-10 w-full" />
      </section>

      <section className="mb-10">
        <Skeleton className="mb-3 h-5 w-48" />
        <div className="space-y-px">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-full" />
          ))}
        </div>
      </section>
    </>
  );
}
