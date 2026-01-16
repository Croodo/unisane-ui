/**
 * Cryptographic utilities for webhook signature generation and verification.
 *
 * Provides timing-safe comparison to prevent timing attacks.
 */

import crypto from 'node:crypto';

/**
 * Generate HMAC-SHA256 signature as hex string
 */
export function hmacSHA256Hex(secret: string, payload: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Timing-safe string comparison to prevent timing attacks.
 * Returns false if strings have different lengths (early exit is safe for length).
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}
