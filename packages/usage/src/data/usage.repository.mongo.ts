import { col } from '@unisane/kernel';
import type { UsageRepoPort } from '../domain/ports';
import type { UsageWindow } from '@unisane/kernel';
import type { UsageHourRow } from '../domain/types';
import type { Document } from 'mongodb';

type UsageSampleDoc = {
  _id?: unknown;
  tenantId: string;
  feature: string;
  window: UsageWindow;
  at: Date;
  count: number;
};

const usageCol = () => col<UsageSampleDoc>('usage_samples');

export const UsageRepoMongo: UsageRepoPort = {
  async getDayCount(tenantId, feature, dayStartUtc) {
    const doc = await usageCol().findOne({ tenantId, feature, window: 'day', at: dayStartUtc } as Document);
    return (doc?.count ?? 0) as number;
  },
  async getHourCount(tenantId, feature, hourStartUtc) {
    const doc = await usageCol().findOne({ tenantId, feature, window: 'hour', at: hourStartUtc } as Document);
    return (doc?.count ?? 0) as number;
  },
  async upsertIncrement(window: UsageWindow, atUtc: Date, tenantId: string, feature: string, inc: number) {
    await usageCol().updateOne({ tenantId, feature, window, at: atUtc } as Document, { $inc: { count: inc } } as Document, { upsert: true });
  },
  async listHoursInRange(dayStartUtc, nextDayUtc) {
    const rows = await usageCol()
      .find({ window: 'hour', at: { $gte: dayStartUtc, $lt: nextDayUtc } } as Document)
      .project({ tenantId: 1, feature: 1, count: 1 } as Document)
      .toArray();
    return rows as unknown as UsageHourRow[];
  },
};
