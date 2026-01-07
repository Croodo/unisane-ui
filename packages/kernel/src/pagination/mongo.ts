import type { Collection, Document, Filter, WithId } from "mongodb";
import type { SortField, SeekPageResult } from "./types";
import { decodeBase64UrlJson, encodeBase64UrlJson } from "../encoding/base64urlJson";

// ---------------------------------------------
// Mongo helpers (seek over sort vector)
// ---------------------------------------------

export type CursorTokenPayload = {
  v: 2;
  sort: string;
  keys: Record<string, string>;
  rev?: boolean;
};

export function encodeCursorToken(p: CursorTokenPayload): string {
  return encodeBase64UrlJson(p);
}

export function decodeCursorToken(
  s: string | null | undefined
): CursorTokenPayload | null {
  if (!s) return null;
  try {
    const val = decodeBase64UrlJson(s) as CursorTokenPayload | null;
    if (
      val?.v === 2 &&
      val?.sort &&
      typeof val.sort === "string" &&
      val?.keys &&
      typeof val.keys === "object"
    )
      return val;
    return null;
  } catch {
    return null;
  }
}

export function toMongoSort(vec: SortField[]): Record<string, 1 | -1> {
  return Object.fromEntries(vec.map((f) => [f.key, f.order]));
}

export function buildSeekPredicate(
  vec: SortField[],
  last: Record<string, unknown>,
  invert = false
) {
  // (f1 < v1) OR (f1 == v1 AND f2 < v2) OR ... (adjust operators by order)
  const or: Array<Record<string, unknown>> = [];
  for (let i = 0; i < vec.length; i++) {
    const and: Array<Record<string, unknown>> = [];
    for (let j = 0; j < i; j++) {
      const prev = vec[j]!;
      and.push({ [prev.key]: (last as Record<string, unknown>)[prev.key] });
    }
    const f = vec[i]!;
    // If invert is true, flip the operator: -1 (desc) becomes $gt, 1 (asc) becomes $lt
    const order = invert ? -f.order : f.order;
    const op = order === -1 ? "$lt" : "$gt";
    const raw = (last as Record<string, unknown>)[f.key];
    let val: unknown = raw;
    if (typeof raw === "string") {
      // Heuristic: cast ISO timestamps for keys ending with 'At' back to Date
      if (/At$|Date$/.test(f.key) && /\d{4}-\d{2}-\d{2}T/.test(raw)) {
        const d = new Date(raw);
        if (!Number.isNaN(d.getTime())) val = d;
      }
    }
    and.push({ [f.key]: { [op]: val } });
    or.push({ $and: and } as Record<string, unknown>);
  }
  return or.length ? ({ $or: or } as Record<string, unknown>) : {};
}

export type FindQuery<T> = {
  sort: (s: Record<string, 1 | -1>) => {
    limit: (n: number) => { lean: () => Promise<T[]> };
  };
};
export type ModelLike<T> = {
  find: (
    filter: Record<string, unknown>,
    projection?: Record<string, 0 | 1>
  ) => FindQuery<T>;
};

export async function seekPageMongo<T extends { _id: unknown }>(opts: {
  Model: ModelLike<T>;
  baseFilter?: Record<string, unknown>;
  limit: number;
  cursor?: string | null;
  sortVec: SortField[];
  projection?: Record<string, 0 | 1>;
}) {
  // NOTE: This helper is not fully updated for bidirectional support yet (used by Mongoose models?)
  // Focusing on seekPageMongoCollection which is used by the repo.
  const filter: Record<string, unknown> = { ...(opts.baseFilter ?? {}) };
  let cursorPayload: CursorTokenPayload | null = null;
  if (opts.cursor) {
    cursorPayload = decodeCursorToken(opts.cursor);
    if (cursorPayload?.keys)
      Object.assign(
        filter,
        buildSeekPredicate(opts.sortVec, cursorPayload.keys)
      );
  }
  const docs = await opts.Model.find(filter, opts.projection)
    .sort(toMongoSort(opts.sortVec))
    .limit(opts.limit + 1)
    .lean();
  const hasMore = docs.length > opts.limit;
  const items = hasMore ? docs.slice(0, opts.limit) : docs;
  const mkKeys = (row: unknown) => {
    const obj = row as Record<string, unknown>;
    return Object.fromEntries(
      opts.sortVec.map((f) => {
        const v = obj[f.key];
        const out = v instanceof Date ? v.toISOString() : String(v ?? "");
        return [f.key, out];
      })
    ) as Record<string, string>;
  };
  const nextCursor = items.length
    ? encodeCursorToken({
        v: 2,
        sort: JSON.stringify(opts.sortVec),
        keys: mkKeys(items[items.length - 1]),
      })
    : undefined;
  const prevCursor = items.length
    ? encodeCursorToken({
        v: 2,
        sort: JSON.stringify(opts.sortVec),
        keys: mkKeys(items[0]),
        rev: true,
      })
    : undefined;
  return { items, nextCursor, prevCursor } as const;
}

