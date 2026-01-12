/**
 * Input Sanitization Utilities
 *
 * Provides XSS protection and input sanitization for user-provided strings.
 * Use these utilities to sanitize user input before storing or displaying.
 *
 * @module security/sanitize
 */

/**
 * HTML entities that need escaping to prevent XSS
 */
const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

/**
 * Regex to match HTML special characters
 */
const HTML_ESCAPE_REGEX = /[&<>"'`=/]/g;

/**
 * Escape HTML special characters to prevent XSS attacks.
 * Use this for user input that will be rendered in HTML context.
 *
 * @example
 * ```typescript
 * escapeHtml('<script>alert("xss")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
 * ```
 */
export function escapeHtml(input: string): string {
  if (!input) return input;
  return input.replace(HTML_ESCAPE_REGEX, (char) => HTML_ESCAPE_MAP[char] || char);
}

/**
 * Strip all HTML tags from a string.
 * Use this when you want plain text only, no HTML allowed.
 *
 * @example
 * ```typescript
 * stripHtml('<p>Hello <b>World</b></p>')
 * // Returns: 'Hello World'
 * ```
 */
export function stripHtml(input: string): string {
  if (!input) return input;
  // Remove HTML tags but preserve content
  return input
    .replace(/<[^>]*>/g, "")
    // Decode common HTML entities
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#x60;/g, "`")
    .replace(/&#x3D;/g, "=");
}

/**
 * Remove potentially dangerous patterns from strings.
 * This is more aggressive than escapeHtml and removes:
 * - Script tags and event handlers
 * - JavaScript URLs
 * - Data URLs (except safe image types)
 * - CSS expressions
 *
 * @example
 * ```typescript
 * sanitizeString('Hello <script>alert(1)</script> World')
 * // Returns: 'Hello  World'
 *
 * sanitizeString('Click <a href="javascript:alert(1)">here</a>')
 * // Returns: 'Click <a href="">here</a>'
 * ```
 */
export function sanitizeString(input: string): string {
  if (!input) return input;

  let result = input;

  // Remove script tags and their content
  result = result.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Remove event handlers (onclick, onerror, onload, etc.)
  result = result.replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, "");
  result = result.replace(/\bon\w+\s*=\s*[^\s>]+/gi, "");

  // Remove javascript: URLs
  result = result.replace(/javascript\s*:/gi, "");

  // Remove vbscript: URLs
  result = result.replace(/vbscript\s*:/gi, "");

  // Remove data: URLs (except safe image types)
  result = result.replace(/data\s*:(?!image\/(?:png|jpeg|jpg|gif|webp|svg\+xml))[^;,\s]*/gi, "");

  // Remove CSS expression()
  result = result.replace(/expression\s*\([^)]*\)/gi, "");

  // Remove style attributes with potentially dangerous content
  result = result.replace(/style\s*=\s*["'][^"']*(?:expression|javascript|behavior)[^"']*["']/gi, "");

  return result;
}

/**
 * Sanitize an object's string values recursively.
 * Non-string values are left unchanged.
 *
 * @param obj - Object to sanitize
 * @param sanitizer - Sanitization function to apply (default: sanitizeString)
 * @returns New object with sanitized string values
 *
 * @example
 * ```typescript
 * sanitizeObject({
 *   name: '<script>alert(1)</script>',
 *   count: 42,
 *   nested: { value: '<b>test</b>' }
 * })
 * // Returns: { name: '', count: 42, nested: { value: '<b>test</b>' } }
 * ```
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  sanitizer: (s: string) => string = sanitizeString
): T {
  if (!obj || typeof obj !== "object") return obj;

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = sanitizer(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === "string"
          ? sanitizer(item)
          : typeof item === "object" && item !== null
            ? sanitizeObject(item as Record<string, unknown>, sanitizer)
            : item
      );
    } else if (typeof value === "object" && value !== null) {
      result[key] = sanitizeObject(value as Record<string, unknown>, sanitizer);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Trim and normalize whitespace in a string.
 * Collapses multiple spaces/newlines into single spaces.
 *
 * @example
 * ```typescript
 * normalizeWhitespace('  Hello   World  \n\n Test  ')
 * // Returns: 'Hello World Test'
 * ```
 */
export function normalizeWhitespace(input: string): string {
  if (!input) return input;
  return input.trim().replace(/\s+/g, " ");
}

/**
 * Sanitize a string for safe display/storage.
 * Combines multiple sanitization steps:
 * 1. Strip dangerous patterns
 * 2. Normalize whitespace
 *
 * This is the recommended default sanitizer for user input.
 *
 * @example
 * ```typescript
 * sanitize('  <script>alert(1)</script>  Hello   World  ')
 * // Returns: 'Hello World'
 * ```
 */
export function sanitize(input: string): string {
  if (!input) return input;
  return normalizeWhitespace(sanitizeString(input));
}

/**
 * Check if a string contains potentially dangerous content.
 * Useful for validation without modification.
 *
 * @returns true if the string contains suspicious patterns
 *
 * @example
 * ```typescript
 * hasDangerousContent('<script>alert(1)</script>')  // true
 * hasDangerousContent('Hello World')                 // false
 * hasDangerousContent('<a href="javascript:void(0)">') // true
 * ```
 */
export function hasDangerousContent(input: string): boolean {
  if (!input) return false;

  const patterns = [
    /<script/i,
    /javascript\s*:/i,
    /vbscript\s*:/i,
    /on\w+\s*=/i,
    /data\s*:(?!image\/(?:png|jpeg|jpg|gif|webp|svg\+xml))/i,
    /expression\s*\(/i,
  ];

  return patterns.some((pattern) => pattern.test(input));
}

/**
 * Zod refinement helper to reject dangerous content.
 * Use with Zod schemas to validate user input.
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { zodSafeString } from '@unisane/kernel';
 *
 * const schema = z.object({
 *   name: z.string().refine(...zodSafeString),
 * });
 * ```
 */
export const zodSafeString: [
  (val: string) => boolean,
  { message: string }
] = [
  (val: string) => !hasDangerousContent(val),
  { message: "Input contains potentially dangerous content" },
];

/**
 * Zod transform helper to sanitize strings.
 * Use with Zod schemas to automatically sanitize user input.
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { zodSanitize } from '@unisane/kernel';
 *
 * const schema = z.object({
 *   name: z.string().transform(zodSanitize),
 * });
 * ```
 */
export function zodSanitize(val: string): string {
  return sanitize(val);
}

/**
 * Zod transform helper to strip HTML and sanitize.
 * Use for fields where HTML is never allowed.
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { zodStripHtml } from '@unisane/kernel';
 *
 * const schema = z.object({
 *   plainText: z.string().transform(zodStripHtml),
 * });
 * ```
 */
export function zodStripHtml(val: string): string {
  return normalizeWhitespace(stripHtml(val));
}
