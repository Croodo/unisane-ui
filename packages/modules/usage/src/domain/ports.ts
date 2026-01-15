import type { UsageHourRow } from './types';
import type { UsageWindow } from '@unisane/kernel';

export interface UsageRepoPort {
  getDayCount(scopeId: string, feature: string, dayStartUtc: Date): Promise<number>;
  getHourCount(scopeId: string, feature: string, hourStartUtc: Date): Promise<number>;
  upsertIncrement(window: UsageWindow, atUtc: Date, scopeId: string, feature: string, inc: number): Promise<void>;
  listHoursInRange(dayStartUtc: Date, nextDayUtc: Date): Promise<UsageHourRow[]>;
}
