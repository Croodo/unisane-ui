import { z } from 'zod';
import { base64UrlDecodeUtf8, BadRequestError } from '@unisane/kernel';

// ─── INLINE TYPES (previously from registry/types) ──────────────────────────

/** Supported filter operators */
export type Op = 'eq' | 'contains' | 'in' | 'gte' | 'lte';

/** Field data types */
export type FieldType = 'string' | 'date' | 'enum' | 'number';

/** Field definition for filtering/sorting */
export interface FieldDef {
  /** Database field key */
  key: string;
  /** Data type */
  type: FieldType;
  /** Allowed filter operators */
  ops: Op[];
  /** For enum types: allowed values */
  enumValues?: readonly string[];
  /** For enum types: ranking for sorting */
  enumRank?: Record<string, number>;
}

// Maximum allowed size for filters parameter (prevents DoS via large payloads)
const MAX_FILTERS_SIZE = 10_000; // 10KB

/**
 * Truncate a string for error messages (don't expose entire payload).
 */
function truncate(str: string, maxLen = 50): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '...';
}

/**
 * Query parsing error with developer-friendly context.
 *
 * Error Message Style Guide:
 * 1. State what went wrong clearly
 * 2. Include the problematic value (truncated if too long)
 * 3. State what was expected
 * 4. Suggest how to fix (when possible)
 *
 * @example
 * // Bad: "filters must be valid JSON"
 * // Good: "filters parameter is not valid JSON. Received: '{invalid...'. Expected: JSON array like [{field, op, value}]."
 */
function queryError(message: string): BadRequestError {
  return new BadRequestError(message);
}

// Maximum date range allowed (in days)
const MAX_DATE_RANGE_DAYS = 90;

// Valid filter operations
const VALID_OPS = new Set<string>(['eq', 'contains', 'in', 'gte', 'lte']);

/** Clamp a number to integer within [min, max] range */
function clampInt(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(val)));
}

export type Filter = { field: string; op: Op; value: unknown };

export const ZRFC3339 = z.string().datetime();

export function parseListParams(
  qp: URLSearchParams,
  opts?: { defaultLimit?: number; maxLimit?: number; minLimit?: number }
) {
  const min = opts?.minLimit ?? 1;
  const def = opts?.defaultLimit ?? 20;
  const max = opts?.maxLimit ?? 200;
  const rawLimit = Number(qp.get('limit') ?? def);
  const limitNum = Number.isFinite(rawLimit) ? rawLimit : def;
  const limit = clampInt(limitNum, min, max);
  const cursor = qp.get('cursor') ?? undefined;
  const offsetRaw = qp.get('offset');
  const offsetParsed = offsetRaw !== null ? Number(offsetRaw) : undefined;
  const offset = Number.isFinite(offsetParsed ?? NaN) ? offsetParsed : undefined;
  const sort = qp.get('sort') ?? undefined;
  const filtersRaw = qp.get('filters');
  return { limit, cursor, offset, sort, filtersRaw };
}

const ZFilterItem = z.object({
  field: z.string().min(1).max(100), // Reasonable field name limits
  op: z.string().refine((op) => VALID_OPS.has(op), {
    message: `op must be one of: ${Array.from(VALID_OPS).join(', ')}`,
  }),
  value: z.unknown().optional(),
});

