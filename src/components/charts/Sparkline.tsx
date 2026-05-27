/**
 * Tiny SVG sparkline. Server-rendered, no client JS, no chart library.
 *
 * 12-point series is the common case (monthly returns) but works for any N.
 * Zero-line is drawn behind the curve; positive area filled orange, negative
 * filled sky — colorblind-friendly to match the heatmap.
 */
type Props = {
  values: number[];
  width?: number;
  height?: number;
  /** Stroke + fill use the diverging palette by default. */
  className?: string;
};

const POS_STROKE = "#c2410c"; // orange-700
const NEG_STROKE = "#0369a1"; // sky-700
const ZERO_LINE = "#a1a1aa"; // zinc-400

export function Sparkline({ values, width = 120, height = 36, className }: Props) {
  if (values.length === 0) {
    return (
      <div
        className={`flex items-center justify-center text-xs text-zinc-400 ${className ?? ""}`}
        style={{ width, height }}
      >
        no data
      </div>
    );
  }

  const padX = 2;
  const padY = 4;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const maxAbs = Math.max(0.0001, ...values.map((v) => Math.abs(v)));
  const xStep = values.length > 1 ? innerW / (values.length - 1) : 0;
  // Map y so 0 sits at the vertical midpoint.
  const yMid = padY + innerH / 2;
  const yFor = (v: number) => yMid - (v / maxAbs) * (innerH / 2);

  const points = values.map((v, i) => `${padX + i * xStep},${yFor(v)}`).join(" ");
  const dominantPositive = values.reduce((acc, v) => acc + v, 0) >= 0;
  const stroke = dominantPositive ? POS_STROKE : NEG_STROKE;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`sparkline of ${values.length} values, ${dominantPositive ? "net positive" : "net negative"}`}
      className={className}
    >
      <line
        x1={padX}
        y1={yMid}
        x2={width - padX}
        y2={yMid}
        stroke={ZERO_LINE}
        strokeWidth={0.5}
        strokeDasharray="2 2"
      />
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
