import { decodeBase64UrlJson, encodeBase64UrlJson } from "../encoding/base64urlJson";

export type CursorPayload = { id: string };

/**
 * KERN-019 FIX: Cursor validation constraints.
 *
 * - MAX_CURSOR_LENGTH: Prevents DoS via oversized cursors
 * - CURSOR_EXPIRATION_MS: Optional expiration for cursor validity (24 hours)
 * - ID_MAX_LENGTH: Maximum ID length to prevent abuse
 */
const MAX_CURSOR_LENGTH = 1024; // 1KB max cursor size
const CURSOR_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const ID_MAX_LENGTH = 256; // Max ID length

/**
 * KERN-019 FIX: Extended cursor payload with optional expiration.
 */
export type CursorPayloadWithExpiry = {
  id: string;
  /** Optional expiration timestamp (Unix ms) */
  exp?: number;
};

export function encodeCursor(p: CursorPayload): string {
  return encodeBase64UrlJson(p);
}

/**
 * KERN-019 FIX: Encode cursor with expiration timestamp.
 * Use this for cursors that should expire after a certain time.
 *
 * @param p - Cursor payload
 * @param expiresInMs - Expiration time in milliseconds (default: 24 hours)
 */
export function encodeCursorWithExpiry(
  p: CursorPayload,
  expiresInMs: number = CURSOR_EXPIRATION_MS
): string {
  const withExpiry: CursorPayloadWithExpiry = {
    ...p,
    exp: Date.now() + expiresInMs,
  };
  return encodeBase64UrlJson(withExpiry);
}

/**
 * KERN-019 FIX: Validate cursor format and content.
 *
 * Validates:
 * - Cursor length (max 1KB to prevent DoS)
 * - ID format (non-empty, max 256 chars)
 * - Optional: Expiration timestamp
 *
 * @param s - Cursor string
 * @param options - Validation options
 */
export function decodeCursor(
  s: string | null | undefined,
  options?: { checkExpiry?: boolean }
): CursorPayload | null {
  if (!s) return null;

  // KERN-019 FIX: Reject oversized cursors to prevent DoS
  if (s.length > MAX_CURSOR_LENGTH) {
    return null;
  }

  try {
    const val = decodeBase64UrlJson(s) as CursorPayloadWithExpiry | null;

    // Validate ID exists and has valid format
    if (typeof val?.id !== "string" || val.id.length === 0) {
      return null;
    }

    // KERN-019 FIX: Reject IDs that are too long
    if (val.id.length > ID_MAX_LENGTH) {
      return null;
    }

    // KERN-019 FIX: Check expiration if requested
    if (options?.checkExpiry && typeof val.exp === 'number') {
      if (Date.now() > val.exp) {
        return null; // Cursor expired
      }
    }

    return { id: val.id };
  } catch {
    return null;
  }
}

/**
 * KERN-019 FIX: Validate cursor without decoding (for quick rejection).
 *
 * Useful for checking cursor format before database operations.
 */
export function isValidCursorFormat(s: string | null | undefined): boolean {
  if (!s) return false;
  if (s.length > MAX_CURSOR_LENGTH) return false;

  // Check for valid base64url characters only
  // Base64url uses A-Z, a-z, 0-9, -, _ (no padding = allowed)
  const base64UrlRegex = /^[A-Za-z0-9_-]+$/;
  return base64UrlRegex.test(s);
}
