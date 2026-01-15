import {
  col,
  COLLECTIONS,
  UpdateBuilder,
  toMongoUpdate,
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
  async findDayCount(scopeId, feature, dayStartUtc) {
    const doc = await usageCol().findOne({ scopeId, feature, window: 'day', at: dayStartUtc } as Document);
    return (doc?.count ?? 0) as number;
  },
  async findHourCount(scopeId, feature, hourStartUtc) {
    const doc = await usageCol().findOne({ scopeId, feature, window: 'hour', at: hourStartUtc } as Document);
    return (doc?.count ?? 0) as number;
  },
  async upsertIncrement(window: UsageWindow, atUtc: Date, scopeId: string, feature: string, inc: number) {
    const builder = new UpdateBuilder<UsageSampleDoc>().inc("count", inc);
    await usageCol().updateOne(
      { scopeId, feature, window, at: atUtc } as Document,
      toMongoUpdate(builder.build()) as Document,
      { upsert: true }
    );
  },
  async listHoursInRange(dayStartUtc, nextDayUtc) {
    const rows = await usageCol()
      .find({ window: 'hour', at: { $gte: dayStartUtc, $lt: nextDayUtc } } as Document)
      .project({ scopeId: 1, feature: 1, count: 1 } as Document)
      .toArray();
    return rows as unknown as UsageHourRow[];
  },
};
