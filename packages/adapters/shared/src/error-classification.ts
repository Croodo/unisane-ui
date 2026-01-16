/**
 * Error Classification Utilities
 *
 * Shared error handling logic used across adapters.
 * Helps determine which errors are retryable vs permanent.
 *
 * M-005 FIX: Provides consistent error classification for retry logic.
 */

/**
 * HTTP status codes that indicate transient errors worth retrying.
 */
export const RETRYABLE_STATUS_CODES = new Set([
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
]);

/**
 * Error codes/messages that indicate transient network errors.
 */
export const RETRYABLE_ERROR_PATTERNS = [
  /timeout/i,
  /ECONNREFUSED/i,
  /ENOTFOUND/i,
  /ECONNRESET/i,
  /ETIMEDOUT/i,
  /EPIPE/i,
  /ENETUNREACH/i,
  /EAI_AGAIN/i,
  /socket hang up/i,
  /network/i,
];

/**
 * Error codes/messages that indicate permanent errors (should not retry).
 */
export const PERMANENT_ERROR_PATTERNS = [
  /invalid.*key/i,
  /unauthorized/i,
  /forbidden/i,
  /not.*found/i,
  /bad.*request/i,
  /invalid.*parameter/i,
  /authentication/i,
  /permission/i,
];

/**
 * Check if an error is retryable based on its properties.
 *
 * @param error - Error to check
 * @returns true if the error is likely transient and worth retrying
 */
export function isRetryableError(error: unknown): boolean {
  if (!error) return false;

  // Check for AbortError (timeout)
  if (error instanceof Error) {
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return true;
    }

    // Check error message against retryable patterns
    const message = error.message || '';
    for (const pattern of RETRYABLE_ERROR_PATTERNS) {
      if (pattern.test(message)) {
        return true;
      }
    }

    // Check for permanent error patterns
    for (const pattern of PERMANENT_ERROR_PATTERNS) {
      if (pattern.test(message)) {
        return false;
      }
    }
  }

  // Check for HTTP status codes
  const statusCode = (error as { status?: number; statusCode?: number }).status
    ?? (error as { status?: number; statusCode?: number }).statusCode;

  if (statusCode && RETRYABLE_STATUS_CODES.has(statusCode)) {
    return true;
  }

  // Check for Node.js error codes
  const code = (error as { code?: string }).code;
  if (code) {
    for (const pattern of RETRYABLE_ERROR_PATTERNS) {
      if (pattern.test(code)) {
        return true;
      }
    }
  }

  // Default to not retrying unknown errors
  return false;
}

/**
 * Extract a user-friendly error message from an error object.
 *
 * @param error - Error to extract message from
 * @param defaultMessage - Default message if extraction fails
 * @returns Error message string
 */
export function extractErrorMessage(error: unknown, defaultMessage = 'Unknown error'): string {
  if (!error) return defaultMessage;

  if (error instanceof Error) {
    return error.message || defaultMessage;
  }

  if (typeof error === 'string') {
    return error;
  }

  // Try to extract message from error-like objects
  const maybeError = error as { message?: string; error?: { message?: string } };
  if (maybeError.message) {
    return maybeError.message;
  }
  if (maybeError.error?.message) {
    return maybeError.error.message;
  }

  // Last resort: stringify
  try {
    return JSON.stringify(error);
  } catch {
    return defaultMessage;
  }
}

/**
 * Format an error message with adapter context.
 * Provides consistent error message format across all adapters.
 *
 * L-001 FIX: Standardizes error message format.
 *
 * @param adapterName - Name of the adapter (e.g., 'stripe', 's3')
 * @param operation - Operation that failed (e.g., 'createCheckout')
 * @param error - The original error
 * @param statusCode - Optional HTTP status code
 * @returns Formatted error message
 */
export function formatAdapterError(
  adapterName: string,
  operation: string,
  error: unknown,
  statusCode?: number
): string {
  const message = extractErrorMessage(error);
  const statusPart = statusCode ? ` (status: ${statusCode})` : '';
  return `[${adapterName}] ${operation}: ${message}${statusPart}`;
}
