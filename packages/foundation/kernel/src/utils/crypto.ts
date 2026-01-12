import crypto from "node:crypto";

export function sha256Hex(input: string | Buffer | Uint8Array): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

/**
 * Generate a random numeric code (e.g., for OTP).
 * Uses crypto.randomInt for secure randomness.
 * @param length Number of digits (default 6)
 * @returns String of random digits
 */
export function randomDigits(length = 6): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += crypto.randomInt(0, 10).toString();
  }
  return result;
}

/**
 * Generate a cryptographically secure random token.
 * @param bytes Number of random bytes (default 32)
 * @returns Base64url-encoded token
 */
export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

export async function scryptHashPassword(
  password: string
): Promise<{ algo: "scrypt"; saltB64: string; hashB64: string }> {
  const salt = crypto.randomBytes(16);
  const N = 16384,
    r = 8,
    p = 1;
  const keylen = 64;
  const hash = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, { N, r, p }, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey as Buffer);
    });
  });
  return {
    algo: "scrypt",
    saltB64: salt.toString("base64"),
    hashB64: hash.toString("base64"),
  };
}

export async function scryptVerifyPassword(
  password: string,
  saltB64: string,
  hashB64: string
): Promise<boolean> {
  const salt = Buffer.from(saltB64, "base64");
  const keylen = Buffer.from(hashB64, "base64").length;
  const N = 16384,
    r = 8,
    p = 1;
  const computed = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, { N, r, p }, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey as Buffer);
    });
  });
  const expected = Buffer.from(hashB64, "base64");
  return crypto.timingSafeEqual(computed, expected);
}

// ============================================================================
// AES-256-GCM Field Encryption
// ============================================================================

/**
 * AES-256-GCM encryption for field-level data protection.
 *
 * Features:
 * - 256-bit key (32 bytes)
 * - 96-bit IV (12 bytes, randomly generated per encryption)
 * - 128-bit authentication tag
 * - Output format: base64url(iv || tag || ciphertext)
 *
 * @example
 * ```typescript
 * const key = getDataEncryptionKey(); // 32 bytes from env
 * const encrypted = encryptField('sensitive@email.com', key);
 * const decrypted = decryptField(encrypted, key);
 * ```
 */

const AES_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for GCM
const TAG_LENGTH = 16; // 128 bits

/**
 * Encrypt a plaintext string using AES-256-GCM.
 *
 * @param plaintext - The string to encrypt
 * @param key - 32-byte encryption key (from DATA_ENCRYPTION_KEY)
 * @returns Base64url-encoded ciphertext (iv + tag + encrypted data)
 * @throws Error if key is invalid length
 */
export function encryptField(plaintext: string, key: Buffer): string {
  if (key.length !== 32) {
    throw new Error('Encryption key must be exactly 32 bytes (256 bits)');
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(AES_ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  // Format: iv (12) + tag (16) + ciphertext
  const combined = Buffer.concat([iv, tag, encrypted]);
  return combined.toString('base64url');
}

/**
 * Decrypt a ciphertext string using AES-256-GCM.
 *
 * @param ciphertext - Base64url-encoded ciphertext from encryptField
 * @param key - 32-byte encryption key (same key used for encryption)
 * @returns Decrypted plaintext string
 * @throws Error if decryption fails (wrong key, tampered data, etc.)
 */
export function decryptField(ciphertext: string, key: Buffer): string {
  if (key.length !== 32) {
    throw new Error('Encryption key must be exactly 32 bytes (256 bits)');
  }

  const combined = Buffer.from(ciphertext, 'base64url');

  if (combined.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error('Invalid ciphertext: too short');
  }

  const iv = combined.subarray(0, IV_LENGTH);
  const tag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = crypto.createDecipheriv(AES_ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Create a deterministic search token for encrypted fields.
 * Uses HMAC-SHA256 to create a consistent hash that can be indexed for lookups.
 *
 * IMPORTANT: Search tokens allow equality lookups but leak information about
 * whether two encrypted values are the same. Use only when search is required.
 *
 * @param plaintext - The value to create a search token for
 * @param key - 32-byte key (can be same as encryption key or separate)
 * @returns Hex-encoded search token
 *
 * @example
 * ```typescript
 * // Storing a searchable encrypted email
 * const doc = {
 *   emailEncrypted: encryptField(email, key),
 *   emailSearchToken: createSearchToken(normalizeEmail(email), key),
 * };
 *
 * // Looking up by email
 * const token = createSearchToken(normalizeEmail(searchEmail), key);
 * const user = await users.findOne({ emailSearchToken: token });
 * ```
 */
export function createSearchToken(plaintext: string, key: Buffer): string {
  return crypto.createHmac('sha256', key).update(plaintext).digest('hex');
}

// For normalization, use normalizeEmail and normalizePhoneE164 from './normalize'

/**
 * Generate a new 32-byte encryption key.
 * Use this to generate DATA_ENCRYPTION_KEY for your environment.
 *
 * @returns Base64-encoded 32-byte key
 *
 * @example
 * ```bash
 * # Generate a new key
 * node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 * ```
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Parse a base64-encoded encryption key from environment variable.
 *
 * @param keyBase64 - Base64-encoded 32-byte key
 * @returns Buffer containing the key
 * @throws Error if key is invalid
 */
export function parseEncryptionKey(keyBase64: string): Buffer {
  const key = Buffer.from(keyBase64, 'base64');
  if (key.length !== 32) {
    throw new Error(
      `Invalid DATA_ENCRYPTION_KEY: expected 32 bytes, got ${key.length}. ` +
      `Generate a new key with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
    );
  }
  return key;
}
