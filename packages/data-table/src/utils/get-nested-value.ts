/**
 * Gets a nested value from an object using dot notation
 * @param obj - The object to get the value from
 * @param path - The path to the value (e.g., "user.name" or "items.0.id")
 * @returns The value at the path, or undefined if not found
 */
export function getNestedValue<TResult = unknown, TObj extends object = Record<string, unknown>>(
  obj: TObj,
  path: string
): TResult | undefined {
  if (!obj || typeof obj !== "object") return undefined;

  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (typeof current !== "object") {
      return undefined;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return current as TResult;
}

/**
 * Sets a nested value in an object using dot notation (immutable)
 * @param obj - The object to set the value in
 * @param path - The path to set (e.g., "user.name")
 * @param value - The value to set
 * @returns A new object with the value set
 */
export function setNestedValue<T extends Record<string, unknown>>(
  obj: T,
  path: string,
  value: unknown
): T {
  const keys = path.split(".");
  const result = { ...obj };
  let current: Record<string, unknown> = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (key !== undefined) {
      current[key] = { ...(current[key] as Record<string, unknown>) };
      current = current[key] as Record<string, unknown>;
    }
  }

  const lastKey = keys[keys.length - 1];
  if (lastKey !== undefined) {
    current[lastKey] = value;
  }
  return result;
}
