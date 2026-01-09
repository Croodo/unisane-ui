/**
 * Split a comma vector sort (e.g. "-updatedAt,name") into DB-allowed and enriched-only keys.
 * Returns the DB part as a comma string and an array of enriched keys (with original +/-).
 */
export function splitDbAndEnrichedSort(
  sortRaw: string | undefined,
  allowedDb: Set<string>
): { db: string; enriched: string[] } {
  if (!sortRaw) return { db: "", enriched: [] };
  const keys = sortRaw.split(",").map((s) => s.trim()).filter(Boolean);
  const db: string[] = [];
  const enriched: string[] = [];
  for (const k of keys) {
    const base = k.replace(/^[-+]/, "");
    (allowedDb.has(base) ? db : enriched).push(k);
  }
  return { db: db.join(","), enriched };
}

