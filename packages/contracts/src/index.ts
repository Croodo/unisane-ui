/**
 * @unisane/contracts
 *
 * Shared API contracts and schemas for the Unisane platform.
 * Contains Zod schemas for API validation and type definitions.
 */

import { z } from 'zod';

// Admin stats query
export const ZAdminStatsQuery = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  granularity: z.enum(['day', 'week', 'month']).optional(),
});

export type AdminStatsQuery = z.infer<typeof ZAdminStatsQuery>;

// Pagination contracts
export const ZPaginationQuery = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  cursor: z.string().optional(),
});

export type PaginationQuery = z.infer<typeof ZPaginationQuery>;

// ID parameter
export const ZIdParam = z.object({
  id: z.string().min(1),
});

export type IdParam = z.infer<typeof ZIdParam>;

// Tenant context
export const ZTenantContext = z.object({
  tenantId: z.string().min(1),
});

export type TenantContext = z.infer<typeof ZTenantContext>;
