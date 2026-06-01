/**
 * Skeleton placeholder block. Used by route-level loading.tsx files so the
 * page shell paints immediately while DB queries run in the background.
 */
type Props = {
  className?: string;
};

export function Skeleton({ className = "" }: Props) {
  return (
    <div
      aria-hidden
      className={"animate-pulse rounded bg-zinc-200/70 dark:bg-zinc-800/70 " + className}
    />
  );
}
