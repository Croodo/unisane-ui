/**
 * Path/Key Validation Utilities
 *
 * Storage key validation logic for storage adapters (S3, GCS, Local).
 * Prevents path traversal attacks and ensures consistent key handling.
 */

const TRAVERSAL_PATTERNS: RegExp[] = [
  /\.\.\//g,
  /\.\.\\/g,
  /^\.\.$/,
  /\0/,
];

const CLOUD_TRAVERSAL_PATTERNS: RegExp[] = [
  ...TRAVERSAL_PATTERNS,
  /^\/|^\\/,
];

export interface KeyValidationOptions {
  rejectAbsolutePaths?: boolean;
  errorPrefix?: string;
}

export function validateAndNormalizeStorageKey(
  key: string,
  options: KeyValidationOptions = {}
): string {
  const {
    rejectAbsolutePaths = true,
    errorPrefix = 'Storage key validation failed',
  } = options;

  if (!key || key.trim() === '') {
    throw new Error(`${errorPrefix}: key cannot be empty`);
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(key);
  } catch {
    decoded = key;
  }

  const patterns = rejectAbsolutePaths ? CLOUD_TRAVERSAL_PATTERNS : TRAVERSAL_PATTERNS;

  for (const pattern of patterns) {
    if (pattern.test(key) || pattern.test(decoded)) {
      throw new Error(`${errorPrefix}: path traversal detected`);
    }
  }

  return decoded.replace(/\/+/g, '/').replace(/^\/|\/$/g, '');
}

export function validateCloudStorageKey(key: string): string {
  return validateAndNormalizeStorageKey(key, {
    rejectAbsolutePaths: true,
    errorPrefix: 'Path traversal detected in storage key',
  });
}

export function validateLocalStorageKey(
  key: string,
  basePath: string,
  pathModule: { resolve: (base: string, ...paths: string[]) => string; sep: string }
): string {
  if (!key || key.trim() === '') {
    throw new Error('Storage key cannot be empty');
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(key);
  } catch {
    decoded = key;
  }

  for (const pattern of TRAVERSAL_PATTERNS) {
    if (pattern.test(key) || pattern.test(decoded)) {
      throw new Error('Path traversal detected in storage key');
    }
  }

  const resolvedBase = pathModule.resolve(basePath);
  const resolvedPath = pathModule.resolve(basePath, decoded);

  if (!resolvedPath.startsWith(resolvedBase + pathModule.sep) && resolvedPath !== resolvedBase) {
    throw new Error('Path traversal detected: resolved path escapes base directory');
  }

  return resolvedPath;
}

export function validateContinuationToken(token: string | undefined): string | null {
  if (!token) return null;

  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    if (decoded.includes('..') || decoded.startsWith('/')) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function encodeContinuationToken(key: string): string {
  return Buffer.from(key, 'utf8').toString('base64url');
}
