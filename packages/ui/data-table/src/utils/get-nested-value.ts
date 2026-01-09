/**
 * Options for getNestedValue
 */
export interface GetNestedValueOptions<TDefault = undefined> {
  /** Default value to return if path not found or value is undefined */
  defaultValue?: TDefault;
  /** If true, logs a warning when path is not found (development only) */
  warnOnMissing?: boolean;
  /** Custom path separator (default: ".") */
  separator?: string;
}

/**
 * Gets a nested value from an object using dot notation
 *
 * @param obj - The object to get the value from
 * @param path - The path to the value (e.g., "user.name" or "items.0.id")
 * @param options - Optional configuration
 * @returns The value at the path, or defaultValue/undefined if not found
 *
 * @example
 * ```ts
 * const user = { profile: { name: "John" } };
 * getNestedValue(user, "profile.name"); // "John"
 * getNestedValue(user, "profile.age", { defaultValue: 0 }); // 0
 * getNestedValue(user, "invalid.path"); // undefined
 * ```
 */
export function getNestedValue<TResult = unknown, TObj extends object = Record<string, unknown>, TDefault = undefined>(
  obj: TObj,
  path: string,
  options?: GetNestedValueOptions<TDefault>
): TResult | TDefault | undefined {
  const { defaultValue, warnOnMissing = false, separator = "." } = options ?? {};

  // Handle null/undefined input gracefully
  if (obj === null || obj === undefined) {
    if (warnOnMissing && process.env.NODE_ENV !== "production") {
      console.warn(`getNestedValue: Cannot read path "${path}" from null/undefined object`);
    }
    return defaultValue;
  }

  if (typeof obj !== "object") {
    if (warnOnMissing && process.env.NODE_ENV !== "production") {
      console.warn(`getNestedValue: Expected object but got ${typeof obj} for path "${path}"`);
    }
    return defaultValue;
  }

  // Handle empty path
  if (!path || path.length === 0) {
    return defaultValue;
  }

  const keys = path.split(separator);
  let current: unknown = obj;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    if (current === null || current === undefined) {
      if (warnOnMissing && process.env.NODE_ENV !== "production") {
        const traversedPath = keys.slice(0, i).join(separator);
        console.warn(
          `getNestedValue: Path "${path}" failed at "${traversedPath}" - value is ${current}`
        );
      }
      return defaultValue;
    }

    if (typeof current !== "object") {
      if (warnOnMissing && process.env.NODE_ENV !== "production") {
        const traversedPath = keys.slice(0, i).join(separator);
        console.warn(
          `getNestedValue: Path "${path}" failed at "${traversedPath}" - expected object but got ${typeof current}`
        );
      }
      return defaultValue;
    }

    current = (current as Record<string, unknown>)[key!];
  }

  // Return defaultValue if the final value is undefined
  if (current === undefined) {
    return defaultValue;
  }

  return current as TResult;
}

/**
 * Type-safe version of getNestedValue for known paths.
 * Useful when you know the exact structure of the object.
 */
export function getNestedValueSafe<T extends object, K extends keyof T>(
  obj: T,
  key: K
): T[K] {
  return obj[key];
}

/**
 * Sets a nested value in an object using dot notation (immutable)
 *
 * Performance characteristics:
 * - Time: O(depth) where depth is the number of path segments
 * - Space: O(depth) - only creates new objects along the path (structural sharing)
 * - For shallow paths (depth 1-2), this is highly efficient
 * - For very deep nesting (5+), consider flattening your data structure
 *
 * @param obj - The object to set the value in
 * @param path - The path to set (e.g., "user.name")
 * @param value - The value to set
 * @returns A new object with the value set
 *
 * @example
 * ```ts
 * // Shallow path (fast)
 * setNestedValue({ name: "John" }, "name", "Jane");
 * // => { name: "Jane" }
 *
 * // Nested path (still efficient)
 * setNestedValue({ user: { name: "John" } }, "user.name", "Jane");
 * // => { user: { name: "Jane" } }
 * ```
 */
export function setNestedValue<T extends Record<string, unknown>>(
  obj: T,
  path: string,
  value: unknown
): T {
  // Fast path: single-level key (no nesting)
  if (!path.includes(".")) {
    return { ...obj, [path]: value };
  }

  const keys = path.split(".");
  const result = { ...obj };
  let current: Record<string, unknown> = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (key !== undefined) {
      const existing = current[key];
      // Only spread if it's an object, otherwise create empty object
      current[key] = typeof existing === "object" && existing !== null
        ? { ...(existing as Record<string, unknown>) }
        : {};
      current = current[key] as Record<string, unknown>;
    }
  }

  const lastKey = keys[keys.length - 1];
  if (lastKey !== undefined) {
    current[lastKey] = value;
  }
  return result;
}
