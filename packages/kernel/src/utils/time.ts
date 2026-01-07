import { z } from "zod";

export const ZRFC3339 = z.string().datetime();

export function parseRFC3339(input: string): Date {
  const s = ZRFC3339.parse(input);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid RFC3339 date");
  return d;
}

export function clampRangeDays(
  from?: string | null,
  to?: string | null,
  maxDays = 90
) {
  if (!from && !to) return;
  const f = from ? parseRFC3339(from) : null;
  const t = to ? parseRFC3339(to) : null;
  if (f && t) {
    const ms = t.getTime() - f.getTime();
    const maxMs = maxDays * 24 * 60 * 60 * 1000;
    if (ms > maxMs) throw new Error(`range > ${maxDays}d not allowed`);
  }
}
