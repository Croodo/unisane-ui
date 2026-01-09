import { z } from 'zod';

export const USAGE_WINDOWS = ['minute', 'hour', 'day'] as const;
export type UsageWindow = (typeof USAGE_WINDOWS)[number];
export const ZUsageWindow = z.enum(USAGE_WINDOWS);

