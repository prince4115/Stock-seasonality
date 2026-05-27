/**
 * Diverging blue ↔ orange color scale.
 *
 * Picked deliberately over red/green per the brief — deuteranopia-friendly
 * and matches the sky→orange brand gradient in the top-nav logo.
 *
 * Below zero: stone (neutral) → sky-700. Above zero: stone → orange-700.
 */
const NEUTRAL = [245, 245, 244]; // stone-100
const STRONG_NEG = [3, 105, 161]; // sky-700
const STRONG_POS = [194, 65, 12]; // orange-700

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function rgb(c: number[]): string {
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

/**
 * Color a cell whose value is in [-scaleMax, +scaleMax]. Values past the
 * scale clamp to the strongest color.
 */
export function divergingColor(value: number, scaleMax: number): string {
  if (!Number.isFinite(value) || scaleMax === 0) return rgb(NEUTRAL);
  const t = Math.max(-1, Math.min(1, value / scaleMax));
  const target = t < 0 ? STRONG_NEG : STRONG_POS;
  const magnitude = Math.abs(t);
  return rgb([
    lerp(NEUTRAL[0], target[0], magnitude),
    lerp(NEUTRAL[1], target[1], magnitude),
    lerp(NEUTRAL[2], target[2], magnitude),
  ]);
}

/**
 * Pick a readable text color (white or near-black) for a given background
 * RGB, based on perceived brightness. Used to keep heatmap cell labels
 * legible across the diverging scale.
 */
export function textOnBackground(value: number, scaleMax: number): string {
  if (!Number.isFinite(value) || scaleMax === 0) return "#3f3f46";
  const t = Math.abs(Math.max(-1, Math.min(1, value / scaleMax)));
  // Past ~55% saturation the background is dark enough that white reads better.
  return t > 0.55 ? "#ffffff" : "#27272a";
}
