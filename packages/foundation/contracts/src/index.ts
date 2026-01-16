/**
 * @unisane/contracts
 *
 * Shared API contracts and schemas for the Unisane platform.
 * Contains Zod schemas for API validation and type definitions.
 */

import { z } from 'zod';

// Date range query (for stats/reports)
// CTR-002 FIX: Added refinement to ensure from < to when both are provided
export const ZDateRangeQuery = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  granularity: z.enum(['day', 'week', 'month']).optional(),
}).refine(
  (data) => {
    // Only validate when both dates are provided
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

/**
 * CTR-001 FIX: Page-based (offset) pagination query.
 *
 * Use this for smaller datasets where random page access is needed.
 * For large datasets, prefer ZCursorPaginationQuery for better performance.
 */
export const ZPagePaginationQuery = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(PAGINATION_DEFAULTS.maxLimit).optional().default(PAGINATION_DEFAULTS.defaultLimit),
});

export type PagePaginationQuery = z.infer<typeof ZPagePaginationQuery>;

/**
 * CTR-001 FIX: Cursor-based pagination query for seek/keyset pagination.
 *
 * Preferred over offset pagination for large datasets.
 * Provides consistent performance regardless of dataset size.
 */
export const ZCursorPaginationQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(PAGINATION_DEFAULTS.maxLimit).optional().default(PAGINATION_DEFAULTS.defaultLimit),
});

export type CursorPaginationQuery = z.infer<typeof ZCursorPaginationQuery>;

/**
 * CTR-001 FIX: Universal pagination query that accepts either page OR cursor (but not both).
 *
 * The schema validates that only one pagination method is used:
 * - If `cursor` is provided, use cursor-based pagination
 * - If `page` is provided (without cursor), use page-based pagination
 * - Default to page 1 if neither is provided
 *
 * @deprecated Prefer using ZPagePaginationQuery or ZCursorPaginationQuery directly
 *             for clearer intent and better type safety.
 */
export const ZPaginationQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(PAGINATION_DEFAULTS.maxLimit).optional().default(PAGINATION_DEFAULTS.defaultLimit),
  cursor: z.string().optional(),
}).refine(
  (data) => !(data.page && data.cursor),
  { message: 'Cannot use both page and cursor pagination - choose one' }
).transform((data) => ({
  ...data,
  // Default page to 1 only if cursor is not provided
  page: data.cursor ? undefined : (data.page ?? 1),
}));

export type PaginationQuery = z.infer<typeof ZPaginationQuery>;

