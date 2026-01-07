import { z } from 'zod';
import type { FieldDef, Op } from '../registry/types';
import { base64UrlDecodeUtf8 } from '@unisane/kernel';

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

const ZFilterItem = z.object({ field: z.string(), op: z.string(), value: z.unknown().optional() });

export function parseFilters(filtersRaw: string | undefined, registry: Record<string, FieldDef>): Filter[] {
  if (!filtersRaw) return [];
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
      throw new Error('filters must be valid JSON (or base64url JSON)');
    }
  }
  const parsed = z.array(ZFilterItem).safeParse(input);
  if (!parsed.success) throw new Error('filters must be an array of {field,op,value}');
  const out: Filter[] = [];
  for (const f of parsed.data) {
    const field = f.field;
    const op = f.op as Op;
    const value = f.value as unknown;
    const def = registry[field];
    if (!def) throw new Error(`Unknown field: ${field}`);
    if (!def.ops.includes(op)) throw new Error(`Unsupported op '${op}' for ${field}`);
    out.push({ field, op, value });
  }
  return out;
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

export function validateRange(from?: string | null, to?: string | null) {
  if (!from && !to) return;
  const f = from ? ZRFC3339.parse(from) : null;
  const t = to ? ZRFC3339.parse(to) : null;
  if (f && t) {
    const ms = Date.parse(t) - Date.parse(f);
    const max = 90 * 24 * 60 * 60 * 1000; // 90d
    if (ms > max) throw new Error('range > 90d not allowed');
  }
}
