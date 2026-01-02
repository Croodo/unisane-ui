import { DuplicateRowIdError } from "../errors";

/**
 * Validates that all row IDs are unique.
 * @throws DuplicateRowIdError if duplicate IDs are found
 */
export function validateRowIds<T extends { id: string }>(data: T[]): void {
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const row of data) {
    if (seen.has(row.id)) {
      duplicates.push(row.id);
    } else {
      seen.add(row.id);
    }
  }

  if (duplicates.length > 0) {
    throw new DuplicateRowIdError([...new Set(duplicates)]);
  }
}

/**
 * Checks for duplicate row IDs without throwing.
 * @returns Array of duplicate IDs, or empty array if all unique
 */
export function findDuplicateRowIds<T extends { id: string }>(data: T[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const row of data) {
    if (seen.has(row.id)) {
      duplicates.add(row.id);
    } else {
      seen.add(row.id);
    }
  }

  return Array.from(duplicates);
}

/**
 * Ensures each row in the data array has a unique `id` field.
 * If a row doesn't have an `id`, generates one based on index.
 *
 * @param data - Array of data rows
 * @param validateUnique - If true, validates that all IDs are unique after assignment (default: false)
 * @throws DuplicateRowIdError if validateUnique is true and duplicates are found
 *
 * @remarks
 * When T already has an `id` property (T extends { id: string }), the return type
 * is effectively T[] since (T & { id: string }) = T in that case.
 */
export function ensureRowIds<T extends Record<string, unknown>>(
  data: T[],
  validateUnique?: boolean
): Array<T & { id: string }>;
export function ensureRowIds<T extends { id: string }>(
  data: T[],
  validateUnique?: boolean
): T[];
export function ensureRowIds<T extends Record<string, unknown>>(
  data: T[],
  validateUnique: boolean = false
): Array<T & { id: string }> {
  const result = data.map((row, index) => {
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

  if (validateUnique) {
    validateRowIds(result);
  }

  return result;
}
