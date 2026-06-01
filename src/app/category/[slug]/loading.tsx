/**
 * Loading state for /category/[slug].
 */
import { Skeleton } from "@/components/Skeleton";

export default function CategoryLoading() {
  return (
    <>
      <div className="mb-8 space-y-3">
        <Skeleton className="h-4 w-32" />
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
        <Skeleton className="mb-3 h-5 w-56" />
        <Skeleton className="h-10 w-full" />
      </section>

      <section className="mb-10">
        <Skeleton className="mb-3 h-5 w-56" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <Skeleton className="h-3 w-12" />
              <div className="mt-3 space-y-1.5">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
