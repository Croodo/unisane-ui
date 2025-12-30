/**
 * Ensures each row in the data array has a unique `id` field.
 * If a row doesn't have an `id`, generates one based on index.
 */
export function ensureRowIds<T extends Record<string, unknown>>(
  data: T[]
): (T & { id: string })[] {
  return data.map((row, index) => {
    if (row.id !== undefined && row.id !== null) {
      return { ...row, id: String(row.id) };
    }

    // Try common ID field names
    const possibleIdFields = ["_id", "key", "uid", "uuid"];
    for (const field of possibleIdFields) {
      if (row[field] !== undefined && row[field] !== null) {
        return { ...row, id: String(row[field]) };
      }
    }

    // Fallback to index-based ID
    return { ...row, id: `row-${index}` };
  });
}
