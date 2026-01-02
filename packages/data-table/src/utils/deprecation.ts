// ─── DEPRECATION UTILITIES ───────────────────────────────────────────────────
// Utilities for handling deprecated props with backward compatibility.

/**
 * Mapping of deprecated prop names to their new names
 */
export const DEPRECATED_PROPS: Record<string, string> = {
  selectable: "rowSelectionEnabled",
  density: "rowDensity",
  columnBorders: "showColumnDividers",
};

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
 * const rowSelectionEnabled = resolveDeprecatedProp(
 *   props.rowSelectionEnabled,
 *   props.selectable,
 *   "selectable",
 *   "rowSelectionEnabled",
 *   false
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
 * Process an object of props, resolving all deprecated props at once.
 * Returns a new object with only the new prop names.
 *
 * @example
 * ```typescript
 * const resolved = resolveDeprecatedProps(props, {
 *   selectable: { newName: "rowSelectionEnabled", default: false },
 *   density: { newName: "rowDensity", default: "standard" },
 *   columnBorders: { newName: "showColumnDividers", default: undefined },
 * });
 * ```
 */
export function resolveDeprecatedProps<
  TProps extends Record<string, unknown>,
  TResolved extends Record<string, unknown>,
>(
  props: TProps,
  mappings: Record<
    string,
    { newName: string; default: unknown }
  >,
  componentName = "DataTable"
): TResolved {
  const result: Record<string, unknown> = {};

  for (const [oldName, config] of Object.entries(mappings)) {
    const newName = config.newName;
    const newValue = props[newName];
    const oldValue = props[oldName];

    result[newName] = resolveDeprecatedProp(
      newValue,
      oldValue,
      oldName,
      newName,
      config.default,
      componentName
    );
  }

  return result as TResolved;
}

/**
 * Clear the warned props set (useful for testing)
 */
export function clearDeprecationWarnings(): void {
  warnedProps.clear();
}

/**
 * Type helper to create props interface with both old and new names
 */
export type WithDeprecatedProps<
  TNew extends Record<string, unknown>,
  TDeprecated extends Record<string, unknown>,
> = TNew & Partial<TDeprecated>;
