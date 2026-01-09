/**
 * Contracts stub - shared API contracts/schemas
 * These would typically be zod schemas for API validation
 */

import { z } from 'zod';

// Admin stats query schema
export const ZAdminStatsQuery = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  granularity: z.enum(['day', 'week', 'month']).optional(),
});

export type AdminStatsQuery = z.infer<typeof ZAdminStatsQuery>;