export function parseFilters(filtersRaw: string | undefined, registry: Record<string, FieldDef>): Filter[] {
  if (!filtersRaw) return [];

  // Size limit check to prevent DoS
  if (filtersRaw.length > MAX_FILTERS_SIZE) {
    throw queryError(
      `filters parameter exceeds maximum size. ` +
      `Received: ${filtersRaw.length} characters. Maximum: ${MAX_FILTERS_SIZE} characters.`
    );
  }

  let input: unknown;
  try {
    input = JSON.parse(filtersRaw);
  } catch {
    // try base64url JSON per docs convention
    try {
      const decoded = base64UrlDecodeUtf8(filtersRaw);
      if (!decoded) throw new Error('decode failed');
      input = JSON.parse(decoded);
    } catch {
      throw queryError(
        `filters parameter is not valid JSON or base64url-encoded JSON. ` +
        `Received: '${truncate(filtersRaw)}'. ` +
        `Expected: JSON array like [{"field":"status","op":"eq","value":"active"}] ` +
        `or base64url-encoded equivalent.`
      );
    }
  }

  // Validate parsed data is an array
  if (!Array.isArray(input)) {
    throw queryError(
      `filters must be an array. ` +
      `Received: ${typeof input}. ` +
      `Expected: array of filter objects like [{"field":"status","op":"eq","value":"active"}].`
    );
  }

  // Limit number of filters to prevent abuse
  if (input.length > 50) {
    throw queryError(
      `Too many filters. Received: ${input.length} filters. Maximum: 50 filters.`
    );
  }

  const parsed = z.array(ZFilterItem).safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    const path = firstError?.path.join('.') || 'unknown';
    throw queryError(
      `Invalid filter at index ${path}. ` +
      `Error: ${firstError?.message ?? 'invalid format'}. ` +
      `Expected each filter to have: {field: string, op: "eq"|"contains"|"in"|"gte"|"lte", value: any}.`
    );
  }

  const out: Filter[] = [];
  for (const f of parsed.data) {
    const field = f.field;
    const op = f.op as Op;
    const value = f.value as unknown;
    const def = registry[field];
    if (!def) {
      const validFields = Object.keys(registry).slice(0, 10).join(', ');
      throw queryError(
        `Unknown filter field: '${field}'. ` +
        `Valid fields include: ${validFields}${Object.keys(registry).length > 10 ? '...' : ''}.`
      );
    }
    if (!def.ops.includes(op)) {
      throw queryError(
        `Unsupported operator '${op}' for field '${field}'. ` +
        `Supported operators: ${def.ops.join(', ')}.`
      );
    }

    // Validate value type matches field type
    if (value !== undefined && value !== null) {
      validateValueType(field, def, op, value);
    }

    out.push({ field, op, value });
  }
  return out;
}

function validateValueType(field: string, def: FieldDef, op: Op, value: unknown): void {
  if (op === 'in') {
    if (!Array.isArray(value)) {
      throw queryError(
        `'in' operator requires an array value for field '${field}'. ` +
        `Received: ${typeof value}. ` +
        `Example: {"field":"${field}","op":"in","value":["a","b","c"]}.`
      );
    }
    // Limit array size
    if (value.length > 100) {
      throw queryError(
        `'in' operator array too large for field '${field}'. ` +
        `Received: ${value.length} items. Maximum: 100 items.`
      );
    }
    return;
  }

  if (def.type === 'date' && (op === 'gte' || op === 'lte')) {
    if (typeof value !== 'string') {
      throw queryError(
        `Date field '${field}' requires a string value. ` +
        `Received: ${typeof value}. ` +
        `Expected: ISO 8601 format like "2024-01-15T00:00:00Z".`
      );
    }
    const parsed = Date.parse(value);
    if (isNaN(parsed)) {
      throw queryError(
        `Invalid date format for field '${field}'. ` +
        `Received: '${truncate(value)}'. ` +
        `Expected: ISO 8601 format like "2024-01-15T00:00:00Z".`
      );
    }
  }

  if (def.type === 'number' && (op === 'gte' || op === 'lte' || op === 'eq')) {
    const num = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(num)) {
      throw queryError(
        `Invalid number value for field '${field}'. ` +
        `Received: '${truncate(String(value))}'. ` +
        `Expected: a valid number.`
      );
    }
  }

  if (op === 'contains' && typeof value !== 'string') {
    throw queryError(
      `'contains' operator requires a string value for field '${field}'. ` +
      `Received: ${typeof value}. ` +
      `Example: {"field":"${field}","op":"contains","value":"search term"}.`
    );
  }
}

export function applyFilters<T extends Record<string, unknown>>(
  items: T[],
  filters: Filter[],
  registry: Record<string, FieldDef>
): T[] {
  let res = items;
  for (const f of filters) {
    const def = registry[f.field];
    if (!def) continue; // should have been validated in parseFilters
    const key = def.key as keyof T;
    res = res.filter((it) => match(it[key], f, def));
  }
  return res;
}

