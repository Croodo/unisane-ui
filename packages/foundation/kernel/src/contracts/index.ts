/**
 * Contracts stub - shared API contracts/schemas
 * These would typically be zod schemas for API validation
 */

import { z } from 'zod';

// Date range query schema (for stats/reports)
export const ZDateRangeQuery = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  granularity: z.enum(['day', 'week', 'month']).optional(),
});

export type DateRangeQuery = z.infer<typeof ZDateRangeQuery>;

/** @deprecated Use ZDateRangeQuery instead */
export const ZAdminStatsQuery = ZDateRangeQuery;
/** @deprecated Use DateRangeQuery instead */
export type AdminStatsQuery = DateRangeQuery;
