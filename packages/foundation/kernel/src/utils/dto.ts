import { z } from 'zod';

// Common HTTP DTO shapes used across routes and services

// Base64url or opaque cursors; keep lenient to support various encodings
export const ZCursor = z.string().min(1, 'cursor must be a non-empty string');
export type Cursor = z.infer<typeof ZCursor>;

// Page size bounds (keep conservative defaults)
export const ZLimit = z.number().int().min(1).max(200).default(20);
export type Limit = z.infer<typeof ZLimit>;

// Idempotency-Key header value
export const ZIdem = z.string().min(8, 'idempotency key too short');
export type Idem = z.infer<typeof ZIdem>;

// Coercing variants for query parsing (strings -> numbers)
export const ZLimitCoerce = z.coerce.number().int().min(1).max(200).default(20);

// Common seek pagination query: cursor + limit
export const ZSeekPageQuery = z.object({
  cursor: ZCursor.optional(),
  limit: ZLimitCoerce,
});
export type SeekPageQuery = z.infer<typeof ZSeekPageQuery>;

// Variant for lists that support sort
export const ZSeekPageWithSort = ZSeekPageQuery.extend({
  sort: z.string().optional(),
});
export type SeekPageWithSort = z.infer<typeof ZSeekPageWithSort>;

// Utility to clamp an integer within bounds
export function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(value)));
}