/**
 * Driver-friendly seek pagination using a Mongo collection directly.
 *
 * Cursor logic:
 * - Forward navigation: nextCursor points to last item (if hasMore), prevCursor points to first item
 * - Backward navigation: nextCursor points to last item (to continue forward), prevCursor only if hasMore
 *
 * The key insight: when going backwards and hasMore=false, we've reached page 1, so no prevCursor.
 * When going backwards and returning results, nextCursor should point to the LAST item of the result
 * (so clicking Next continues forward from where we are), not the first.
 */
export async function seekPageMongoCollection<
  T extends Document,
  Out = WithId<T>,
>(opts: {
  collection: Collection<T>;
  baseFilter?: Record<string, unknown>;
  limit: number;
  cursor?: string | null;
  sortVec: SortField[];
  projection?: Record<string, 0 | 1>;
  map?: (doc: WithId<T>) => Out;
}): Promise<SeekPageResult<Out>> {
  const filter: Filter<T> = { ...(opts.baseFilter ?? {}) } as Filter<T>;
  let cursorPayload: CursorTokenPayload | null = null;
  let isReverse = false;
  let hadValidCursor = false;

  if (opts.cursor) {
    cursorPayload = decodeCursorToken(opts.cursor);
    // If the cursor's sort definition doesn't match the current request, invalidate it.
    if (cursorPayload && cursorPayload.sort !== JSON.stringify(opts.sortVec)) {
      cursorPayload = null;
    }

    if (cursorPayload?.keys) {
      hadValidCursor = true;
      isReverse = !!cursorPayload.rev;
      Object.assign(
        filter,
        buildSeekPredicate(opts.sortVec, cursorPayload.keys, isReverse)
      );
    }
  }

  const effectiveSortVec = isReverse
    ? opts.sortVec.map((f) => ({ ...f, order: -f.order as 1 | -1 }))
    : opts.sortVec;

  const docs = (await opts.collection
    .find(filter, opts.projection ? { projection: opts.projection } : undefined)
    .sort(toMongoSort(effectiveSortVec))
    .limit(opts.limit + 1)
    .toArray()) as WithId<T>[];

  const hasMore = docs.length > opts.limit;
  let itemsRaw = hasMore ? docs.slice(0, opts.limit) : docs;

  if (isReverse) {
    itemsRaw = itemsRaw.reverse();
  }

  const map = opts.map ?? ((d: WithId<T>) => d as unknown as Out);

  const mkKeys = (row: WithId<T>) =>
    Object.fromEntries(
      opts.sortVec.map((f) => {
        const v = (row as Record<string, unknown>)[f.key];
        const out = v instanceof Date ? v.toISOString() : String(v ?? "");
        return [f.key, out];
      })
    ) as Record<string, string>;

  const last = itemsRaw.length ? itemsRaw[itemsRaw.length - 1] : null;
  const first = itemsRaw.length ? itemsRaw[0] : null;

  // Determine if we're at the first page (no items before this)
  // - If we went backwards and hasMore=false, we reached the beginning
  // - If we had no cursor at all, we're at the beginning
  const isAtFirstPage = isReverse ? !hasMore : !hadValidCursor;

  // nextCursor: Always point to last item if there are more items forward
  // When going backwards, hasMore means more items backwards, not forwards
  // So when going backwards, we should provide nextCursor based on the last item of results
  // (since results are now in forward order after reverse())
  let nextCursor: string | undefined;
  if (isReverse) {
    // After going backwards, we want to enable "Next" to continue forward from the last item
    // We always have items if we went backwards successfully
    if (last) {
      nextCursor = encodeCursorToken({
        v: 2,
        sort: JSON.stringify(opts.sortVec),
        keys: mkKeys(last),
      });
    }
  } else {
    // Going forwards: nextCursor only if there are more items
    if (hasMore && last) {
      nextCursor = encodeCursorToken({
        v: 2,
        sort: JSON.stringify(opts.sortVec),
        keys: mkKeys(last),
      });
    }
  }

  // prevCursor: Point to first item to go backwards, but only if not at first page
  let prevCursor: string | undefined;
  if (!isAtFirstPage && first) {
    prevCursor = encodeCursorToken({
      v: 2,
      sort: JSON.stringify(opts.sortVec),
      keys: mkKeys(first),
      rev: true,
    });
  }

  const result: SeekPageResult<Out> = { items: itemsRaw.map(map) };
  if (nextCursor) result.nextCursor = nextCursor;
  if (prevCursor) result.prevCursor = prevCursor;
  return result;
}
