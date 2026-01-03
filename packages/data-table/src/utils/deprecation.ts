// ─── DEPRECATION UTILITIES ───────────────────────────────────────────────────
// Utilities for handling deprecated props with backward compatibility.
// Add future deprecations here as needed.

/**
 * Set of props that have been warned about in this session
 * (to avoid spamming console with repeated warnings)
 */
const warnedProps = new Set<string>();

/**
 * Log a deprecation warning for a prop (only once per session)
 */
export function warnDeprecatedProp(
  oldName: string,
  newName: string,
  componentName = "DataTable"
): void {
  if (process.env.NODE_ENV === "production") return;

  const key = `${componentName}.${oldName}`;
  if (warnedProps.has(key)) return;

  warnedProps.add(key);
  console.warn(
    `[${componentName}] The "${oldName}" prop is deprecated and will be removed in a future version. ` +
      `Please use "${newName}" instead.`
  );
}

/**
 * Resolve a deprecated prop value, preferring the new name if both are provided.
 * Logs a deprecation warning if the old name is used.
 *
 * @example
 * ```typescript
 * const newValue = resolveDeprecatedProp(
 *   props.newPropName,
 *   props.oldPropName,
 *   "oldPropName",
 *   "newPropName",
 *   defaultValue
 * );
 * ```
 */
export function resolveDeprecatedProp<T>(
  newValue: T | undefined,
  oldValue: T | undefined,
  oldName: string,
  newName: string,
  defaultValue: T,
  componentName = "DataTable"
): T {
  // If new name is provided, use it
  if (newValue !== undefined) {
    return newValue;
  }

  // If old name is provided, use it with a warning
  if (oldValue !== undefined) {
    warnDeprecatedProp(oldName, newName, componentName);
    return oldValue;
  }

  // Return default
  return defaultValue;
}

/**
 * Clear the warned props set (useful for testing)
 */
export function clearDeprecationWarnings(): void {
  warnedProps.clear();
}
