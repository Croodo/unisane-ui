export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return clamp(Math.trunc(n), min, max);
}

