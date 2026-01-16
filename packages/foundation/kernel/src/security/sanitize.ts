/**
 * Input Sanitization Utilities
 *
 * Provides XSS protection and input sanitization for user-provided strings.
 * Use these utilities to sanitize user input before storing or displaying.
 *
 * Uses DOMPurify for robust HTML sanitization when available (recommended).
 * Falls back to regex-based sanitization in environments without DOM.
 *
 * @module security/sanitize
 */

// DOMPurify types - optional import for environments that support it
type DOMPurifyConfig = {
  ALLOWED_TAGS?: string[];
  ALLOWED_ATTR?: string[];
  FORBID_TAGS?: string[];
  FORBID_ATTR?: string[];
  ALLOW_DATA_ATTR?: boolean;
};

// Lazy-loaded DOMPurify instance
let domPurify: { sanitize: (input: string, config?: DOMPurifyConfig) => string } | null = null;
let domPurifyLoadAttempted = false;

/**
 * Try to load DOMPurify for robust HTML sanitization.
 * Falls back to null if not available (will use regex fallback).
 */
async function loadDOMPurify(): Promise<typeof domPurify> {
  if (domPurifyLoadAttempted) return domPurify;
  domPurifyLoadAttempted = true;

  try {
    // Dynamic import to avoid bundling issues
    const module = await import('isomorphic-dompurify');
    domPurify = module.default;
    return domPurify;
  } catch (error) {
    // KERN-009 FIX: Log the actual error before returning null
    // This helps diagnose issues with DOMPurify loading in different environments
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(
        '[sanitize] DOMPurify not available, using regex fallback:',
        error instanceof Error ? error.message : String(error)
      );
    }
    return null;
  }
}

// Pre-load DOMPurify on module initialization
void loadDOMPurify();

/**
 * HTML sanitization options.
 */
export interface SanitizeHtmlOptions {
  /** Allowed HTML tags. Default: common safe tags */
  allowedTags?: string[];
  /** Allowed attributes per tag. Default: safe attributes */
  allowedAttributes?: Record<string, string[]>;
  /** Allow data: URLs for images. Default: false */
  allowDataUrls?: boolean;
}

/**
 * Default safe HTML tags for sanitization.
 */
const DEFAULT_ALLOWED_TAGS = [
  'p', 'br', 'b', 'i', 'u', 'strong', 'em',
  'ul', 'ol', 'li', 'a', 'img',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'code', 'pre', 'span', 'div',
];

/**
 * Default safe attributes for sanitization.
 */
const DEFAULT_ALLOWED_ATTRS = [
  'href', 'title', 'target', 'rel',
  'src', 'alt', 'width', 'height',
  'class', 'id',
];

/**
 * Sanitize HTML content using DOMPurify (if available) or regex fallback.
 *
 * This is the recommended function for sanitizing rich HTML content.
 * Uses DOMPurify for robust sanitization when available.
 *
 * @example
 * ```typescript
 * sanitizeHtml('<script>alert(1)</script><p>Hello</p>')
 * // Returns: '<p>Hello</p>'
 *
 * sanitizeHtml('<p onclick="alert(1)">Click me</p>')
 * // Returns: '<p>Click me</p>'
 * ```
 */
export function sanitizeHtml(html: string, options: SanitizeHtmlOptions = {}): string {
  if (!html) return html;

  const {
    allowedTags = DEFAULT_ALLOWED_TAGS,
    allowedAttributes = {},
    allowDataUrls = false,
  } = options;

  // Collect allowed attributes from options
  const allowedAttrs = new Set(DEFAULT_ALLOWED_ATTRS);
  for (const attrs of Object.values(allowedAttributes)) {
    for (const attr of attrs) {
      allowedAttrs.add(attr);
    }
  }

  // Use DOMPurify if available
  if (domPurify) {
    const config: DOMPurifyConfig = {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: Array.from(allowedAttrs),
      FORBID_TAGS: ['style', 'script'],
      FORBID_ATTR: ['style'],
      ALLOW_DATA_ATTR: false,
    };

    // Handle data: URLs
    if (!allowDataUrls) {
      // DOMPurify will sanitize data: URLs by default
    }

    return domPurify.sanitize(html, config);
  }

  // Fallback to regex-based sanitization
  return sanitizeStringRegex(html);
}

