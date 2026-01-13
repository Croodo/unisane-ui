/**
 * Secret Redaction Utilities
 *
 * Provides utilities to redact sensitive data from logs, error messages, and
 * other outputs to prevent accidental secret leakage.
 *
 * Usage:
 * ```typescript
 * import { redact, redactObject } from '@unisane/kernel';
 *
 * logger.info('User authenticated', redactObject({ token, user }));
 * logger.debug(redact.email('user@example.com')); // => 'u***@example.com'
 * ```
 */

/**
 * Patterns that match common secret formats
 */
const SECRET_PATTERNS = [
  // API Keys and tokens
  { pattern: /sk_live_[a-zA-Z0-9]{24,}/gi, name: "stripe_secret_key" },
  { pattern: /sk_test_[a-zA-Z0-9]{24,}/gi, name: "stripe_test_key" },
  { pattern: /pk_live_[a-zA-Z0-9]{24,}/gi, name: "stripe_publishable_key" },
  { pattern: /pk_test_[a-zA-Z0-9]{24,}/gi, name: "stripe_test_publishable" },
  { pattern: /Bearer\s+[a-zA-Z0-9_\-\.]+/gi, name: "bearer_token" },

  // AWS
  { pattern: /AKIA[0-9A-Z]{16}/g, name: "aws_access_key" },
  { pattern: /aws_secret_access_key["\s:=]+([a-zA-Z0-9\/+]{40})/gi, name: "aws_secret" },

  // Generic patterns
  { pattern: /api[_-]?key["\s:=]+([a-zA-Z0-9_\-]{20,})/gi, name: "api_key" },
  { pattern: /secret["\s:=]+([a-zA-Z0-9_\-]{20,})/gi, name: "secret" },
  { pattern: /token["\s:=]+([a-zA-Z0-9_\-\.]{20,})/gi, name: "token" },
  { pattern: /password["\s:=]+"([^"]+)"/gi, name: "password" },

  // JWT tokens
  { pattern: /eyJ[a-zA-Z0-9_\-]+\.eyJ[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+/gi, name: "jwt" },

  // Database URLs
  { pattern: /mongodb(\+srv)?:\/\/[^:]+:([^@]+)@/gi, name: "mongodb_password" },
  { pattern: /postgres:\/\/[^:]+:([^@]+)@/gi, name: "postgres_password" },
  { pattern: /mysql:\/\/[^:]+:([^@]+)@/gi, name: "mysql_password" },

  // Private keys
  { pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----[\s\S]*?-----END (RSA |EC )?PRIVATE KEY-----/gi, name: "private_key" },
];

/**
 * Field names that commonly contain sensitive data
 */
const SENSITIVE_FIELD_NAMES = new Set([
  "password",
  "passwd",
  "pwd",
  "secret",
  "token",
  "apiKey",
  "api_key",
  "apikey",
  "accessToken",
  "access_token",
  "refreshToken",
  "refresh_token",
  "privateKey",
  "private_key",
  "clientSecret",
  "client_secret",
  "authToken",
  "auth_token",
  "sessionToken",
  "session_token",
  "bearerToken",
  "bearer_token",
  "credential",
  "credentials",
  "passphrase",
  "encryptionKey",
  "encryption_key",
  "signingKey",
  "signing_key",
  "masterKey",
  "master_key",
]);

/**
 * Redact a string by replacing sensitive patterns with [REDACTED]
 */
export function redactString(input: string): string {
  let result = input;

  for (const { pattern, name } of SECRET_PATTERNS) {
    result = result.replace(pattern, `[REDACTED:${name}]`);
  }

  return result;
}

/**
 * Redact sensitive fields in an object (deep traversal)
 * Returns a new object with sensitive fields replaced with [REDACTED]
 */
export function redactObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactObject(item)) as unknown as T;
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const keyLower = key.toLowerCase();

    // Check if field name is sensitive
    if (SENSITIVE_FIELD_NAMES.has(keyLower) || SENSITIVE_FIELD_NAMES.has(key)) {
      result[key] = "[REDACTED]";
      continue;
    }

    // Recursively redact nested objects
    if (value && typeof value === "object") {
      result[key] = redactObject(value);
    } else if (typeof value === "string") {
      // Check string values for secret patterns
      result[key] = redactString(value);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Specific redaction utilities for common data types
 */
export const redact = {
  /**
   * Redact email address (show first letter and domain)
   * Example: user@example.com => u***@example.com
   */
  email(email: string): string {
    if (!email || typeof email !== "string") return "[INVALID_EMAIL]";
    const [local, domain] = email.split("@");
    if (!local || !domain) return "[INVALID_EMAIL]";
    return `${local[0]}***@${domain}`;
  },

  /**
   * Redact phone number (show last 4 digits)
   * Example: +1234567890 => *******7890
   */
  phone(phone: string): string {
    if (!phone || typeof phone !== "string") return "[INVALID_PHONE]";
    if (phone.length <= 4) return "****";
    return "*".repeat(phone.length - 4) + phone.slice(-4);
  },

  /**
   * Redact API key (show prefix and last 4 characters)
   * Example: sk_live_abc123def456 => sk_live_***456
   */
  apiKey(key: string): string {
    if (!key || typeof key !== "string") return "[INVALID_KEY]";
    if (key.length <= 12) return "[REDACTED]";

    // Detect prefix (e.g., sk_live_, pk_test_)
    const match = key.match(/^([a-z]{2}_[a-z]+_)/i);
    const prefix = match ? match[1] : "";
    const suffix = key.slice(-4);

    return prefix ? `${prefix}***${suffix}` : `***${suffix}`;
  },

  /**
   * Redact credit card number (show last 4 digits)
   * Example: 4532123456789012 => ************9012
   */
  creditCard(cc: string): string {
    if (!cc || typeof cc !== "string") return "[INVALID_CC]";
    const digits = cc.replace(/\D/g, "");
    if (digits.length < 4) return "[INVALID_CC]";
    return "*".repeat(digits.length - 4) + digits.slice(-4);
  },

  /**
   * Redact JWT token (show header only)
   * Example: eyJhbGc...payload...signature => eyJhbGc...[REDACTED]
   */
  jwt(token: string): string {
    if (!token || typeof token !== "string") return "[INVALID_JWT]";
    const parts = token.split(".");
    if (parts.length !== 3) return "[INVALID_JWT]";
    return `${parts[0]}.[REDACTED].[REDACTED]`;
  },

  /**
   * Generic secret redaction (show first 4 and last 4 characters)
   * Example: supersecretkey123 => supe********y123
   */
  secret(secret: string): string {
    if (!secret || typeof secret !== "string") return "[REDACTED]";
    if (secret.length <= 8) return "[REDACTED]";
    return `${secret.slice(0, 4)}${"*".repeat(Math.max(4, secret.length - 8))}${secret.slice(-4)}`;
  },

  /**
   * Redact password (always return [REDACTED])
   */
  password(_password: string): string {
    return "[REDACTED]";
  },

  /**
   * Redact MongoDB connection string (hide credentials)
   * Example: mongodb://user:pass@host:27017/db => mongodb://***:***@host:27017/db
   */
  mongoUri(uri: string): string {
    if (!uri || typeof uri !== "string") return "[INVALID_URI]";
    return uri.replace(/(mongodb(\+srv)?:\/\/)([^:]+):([^@]+)@/, "$1***:***@");
  },

  /**
   * Redact generic database URL (hide credentials)
   */
  databaseUrl(url: string): string {
    if (!url || typeof url !== "string") return "[INVALID_URL]";
    return url.replace(/:\/\/([^:]+):([^@]+)@/, "://***:***@");
  },
};

/**
 * Check if a value looks like a secret (heuristic)
 * Useful for automatically detecting secrets before logging
 */
export function looksLikeSecret(value: unknown): boolean {
  if (typeof value !== "string") return false;
  if (value.length < 16) return false; // Secrets are usually longer

  // Check against known patterns
  for (const { pattern } of SECRET_PATTERNS) {
    if (pattern.test(value)) return true;
  }

  // Check entropy (high randomness suggests secret)
  const uniqueChars = new Set(value).size;
  const entropy = uniqueChars / value.length;
  if (entropy > 0.6 && value.length > 20) return true;

  return false;
}

/**
 * Sanitize error for logging (remove stack traces in production, redact secrets)
 */
export function sanitizeError(error: unknown): Record<string, unknown> {
  if (!error || typeof error !== "object") {
    return { error: String(error) };
  }

  const err = error as {
    name?: unknown;
    message?: unknown;
    code?: unknown;
    stack?: unknown;
  };

  const result: Record<string, unknown> = {
    name: typeof err.name === "string" ? err.name : "Error",
    message: typeof err.message === "string" ? redactString(err.message) : undefined,
    code: typeof err.code === "string" || typeof err.code === "number" ? err.code : undefined,
  };

  // Only include stack in development
  if (process.env.NODE_ENV === "development" && typeof err.stack === "string") {
    result.stack = err.stack;
  }

  return result;
}
