/**
 * Formatted statistic with sample size — the brief's "Always show sample
 * size and confidence next to any percentage" rule made concrete.
 *
 * Renders e.g. "+12.3%" big, "n=15" small underneath. Color follows the
 * diverging palette so positive/negative is glanceable.
 */
type Props = {
  /** The value, e.g. 0.123 for +12.3%. Null/undefined = "no data". */
  value: number | null | undefined;
  /** Sample size for the value. */
  n?: number;
  /** Label below (or beside) the number, e.g. "avg return". */
  label?: string;
  /** Optional secondary stat (e.g., "60% positive"). */
  secondary?: string;
  /** Visual size. Default "md". */
  size?: "sm" | "md" | "lg";
  /** Always show "+" prefix on positives. Default true. */
  showSign?: boolean;
  /** Decimals to show in the percentage. Default 1. */
  decimals?: number;
};

export function StatNumber({
  value,
  n,
  label,
  secondary,
  size = "md",
  showSign = true,
  decimals = 1,
}: Props) {
  const hasValue = typeof value === "number" && Number.isFinite(value);

  const sizeClasses = {
    sm: "text-base",
    md: "text-2xl",
    lg: "text-4xl",
  }[size];

  let valueText = "—";
  let valueColor = "text-zinc-400";
  if (hasValue) {
    const sign = value >= 0 ? (showSign ? "+" : "") : "";
    valueText = `${sign}${(value * 100).toFixed(decimals)}%`;
    valueColor =
      value > 0
        ? "text-orange-700 dark:text-orange-400"
        : value < 0
          ? "text-sky-700 dark:text-sky-400"
          : "text-zinc-500 dark:text-zinc-400";
  }

  return (
    <div className="inline-flex flex-col">
      {label ? (
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
      ) : null}
      <p className={`font-semibold tabular-nums ${sizeClasses} ${valueColor}`}>{valueText}</p>
      <div className="mt-0.5 flex items-baseline gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        {n != null ? <span className="tabular-nums">n={n}</span> : null}
        {secondary ? <span>· {secondary}</span> : null}
      </div>
    </div>
  );
}
