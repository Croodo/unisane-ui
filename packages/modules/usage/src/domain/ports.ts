import type { UsageHourRow } from './types';
import type { UsageWindow } from '@unisane/kernel';

export interface UsageRepoPort {
  findDayCount(scopeId: string, feature: string, dayStartUtc: Date): Promise<number>;
  findHourCount(scopeId: string, feature: string, hourStartUtc: Date): Promise<number>;
  upsertIncrement(window: UsageWindow, atUtc: Date, scopeId: string, feature: string, inc: number): Promise<void>;
  listHoursInRange(dayStartUtc: Date, nextDayUtc: Date): Promise<UsageHourRow[]>;
}
