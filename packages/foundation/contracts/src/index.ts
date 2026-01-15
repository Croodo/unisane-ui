/**
 * @unisane/contracts
 *
 * Shared API contracts and schemas for the Unisane platform.
 * Contains Zod schemas for API validation and type definitions.
 */

import { z } from 'zod';

// Date range query (for stats/reports)
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

// Pagination contracts
/**
 * Standard pagination defaults for all list endpoints.
 * Use these values consistently across all contracts.
 */
export const PAGINATION_DEFAULTS = {
  defaultLimit: 20,
  maxLimit: 100,
  defaultOffset: 0,
} as const;

export const ZPaginationQuery = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(PAGINATION_DEFAULTS.maxLimit).optional().default(PAGINATION_DEFAULTS.defaultLimit),
  cursor: z.string().optional(),
});

export type PaginationQuery = z.infer<typeof ZPaginationQuery>;

/**
 * Cursor-based pagination query for seek/keyset pagination.
 * Preferred over offset pagination for large datasets.
 */
export const ZCursorPaginationQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(PAGINATION_DEFAULTS.maxLimit).optional().default(PAGINATION_DEFAULTS.defaultLimit),
});

export type CursorPaginationQuery = z.infer<typeof ZCursorPaginationQuery>;

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

// ============================================================================
// Error Response Schemas
// ============================================================================

/**
 * Field-level validation error for form integration
 */
export const ZFieldError = z.object({
  /** Field path (e.g., "email", "address.city") */
  field: z.string(),
  /** Human-readable error message */
  message: z.string(),
  /** Optional error code for programmatic handling */
  code: z.string().optional(),
});

export type FieldError = z.infer<typeof ZFieldError>;

/**
 * Standard API error response envelope
 *
 * All API errors follow this structure for consistent client handling.
 * The frontend normalizeError() function expects this shape.
 */
export const ZErrorResponse = z.object({
  error: z.object({
    /** Error code from ErrorCode enum (e.g., "AUTH_UNAUTHENTICATED", "VALIDATION_FAILED") */
    code: z.string(),
    /** Human-readable error message */
    message: z.string(),
    /** Unique request ID for tracing/support */
    requestId: z.string(),
    /** Suggested user action (e.g., "Please sign in to continue.") */
    action: z.string().optional(),
    /** Whether the operation can be retried */
    retryable: z.boolean().optional(),
    /** Field-level validation errors for form integration */
    fields: z.array(ZFieldError).optional(),
    /** Additional error details (rate limit info, etc.) */
    details: z.record(z.unknown()).optional(),
  }),
});

export type ErrorResponse = z.infer<typeof ZErrorResponse>;

/**
 * Error response for 4xx client errors
 */
export const ZClientErrorResponse = ZErrorResponse;
export type ClientErrorResponse = ErrorResponse;

/**
 * Error response for 5xx server errors
 */
export const ZServerErrorResponse = ZErrorResponse;
export type ServerErrorResponse = ErrorResponse;

/**
 * Rate limit error with retry information
 */
export const ZRateLimitErrorResponse = z.object({
  error: ZErrorResponse.shape.error.extend({
    details: z.object({
      retryAfterSec: z.number().optional(),
      remaining: z.number().optional(),
      resetAt: z.number().optional(),
    }).optional(),
  }),
});

export type RateLimitErrorResponse = z.infer<typeof ZRateLimitErrorResponse>;

/**
 * Validation error with field details
 */
export const ZValidationErrorResponse = z.object({
  error: ZErrorResponse.shape.error.extend({
    code: z.literal('VALIDATION_FAILED'),
    fields: z.array(ZFieldError),
  }),
});

export type ValidationErrorResponse = z.infer<typeof ZValidationErrorResponse>;
