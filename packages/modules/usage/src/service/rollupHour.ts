import { redis, logger } from '@unisane/kernel';
import { UsageRepo } from '../data/usage.repository';
import { hourLabel, usageKeys } from '../domain/keys';

export async function rollupHour(now = new Date()) {
  const hourStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours() - 1, 0, 0));
  const label = hourLabel(hourStart);
  const pattern = usageKeys.hourScanPattern(label);
  const counts: Record<string, number> = {};
  let cursor = '0';
  do {
    const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 500);
    cursor = next;
    if (keys.length) {
      const vs = await redis.mget(...keys);
      keys.forEach((k, i) => {
        counts[k] = (counts[k] ?? 0) + Number(vs[i] ?? 0);
      });
    }
  } while (cursor !== '0');

  const groups = new Map<string, { scopeId: string; feature: string; count: number }>();
  for (const [key, val] of Object.entries(counts)) {
    // key format: usage:{scopeId}:{feature}:{YYYYMMDDHHmm}
    const parts = key.split(':');
    if (parts.length < 4 || parts[0] !== 'usage') {
      logger.warn('usage.rollup.unexpected_key_format', { key });
      continue;
    }
    const scopeId = parts[1] ?? '';
    const feature = parts[2] ?? '';
    if (!scopeId || !feature) {
      logger.warn('usage.rollup.empty_key_parts', { key, scopeId, feature });
      continue;
    }
    const gk = `${scopeId}::${feature}`;
    const g = groups.get(gk) ?? { scopeId, feature, count: 0 };
    g.count += val;
    groups.set(gk, g);
  }
  for (const g of groups.values()) {
    await UsageRepo.upsertIncrement('hour', hourStart, g.scopeId, g.feature, g.count);
  }
  return { ok: true as const, groups: groups.size };
}