// ID parameter
// CTR-003 FIX: Added max length and format validation for ID parameters
// IDs in Unisane follow the format: prefix_base64url (e.g., usr_abc123, tnt_xyz789)
export const ZIdParam = z.object({
  id: z.string()
    .min(1, 'ID is required')
    .max(100, 'ID too long (max 100 characters)')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'ID must contain only alphanumeric characters, underscores, and hyphens'
    ),
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
 * CTR-004 FIX: Enumerated error codes for type-safe error handling.
 *
 * These codes match the error catalog in @unisane/gateway.
 * Using an enum allows:
 * 1. Compile-time validation of error codes
 * 2. Auto-completion in IDEs
 * 3. OpenAPI spec generation with allowed values
 */
export const ERROR_CODES = [
  // Auth
  'AUTH_UNAUTHENTICATED',
  'AUTH_INVALID_CREDENTIALS',
  'AUTH_TOKEN_EXPIRED',
  'AUTH_FORBIDDEN',
  'AUTH_FORBIDDEN_ADMIN_ONLY',
  'AUTH_FORBIDDEN_OWNER_ONLY',
  'AUTH_FORBIDDEN_PLATFORM_ONLY',
  // Validation
  'VALIDATION_FAILED',
  'VALIDATION_EMAIL_INVALID',
  'VALIDATION_PHONE_INVALID',
  'VALIDATION_PASSWORD_WEAK',
  'VALIDATION_FIELD_REQUIRED',
  'VALIDATION_OTP_EXPIRED',
  'VALIDATION_OTP_INVALID',
  // Resources
  'RESOURCE_NOT_FOUND',
  'RESOURCE_USER_NOT_FOUND',
  'RESOURCE_TENANT_NOT_FOUND',
  'RESOURCE_SETTING_NOT_FOUND',
  // Conflicts
  'CONFLICT_ALREADY_EXISTS',
  'CONFLICT_VERSION_MISMATCH',
  'CONFLICT_PHONE_REGISTERED',
  'CONFLICT_EMAIL_REGISTERED',
  'CONFLICT_USERNAME_TAKEN',
  // Billing
  'BILLING_INSUFFICIENT_CREDITS',
  'BILLING_SEAT_LIMIT_REACHED',
  'BILLING_PAYMENT_FAILED',
  'BILLING_SUBSCRIPTION_REQUIRED',
  // Rate Limiting
  'RATE_LIMITED',
  // Server
  'SERVER_MISCONFIGURED',
  'SERVER_INTERNAL',
  'SERVER_UNAVAILABLE',
  'SERVER_DATABASE_ERROR',
] as const;

export const ZErrorCode = z.enum(ERROR_CODES);
export type ErrorCode = z.infer<typeof ZErrorCode>;

/**
 * Field-level validation error for form integration
 */
export const ZFieldError = z.object({
  /** Field path (e.g., "email", "address.city") */
  field: z.string(),
  /** Human-readable error message */
  message: z.string(),
  /** Optional error code for programmatic handling */
  code: ZErrorCode.optional(),
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
    code: ZErrorCode,
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

// ============================================================================
// CTR-007 FIX: Standard Success Response Envelopes
// ============================================================================

/**
 * CTR-007 FIX: Generic success response wrapper for single items.
 * Standardizes all API success responses with { ok: true, data: T } pattern.
 *
 * @example
 * ```typescript
 * // In contract definition:
 * responses: {
 *   200: ZSuccessResponse(ZUserSchema),
 *   ...ROUTE_ERRORS.protected,
 * }
 * ```
 */
export function ZSuccessResponse<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    ok: z.literal(true),
    data: dataSchema,
  });
}

/**
 * CTR-007 FIX: Success response for operations that don't return data.
 * Use for DELETE, POST actions that just need confirmation.
 *
 * @example
 * ```typescript
 * responses: {
 *   200: ZOkResponse,
 *   ...ROUTE_ERRORS.protected,
 * }
 * ```
 */
export const ZOkResponse = z.object({
  ok: z.literal(true),
});

export type OkResponse = z.infer<typeof ZOkResponse>;

/**
 * CTR-007 FIX: Success response with optional message.
 * Use for operations that return a confirmation message.
 */
export const ZMessageResponse = z.object({
  ok: z.literal(true),
  message: z.string(),
});

export type MessageResponse = z.infer<typeof ZMessageResponse>;

/**
 * CTR-007 FIX: Type helper for success response inference.
 */
export type SuccessResponse<T> = {
  ok: true;
  data: T;
};

// ============================================================================
// CTR-005 FIX: Standard Error Response Presets for Route Contracts
// ============================================================================

/**
 * CTR-005 FIX: Standard error responses for authenticated routes.
 *
 * Use these in ts-rest contract definitions to document all possible error codes:
 *
 * @example
 * ```typescript
 * import { ROUTE_ERRORS } from '@unisane/contracts';
 *
 * const myRoute = {
 *   method: 'GET',
 *   path: '/api/v1/resource',
 *   responses: {
 *     200: ZSuccessResponse,
 *     ...ROUTE_ERRORS.authenticated,
 *   },
 * };
 * ```
 */
