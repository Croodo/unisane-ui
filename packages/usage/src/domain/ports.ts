import type { UsageHourRow } from './types';
import type { UsageWindow } from '@unisane/kernel';

export interface UsageRepoPort {
  getDayCount(tenantId: string, feature: string, dayStartUtc: Date): Promise<number>;
  getHourCount(tenantId: string, feature: string, hourStartUtc: Date): Promise<number>;
  upsertIncrement(window: UsageWindow, atUtc: Date, tenantId: string, feature: string, inc: number): Promise<void>;
  listHoursInRange(dayStartUtc: Date, nextDayUtc: Date): Promise<UsageHourRow[]>;
}
