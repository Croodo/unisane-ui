import { z } from 'zod';

export const USAGE_WINDOW = ['hour', 'day'] as const;
export type UsageWindow = (typeof USAGE_WINDOW)[number];
export const ZUsageWindow = z.enum(USAGE_WINDOW);