export const ROUTE_ERRORS = {
  /**
   * Error responses for public (unauthenticated) routes.
   * Includes: 400 Bad Request, 422 Validation, 429 Rate Limit, 500/503 Server
   */
  public: {
    400: ZErrorResponse,
    422: ZValidationErrorResponse,
    429: ZRateLimitErrorResponse,
    500: ZErrorResponse,
    503: ZErrorResponse,
  },

  /**
   * Error responses for authenticated routes (requires login).
   * Includes: 400, 401 Unauthorized, 422, 429, 500, 503
   */
  authenticated: {
    400: ZErrorResponse,
    401: ZErrorResponse,
    422: ZValidationErrorResponse,
    429: ZRateLimitErrorResponse,
    500: ZErrorResponse,
    503: ZErrorResponse,
  },

  /**
   * Error responses for protected routes (requires login + authorization).
   * Includes: 400, 401, 403 Forbidden, 404 Not Found, 422, 429, 500, 503
   */
  protected: {
    400: ZErrorResponse,
    401: ZErrorResponse,
    403: ZErrorResponse,
    404: ZErrorResponse,
    422: ZValidationErrorResponse,
    429: ZRateLimitErrorResponse,
    500: ZErrorResponse,
    503: ZErrorResponse,
  },

  /**
   * Error responses for admin-only routes.
   * Same as protected but emphasizes admin access requirements.
   */
  admin: {
    400: ZErrorResponse,
    401: ZErrorResponse,
    403: ZErrorResponse,
    404: ZErrorResponse,
    422: ZValidationErrorResponse,
    429: ZRateLimitErrorResponse,
    500: ZErrorResponse,
    503: ZErrorResponse,
  },

  /**
   * Error responses for billing/payment routes.
   * Includes 402 Payment Required.
   */
  billing: {
    400: ZErrorResponse,
    401: ZErrorResponse,
    402: ZErrorResponse,
    403: ZErrorResponse,
    404: ZErrorResponse,
    422: ZValidationErrorResponse,
    429: ZRateLimitErrorResponse,
    500: ZErrorResponse,
    503: ZErrorResponse,
  },
} as const;

// ============================================================================
// CTR-009 FIX: Pagination Result Schemas
// ============================================================================

/**
 * CTR-009 FIX: Generic pagination result wrapper for cursor-based pagination.
 *
 * Use this for list endpoints to provide consistent pagination response structure.
 *
 * @example
 * ```typescript
 * // In contract definition:
 * responses: {
 *   200: ZCursorPaginationResult(ZUserSchema),
 * }
 * ```
 */
export function ZCursorPaginationResult<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    /** The list of items for this page */
    items: z.array(itemSchema),
    /** Cursor to fetch the next page (null if no more pages) */
    nextCursor: z.string().nullable(),
    /** Cursor to fetch the previous page (null if on first page) */
    prevCursor: z.string().nullable().optional(),
    /** Whether there are more items after this page */
    hasMore: z.boolean(),
    /** Total count of items (optional, expensive for large datasets) */
    total: z.number().int().nonnegative().optional(),
  });
}

/**
 * CTR-009 FIX: Generic pagination result wrapper for page-based (offset) pagination.
 *
 * @example
 * ```typescript
 * // In contract definition:
 * responses: {
 *   200: ZPagePaginationResult(ZUserSchema),
 * }
 * ```
 */
export function ZPagePaginationResult<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    /** The list of items for this page */
    items: z.array(itemSchema),
    /** Current page number (1-indexed) */
    page: z.number().int().min(1),
    /** Items per page */
    limit: z.number().int().min(1).max(PAGINATION_DEFAULTS.maxLimit),
    /** Total number of items across all pages */
    total: z.number().int().nonnegative(),
    /** Total number of pages */
    totalPages: z.number().int().nonnegative(),
    /** Whether there are more pages after this one */
    hasMore: z.boolean(),
  });
}

/**
 * Type helper to infer pagination result types.
 */
export type CursorPaginationResult<T> = {
  items: T[];
  nextCursor: string | null;
  prevCursor?: string | null;
  hasMore: boolean;
  total?: number;
};

export type PagePaginationResult<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};
