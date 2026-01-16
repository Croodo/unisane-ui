/**
 * Contracts stub - shared API contracts/schemas
 * These would typically be zod schemas for API validation
 *
 * CTR-008 FIX: Note on schema duplication
 * The canonical source for API contracts is `@unisane/contracts`.
 * This file provides minimal stubs for kernel internal use only.
 * For full validation (e.g., from < to refinement), use `@unisane/contracts`.
 */

import { z } from 'zod';

/**
 * Date range query schema (for stats/reports)
 *
 * CTR-008 FIX: This is a minimal stub. The canonical version in
 * `@unisane/contracts` includes additional validation (from < to refinement).
 * Use `@unisane/contracts` for API validation.
 */
export const ZDateRangeQuery = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  granularity: z.enum(['day', 'week', 'month']).optional(),
}).refine(
  (data) => {
    // CTR-008 FIX: Added same refinement as @unisane/contracts
    if (!data.from || !data.to) return true;
    return new Date(data.from).getTime() < new Date(data.to).getTime();
  },
  { message: 'from date must be before to date' }
);

export type DateRangeQuery = z.infer<typeof ZDateRangeQuery>;

/** @deprecated Use ZDateRangeQuery instead */
export const ZAdminStatsQuery = ZDateRangeQuery;
/** @deprecated Use DateRangeQuery instead */
export type AdminStatsQuery = DateRangeQuery;
