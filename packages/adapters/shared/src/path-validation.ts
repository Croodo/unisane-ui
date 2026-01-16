/**
 * Path/Key Validation Utilities
 *
 * Shared storage key validation logic used by storage adapters (S3, GCS, Local).
 * Prevents path traversal attacks and ensures consistent key handling.
 *
 * H-002 FIX: Extracted from storage-s3, storage-gcs, and storage-local adapters.
 */

/**
 * Path traversal patterns to detect and reject.
 * These patterns are checked both before and after URL decoding.
 */
export const TRAVERSAL_PATTERNS: RegExp[] = [
  /\.\.\//g,      // ../
  /\.\.\\/g,      // ..\
  /^\.\.$/,       // just ..
  /\0/,           // null bytes (can truncate paths in some systems)
];

/**
 * Additional patterns for cloud storage (S3, GCS) that reject absolute paths.
 * Local storage has different rules since it maps to filesystem.
 */
export const CLOUD_TRAVERSAL_PATTERNS: RegExp[] = [
  ...TRAVERSAL_PATTERNS,
  /^\/|^\\/,      // absolute paths starting with / or \
];

/**
 * Options for storage key validation.
 */
export interface KeyValidationOptions {
  /** Whether to reject absolute paths (default: true for cloud, false for local) */
  rejectAbsolutePaths?: boolean;
  /** Custom error message prefix */
  errorPrefix?: string;
}

/**
 * Validate and normalize a storage key to prevent path traversal attacks.
 * Rejects keys containing path traversal sequences.
 *
 * @param key - Storage key to validate
 * @param options - Validation options
 * @returns Normalized key (URL decoded, slashes normalized)
 * @throws Error if key is invalid or contains traversal patterns
 */
export function validateAndNormalizeStorageKey(
  key: string,
  options: KeyValidationOptions = {}
): string {
  const {
    rejectAbsolutePaths = true,
    errorPrefix = 'Storage key validation failed',
  } = options;

  // Reject empty keys
  if (!key || key.trim() === '') {
    throw new Error(`${errorPrefix}: key cannot be empty`);
  }

  // Decode any URL-encoded characters to check for traversal
  let decoded: string;
  try {
    decoded = decodeURIComponent(key);
  } catch {
    // If decoding fails, use original (might have invalid encoding)
    decoded = key;
  }

  // Select patterns based on options
  const patterns = rejectAbsolutePaths ? CLOUD_TRAVERSAL_PATTERNS : TRAVERSAL_PATTERNS;

  // Check for path traversal patterns (before and after decoding)
  for (const pattern of patterns) {
    if (pattern.test(key) || pattern.test(decoded)) {
      throw new Error(`${errorPrefix}: path traversal detected`);
    }
  }

  // Normalize multiple slashes and trim leading/trailing slashes
  return decoded.replace(/\/+/g, '/').replace(/^\/|\/$/g, '');
}

/**
 * Validate a storage key for cloud providers (S3, GCS).
 * Rejects absolute paths in addition to traversal patterns.
 *
 * @param key - Storage key to validate
 * @returns Normalized key
 * @throws Error if key is invalid
 */
export function validateCloudStorageKey(key: string): string {
  return validateAndNormalizeStorageKey(key, {
    rejectAbsolutePaths: true,
    errorPrefix: 'Path traversal detected in storage key',
  });
}

/**
 * Validate a storage key for local filesystem storage.
 * Uses path resolution to ensure the key stays within the base directory.
 *
 * @param key - Storage key to validate
 * @param basePath - Base directory path
 * @param pathModule - Node.js path module (passed to avoid import issues)
 * @returns Resolved absolute path
 * @throws Error if key is invalid or escapes base directory
 */
export function validateLocalStorageKey(
  key: string,
  basePath: string,
  pathModule: { resolve: (base: string, ...paths: string[]) => string; sep: string }
): string {
  // Reject empty keys
  if (!key || key.trim() === '') {
    throw new Error('Storage key cannot be empty');
  }

  // Decode URL-encoded characters to catch encoded traversal attempts
  let decoded: string;
  try {
    decoded = decodeURIComponent(key);
  } catch {
    decoded = key;
  }

  // Check for obvious traversal patterns before path resolution
  for (const pattern of TRAVERSAL_PATTERNS) {
    if (pattern.test(key) || pattern.test(decoded)) {
      throw new Error('Path traversal detected in storage key');
    }
  }

  // Resolve the full path and verify it's within basePath
  // Use path.resolve to handle any remaining edge cases
  const resolvedBase = pathModule.resolve(basePath);
  const resolvedPath = pathModule.resolve(basePath, decoded);

  // Critical: Ensure the resolved path starts with basePath
  // Adding path.sep ensures we don't match partial directory names
  // e.g., basePath="/data" should not allow "/data-other/file"
  if (!resolvedPath.startsWith(resolvedBase + pathModule.sep) && resolvedPath !== resolvedBase) {
    throw new Error('Path traversal detected: resolved path escapes base directory');
  }

  return resolvedPath;
}

/**
 * Validate a continuation token for pagination.
 * Checks for path traversal in decoded cursor values.
 *
 * @param token - Base64url encoded continuation token
 * @returns Decoded token string or null if invalid
 */
export function validateContinuationToken(token: string | undefined): string | null {
  if (!token) return null;

  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');

    // Check for path traversal patterns
    if (decoded.includes('..') || decoded.startsWith('/')) {
      console.warn('[storage] Invalid continuation token: path traversal detected');
      return null;
    }

    return decoded;
  } catch {
    console.warn('[storage] Invalid continuation token: decode failed');
    return null;
  }
}

/**
 * Encode a key as a continuation token for pagination.
 *
 * @param key - Storage key to encode
 * @returns Base64url encoded token
 */
export function encodeContinuationToken(key: string): string {
  return Buffer.from(key, 'utf8').toString('base64url');
}