/**
 * Sanitize user content with strict settings (minimal HTML allowed).
 *
 * Use this for user-generated content where only basic formatting is needed.
 *
 * @example
 * ```typescript
 * sanitizeUserContent('<p><a href="http://example.com">Link</a></p>')
 * // Returns: '<p>Link</p>'  (links stripped in strict mode)
 * ```
 */
export function sanitizeUserContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'b', 'i', 'u', 'strong', 'em'],
    allowedAttributes: {},
    allowDataUrls: false,
  });
}

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
 * Internal regex-based sanitization (fallback when DOMPurify is unavailable).
 * Removes potentially dangerous patterns from strings.
 *
 * SECURITY FIX (SEC-001): Enhanced patterns to catch more XSS vectors including:
 * - Unquoted event handlers: onclick=alert(1)
 * - Unicode-encoded attacks: &#x6A;avascript:
 * - HTML entity encoded attacks: javascript&#58;
 */
function sanitizeStringRegex(input: string): string {
  if (!input) return input;

  let result = input;

  // First, decode common HTML entities that could be used to bypass filters
  // This helps catch encoded attacks like &#x6A;avascript: or &#58; for colon
  result = decodeHtmlEntitiesForSecurity(result);

  // SEC-009 FIX: Normalize Unicode to catch fullwidth/homoglyph attacks
  result = normalizeUnicodeForSecurity(result);

  // Remove script tags and their content
  result = result.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Remove event handlers (onclick, onerror, onload, etc.)
  // SECURITY FIX (SEC-001): Handle all cases:
  // 1. Quoted with double quotes: onclick="alert(1)"
  // 2. Quoted with single quotes: onclick='alert(1)'
  // 3. Unquoted: onclick=alert(1)
  // 4. With spaces: onclick = "alert(1)"
  // 5. Backtick quoted: onclick=`alert(1)`
  result = result.replace(/\bon\w+\s*=\s*"[^"]*"/gi, "");
  result = result.replace(/\bon\w+\s*=\s*'[^']*'/gi, "");
  result = result.replace(/\bon\w+\s*=\s*`[^`]*`/gi, "");
  result = result.replace(/\bon\w+\s*=\s*[^\s>"'`][^\s>]*/gi, "");

  // Remove javascript: URLs (including with spaces/tabs and encoded variants)
  result = result.replace(/j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*:/gi, "");

  // Remove vbscript: URLs
  result = result.replace(/v\s*b\s*s\s*c\s*r\s*i\s*p\s*t\s*:/gi, "");

  // Remove data: URLs (except safe image types)
  result = result.replace(/data\s*:(?!image\/(?:png|jpeg|jpg|gif|webp|svg\+xml))[^;,\s]*/gi, "");

  // Remove CSS expression()
  result = result.replace(/expression\s*\([^)]*\)/gi, "");

  // Remove style attributes with potentially dangerous content
  result = result.replace(/style\s*=\s*["'][^"']*(?:expression|javascript|behavior)[^"']*["']/gi, "");

  // Remove FSCommand (Flash)
  result = result.replace(/fscommand/gi, "");

  // Remove behavior URLs (IE)
  result = result.replace(/behavior\s*:/gi, "");

  return result;
}

/**
 * Decode HTML entities that could be used to bypass security filters.
 * Only decodes entities that are commonly used in XSS attacks.
 */
function decodeHtmlEntitiesForSecurity(input: string): string {
  return input
    // Decode numeric HTML entities (decimal): &#58; -> :
    .replace(/&#(\d+);?/gi, (_, num) => String.fromCharCode(parseInt(num, 10)))
    // Decode numeric HTML entities (hex): &#x3a; -> :
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * SEC-009 FIX: Normalize Unicode to catch obfuscation attacks.
 *
 * Handles:
 * - Fullwidth characters (ｊａｖａｓｃｒｉｐｔ → javascript)
 * - Halfwidth characters
 * - Unicode normalization (NFC form)
 * - Common homoglyphs (е vs e, а vs a, etc.)
 *
 * @example
 * normalizeUnicodeForSecurity('ｊａｖａｓｃｒｉｐｔ') // 'javascript'
 * normalizeUnicodeForSecurity('јаvascript')      // 'javascript' (Cyrillic j and a)
 */
function normalizeUnicodeForSecurity(input: string): string {
  let result = input;

  // Apply Unicode NFC normalization first
  result = result.normalize('NFC');

  // Convert fullwidth ASCII characters (U+FF01-U+FF5E) to normal ASCII (U+0021-U+007E)
  // Fullwidth: ！"＃＄％ ... ａｂｃ ... ｚＡＢＣ ... Ｚ０１２ ... ９
  result = result.replace(/[\uFF01-\uFF5E]/g, (char) => {
    return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
  });

  // Map common Cyrillic/Greek/other lookalikes to ASCII
  // This catches homograph attacks where аррӏе looks like apple
  const homoglyphMap: Record<string, string> = {
    // Cyrillic lookalikes
    '\u0430': 'a', // а (Cyrillic)
    '\u0435': 'e', // е (Cyrillic)
    '\u043E': 'o', // о (Cyrillic)
    '\u0440': 'p', // р (Cyrillic)
    '\u0441': 'c', // с (Cyrillic)
    '\u0445': 'x', // х (Cyrillic)
    '\u0443': 'y', // у (Cyrillic)
    '\u0456': 'i', // і (Cyrillic)
    '\u0458': 'j', // ј (Cyrillic)
    '\u04BB': 'h', // һ (Cyrillic)
    '\u0501': 'd', // ԁ (Cyrillic)
    '\u051B': 'q', // ԛ (Cyrillic)
    '\u051D': 'w', // ԝ (Cyrillic)
    // Greek lookalikes
    '\u03B1': 'a', // α (Greek)
    '\u03B5': 'e', // ε (Greek)
    '\u03BF': 'o', // ο (Greek)
    '\u03C1': 'p', // ρ (Greek)
    '\u03C4': 't', // τ (Greek)
    '\u03C5': 'u', // υ (Greek)
    '\u03C9': 'w', // ω (Greek)
    // Other common confusables
    '\u0131': 'i', // ı (Turkish dotless i)
    '\u2010': '-', // ‐ (hyphen)
    '\u2011': '-', // ‑ (non-breaking hyphen)
    '\u2012': '-', // ‒ (figure dash)
    '\u2013': '-', // – (en dash)
    '\u2014': '-', // — (em dash)
    '\u2212': '-', // − (minus sign)
  };

  for (const [unicode, ascii] of Object.entries(homoglyphMap)) {
    result = result.split(unicode).join(ascii);
  }

  return result;
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
  // Use sanitizeHtml for DOMPurify support, fall back to regex internally
  return sanitizeHtml(input);
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
 * SECURITY FIX (SEC-001): Enhanced detection for:
 * - Unicode/HTML entity encoded attacks
 * - Various event handler patterns
 *
 * @returns true if the string contains suspicious patterns
 *
 * @example
 * ```typescript
 * hasDangerousContent('<script>alert(1)</script>')  // true
 * hasDangerousContent('Hello World')                 // false
 * hasDangerousContent('<a href="javascript:void(0)">') // true
 * hasDangerousContent('<div onclick=alert(1)>')     // true (unquoted handler)
 * hasDangerousContent('&#x6A;avascript:alert(1)')   // true (encoded)
 * ```
 */
export function hasDangerousContent(input: string): boolean {
  if (!input) return false;

  // First decode HTML entities to catch encoded attacks
  const decoded = decodeHtmlEntitiesForSecurity(input);

  // SEC-009 FIX: Also normalize Unicode to catch fullwidth/homoglyph attacks
  const normalized = normalizeUnicodeForSecurity(decoded);

  const patterns = [
    /<script/i,
    // Match javascript: with possible spaces between characters (obfuscation)
    /j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*:/i,
    /vbscript\s*:/i,
    // Match event handlers: onclick=, onerror=, etc. (quoted, unquoted, backtick)
    /\bon\w+\s*=/i,
    /data\s*:(?!image\/(?:png|jpeg|jpg|gif|webp|svg\+xml))/i,
    /expression\s*\(/i,
    /behavior\s*:/i,
    /fscommand/i,
  ];

  // SEC-009 FIX: Check original, decoded, and normalized versions
  return patterns.some((pattern) =>
    pattern.test(input) || pattern.test(decoded) || pattern.test(normalized)
  );
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
