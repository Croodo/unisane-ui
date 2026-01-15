import {
  col,
  COLLECTIONS,
  type UsageWindow,
  type Document,
} from '@unisane/kernel';
import type { UsageRepoPort } from '../domain/ports';
import type { UsageHourRow } from '../domain/types';

type UsageSampleDoc = {
  _id?: unknown;
  scopeId: string;
  feature: string;
  window: UsageWindow;
  at: Date;
  count: number;
};

const usageCol = () => col<UsageSampleDoc>(COLLECTIONS.USAGE_SAMPLES);

export const UsageRepoMongo: UsageRepoPort = {
  async getDayCount(scopeId, feature, dayStartUtc) {
    const doc = await usageCol().findOne({ scopeId, feature, window: 'day', at: dayStartUtc } as Document);
    return (doc?.count ?? 0) as number;
  },
  async getHourCount(scopeId, feature, hourStartUtc) {
    const doc = await usageCol().findOne({ scopeId, feature, window: 'hour', at: hourStartUtc } as Document);
    return (doc?.count ?? 0) as number;
  },
  async upsertIncrement(window: UsageWindow, atUtc: Date, scopeId: string, feature: string, inc: number) {
    await usageCol().updateOne({ scopeId, feature, window, at: atUtc } as Document, { $inc: { count: inc } } as Document, { upsert: true });
  },
  async listHoursInRange(dayStartUtc, nextDayUtc) {
    const rows = await usageCol()
      .find({ window: 'hour', at: { $gte: dayStartUtc, $lt: nextDayUtc } } as Document)
      .project({ scopeId: 1, feature: 1, count: 1 } as Document)
      .toArray();
    return rows as unknown as UsageHourRow[];
  },
};
