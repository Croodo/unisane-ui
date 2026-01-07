export function ensureRowIds<T extends Record<string, unknown>>(
  rows: T[]
): Array<T & { id: string }> {
  const safeRows = Array.isArray(rows) ? rows : [];
  return safeRows.map((row, index) => {
    const r = (row ?? {}) as Record<string, unknown>;
    const rawId = r.id ?? r._id;
    const id =
      typeof rawId === "string" ? rawId : rawId != null ? String(rawId) : "";

    // If the row already has a usable string `id`, keep the original object reference.
    if (typeof r.id === "string" && r.id.trim().length) {
      return row as T & { id: string };
    }

    // If we can derive a non-empty id (from `id` or `_id`), materialize `id` on the row.
    if (id.trim().length) {
      return { ...(row as T), id } as T & { id: string };
    }
    return { ...(row as T), id: `row_${index}` } as T & { id: string };
  });
}
