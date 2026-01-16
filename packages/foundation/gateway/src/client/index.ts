/**
 * Client-side utilities for browser applications
 *
 * This module exports pure TypeScript utilities for use in client-side code.
 * Note: React hooks are kept in starters or UI packages, not foundation.
 */

// Error normalization (pure TypeScript, no React)
export {
  normalizeError,
  isRetryable,
  getErrorMessage,
  isAuthError,
  UI_ERROR_MESSAGES,
  type NormalizedError,
} from "./errors";
