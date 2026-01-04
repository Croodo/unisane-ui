/**
 * Type Guards for DOM Elements and Common Patterns
 *
 * These type guards provide safe runtime type checking to replace
 * unsafe `as` type assertions throughout the codebase.
 *
 * @example
 * ```ts
 * // Before (unsafe)
 * const target = event.target as HTMLElement;
 * target.focus();
 *
 * // After (safe)
 * if (isHTMLElement(event.target)) {
 *   event.target.focus();
 * }
 * ```
 */

// ─── DOM ELEMENT TYPE GUARDS ─────────────────────────────────────────────────

/**
 * Check if a value is an HTMLElement
 */
export function isHTMLElement(target: EventTarget | null | undefined): target is HTMLElement {
  return target instanceof HTMLElement;
}

/**
 * Check if a value is an HTMLInputElement
 */
export function isInputElement(target: EventTarget | null | undefined): target is HTMLInputElement {
  return target instanceof HTMLInputElement;
}

/**
 * Check if a value is an HTMLTextAreaElement
 */
export function isTextAreaElement(target: EventTarget | null | undefined): target is HTMLTextAreaElement {
  return target instanceof HTMLTextAreaElement;
}

/**
 * Check if a value is an HTMLButtonElement
 */
export function isButtonElement(target: EventTarget | null | undefined): target is HTMLButtonElement {
  return target instanceof HTMLButtonElement;
}

/**
 * Check if a value is an HTMLSelectElement
 */
export function isSelectElement(target: EventTarget | null | undefined): target is HTMLSelectElement {
  return target instanceof HTMLSelectElement;
}

/**
 * Check if a value is an HTMLTableCellElement (td or th)
 */
export function isTableCellElement(target: EventTarget | null | undefined): target is HTMLTableCellElement {
  return target instanceof HTMLTableCellElement;
}

/**
 * Check if a value is an HTMLTableRowElement
 */
export function isTableRowElement(target: EventTarget | null | undefined): target is HTMLTableRowElement {
  return target instanceof HTMLTableRowElement;
}

/**
 * Check if target is an editable element (input, textarea, contenteditable)
 */
export function isEditableElement(target: EventTarget | null | undefined): boolean {
  if (!isHTMLElement(target)) return false;

  if (isInputElement(target) || isTextAreaElement(target)) {
    return true;
  }

  return target.isContentEditable;
}

/**
 * Check if target is an interactive element that should not trigger row/cell actions
 */
export function isInteractiveElement(target: EventTarget | null | undefined): boolean {
  if (!isHTMLElement(target)) return false;

  // Check if target or any ancestor is interactive
  const interactiveSelectors = [
    "button",
    "a",
    "input",
    "select",
    "textarea",
    "[role='button']",
    "[role='link']",
    "[role='checkbox']",
    "[role='menuitem']",
    "[data-interactive]",
  ];

  return interactiveSelectors.some(selector =>
    target.matches(selector) || target.closest(selector) !== null
  );
}

// ─── OBJECT TYPE GUARDS ──────────────────────────────────────────────────────

/**
 * Check if a value is a non-null object (not array)
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Check if a value is an array
 */
export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Check if a value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Check if a value is a number (not NaN)
 */
export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

/**
 * Check if a value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/**
 * Check if a value is a Date object
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Check if a value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Check if a value is null or undefined
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

// ─── ARRAY UTILITIES ─────────────────────────────────────────────────────────

/**
 * Safely get an array element with bounds checking
 * Returns undefined if index is out of bounds
 */
export function safeArrayAccess<T>(array: readonly T[], index: number): T | undefined {
  if (index < 0 || index >= array.length) {
    return undefined;
  }
  return array[index];
}

/**
 * Get first element of array safely
 */
export function first<T>(array: readonly T[]): T | undefined {
  return array[0];
}

/**
 * Get last element of array safely
 */
export function last<T>(array: readonly T[]): T | undefined {
  return array[array.length - 1];
}

// ─── EVENT UTILITIES ─────────────────────────────────────────────────────────

/**
 * Check if an event should be ignored (e.g., from interactive elements)
 * Common pattern used to prevent row clicks when clicking buttons inside rows
 */
export function shouldIgnoreEvent(event: React.MouseEvent | MouseEvent): boolean {
  const target = event.target;
  if (!isHTMLElement(target)) return false;

  return Boolean(
    target.closest("button") ||
    target.closest("input") ||
    target.closest("select") ||
    target.closest("textarea") ||
    target.closest("a") ||
    target.closest("[role='button']") ||
    target.closest("[data-ignore-row-click]")
  );
}

/**
 * Get the closest HTMLElement matching a selector, with type safety
 */
export function closestElement<K extends keyof HTMLElementTagNameMap>(
  target: EventTarget | null | undefined,
  selector: K
): HTMLElementTagNameMap[K] | null;
export function closestElement(
  target: EventTarget | null | undefined,
  selector: string
): HTMLElement | null;
export function closestElement(
  target: EventTarget | null | undefined,
  selector: string
): HTMLElement | null {
  if (!isHTMLElement(target)) return null;
  return target.closest(selector);
}

// ─── PARSE UTILITIES ─────────────────────────────────────────────────────────

/**
 * Safely parse an integer, returning undefined on failure
 */
export function safeParseInt(value: string | null | undefined, radix = 10): number | undefined {
  if (value === null || value === undefined) return undefined;
  const parsed = parseInt(value, radix);
  return isNaN(parsed) ? undefined : parsed;
}

/**
 * Safely parse a float, returning undefined on failure
 */
export function safeParseFloat(value: string | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? undefined : parsed;
}
