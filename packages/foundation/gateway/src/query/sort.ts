/**
 * Sort utilities for query parsing and comparison.
 */

/** Field definition for sorting - minimal interface */
export interface SortFieldDef {
  /** Database key to sort by */
  key: string;
  /** Optional ranking for enum values */
  enumRank?: Record<string, number>;
}

export type SortSpec = Array<{ field: string; dir: 'asc' | 'desc' }>;

export function parseSort(input: string | undefined, registry: Record<string, SortFieldDef>): SortSpec {
  if (!input) return [];
  const parts = input.split(',').map((s) => s.trim()).filter(Boolean);
  const spec: SortSpec = [];
  for (const p of parts) {
    const dir: 'asc' | 'desc' = p.startsWith('-') ? 'desc' : 'asc';
    const field = p.replace(/^[-+]/, '');
    if (!registry[field]) throw new Error(`Unknown sort field: ${field}`);
    spec.push({ field, dir });
  }
  return spec;
}

export function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === undefined) return -1;
  if (b === undefined) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const as = String(a);
  const bs = String(b);
  return as < bs ? -1 : as > bs ? 1 : 0;
}

export function makeComparator<T extends Record<string, unknown>>(
  registry: Record<string, SortFieldDef>,
  sort: SortSpec
) {
  return (a: T, b: T) => {
    for (const s of sort) {
      const def = registry[s.field];
      if (!def) continue; // parseSort should prevent this; extra guard for safety
      const av = (a as Record<string, unknown>)[def.key];
      const bv = (b as Record<string, unknown>)[def.key];
      let cmp = 0;
      if (def.enumRank && typeof av === 'string' && typeof bv === 'string') {
        cmp = compareValues(def.enumRank[av] ?? -1, def.enumRank[bv] ?? -1);
      } else {
        cmp = compareValues(av, bv);
      }
      if (cmp !== 0) return s.dir === 'asc' ? cmp : -cmp;
    }
    // stable tie-break by _id
    return compareValues(
      (a as Record<string, unknown>)['_id'],
      (b as Record<string, unknown>)['_id']
    );
  };
}