function match(value: unknown, f: Filter, def: FieldDef): boolean {
  switch (f.op) {
    case 'eq':
      return value === f.value;
    case 'contains':
      if (typeof value !== 'string' || typeof f.value !== 'string') return false;
      return value.toLowerCase().includes(f.value.toLowerCase());
    case 'in':
      return Array.isArray(f.value) ? (f.value as unknown[]).includes(value) : false;
    case 'gte': {
      if (def.type === 'date') {
        const v = toMillis(value, def);
        const t = toMillis(f.value, def);
        return v !== null && t !== null ? v >= t : false;
      }
      if (def.type === 'number') {
        const v = toNum(value);
        const t = toNum(f.value);
        return v !== null && t !== null ? v >= t : false;
      }
      return false;
    }
    case 'lte': {
      if (def.type === 'date') {
        const v = toMillis(value, def);
        const t = toMillis(f.value, def);
        return v !== null && t !== null ? v <= t : false;
      }
      if (def.type === 'number') {
        const v = toNum(value);
        const t = toNum(f.value);
        return v !== null && t !== null ? v <= t : false;
      }
      return false;
    }
    default:
      return false;
  }
}

function toMillis(val: unknown, def: FieldDef): number | null {
  if (def.type !== 'date') return null;
  if (typeof val === 'string') {
    const d = Date.parse(val);
    return isNaN(d) ? null : d;
  }
  if (val instanceof Date) return val.getTime();
  return null;
}

function toNum(val: unknown): number | null {
  if (typeof val === 'number') return val;
  if (typeof val === 'string' && val.trim().length) {
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export interface DateRangeValidationOptions {
  maxDays?: number;
  allowEmpty?: boolean;
}

export function validateRange(
  from?: string | null,
  to?: string | null,
  options?: DateRangeValidationOptions
): void {
  const { maxDays = MAX_DATE_RANGE_DAYS, allowEmpty = true } = options ?? {};

  // Both empty is allowed by default
  if (!from && !to) {
    if (!allowEmpty) {
      throw queryError(
        `Date range is required. ` +
        `Provide 'from' and/or 'to' parameters in ISO 8601 format like "2024-01-15T00:00:00Z".`
      );
    }
    return;
  }

  // Parse and validate individual dates
  let fromMs: number | null = null;
  let toMs: number | null = null;

  if (from) {
    const parseResult = ZRFC3339.safeParse(from);
    if (!parseResult.success) {
      throw queryError(
        `Invalid 'from' date format. ` +
        `Received: '${truncate(from)}'. ` +
        `Expected: ISO 8601 format like "2024-01-15T00:00:00Z".`
      );
    }
    fromMs = Date.parse(from);
    if (isNaN(fromMs)) {
      throw queryError(
        `Cannot parse 'from' date. ` +
        `Received: '${truncate(from)}'. ` +
        `Expected: valid ISO 8601 date.`
      );
    }
  }

  if (to) {
    const parseResult = ZRFC3339.safeParse(to);
    if (!parseResult.success) {
      throw queryError(
        `Invalid 'to' date format. ` +
        `Received: '${truncate(to)}'. ` +
        `Expected: ISO 8601 format like "2024-01-15T00:00:00Z".`
      );
    }
    toMs = Date.parse(to);
    if (isNaN(toMs)) {
      throw queryError(
        `Cannot parse 'to' date. ` +
        `Received: '${truncate(to)}'. ` +
        `Expected: valid ISO 8601 date.`
      );
    }
  }

  // If both dates present, validate the range
  if (fromMs !== null && toMs !== null) {
    // Check for reversed range
    if (toMs < fromMs) {
      throw queryError(
        `Invalid date range: 'to' date must be after 'from' date. ` +
        `Received: from=${from}, to=${to}.`
      );
    }

    // Check for max range
    const maxMs = maxDays * 24 * 60 * 60 * 1000;
    const rangeMs = toMs - fromMs;
    if (rangeMs > maxMs) {
      const actualDays = Math.ceil(rangeMs / (24 * 60 * 60 * 1000));
      throw queryError(
        `Date range too large. ` +
        `Received: ${actualDays} days. Maximum: ${maxDays} days.`
      );
    }
  }
}

// Utility function for common date range extraction from filters
export function extractDateRange(
  filters: Filter[],
  fieldName: string
): { from?: string; to?: string } {
  const result: { from?: string; to?: string } = {};

  for (const f of filters) {
    if (f.field === fieldName) {
      if (f.op === 'gte' && typeof f.value === 'string') {
        result.from = f.value;
      } else if (f.op === 'lte' && typeof f.value === 'string') {
        result.to = f.value;
      }
    }
  }

  return result;
}
