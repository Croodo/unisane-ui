import type { UsageHourRow } from '../domain/types';
import { UsageRepo } from '../data/usage.repository';

export async function rollupDay(now = new Date()) {
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1, 0, 0, 0));
  const nextDay = new Date(Date.UTC(dayStart.getUTCFullYear(), dayStart.getUTCMonth(), dayStart.getUTCDate() + 1, 0, 0, 0));
  const rows = await UsageRepo.listHoursInRange(dayStart, nextDay);
  const agg = new Map<string, number>();
  for (const doc of rows as UsageHourRow[]) {
    const scope = String(doc.scopeId ?? '');
    const feat = String(doc.feature ?? '');
    const k = `${scope}::${feat}`;
    agg.set(k, (agg.get(k) ?? 0) + (doc.count ?? 0));
  }
  for (const [k, count] of agg.entries()) {
    const parts = k.split('::');
    const scopeId = parts[0] ?? '';
    const feature = parts[1] ?? '';
    await UsageRepo.upsertIncrement('day', dayStart, scopeId as string, feature as string, count);
  }
  return { ok: true as const, groups: agg.size };
}
