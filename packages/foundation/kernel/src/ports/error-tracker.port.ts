/**
 * Error Tracker Port
 *
 * Port interface for error tracking services (Sentry, etc.).
 * Provides a unified interface for capturing exceptions, messages,
 * and context across the application.
 */

import { setGlobalProvider, getGlobalProvider, hasGlobalProvider } from './global-provider';

const PROVIDER_KEY = 'error-tracker';

/**
 * Error context for additional debugging information.
 */
export interface ErrorContext {
  /** Tags for filtering/grouping errors */
  tags?: Record<string, string>;
  /** Extra data for debugging */
  extra?: Record<string, unknown>;
  /** User information */
  user?: { id: string; email?: string; tenantId?: string };
  /** Error severity level */
  level?: 'fatal' | 'error' | 'warning' | 'info';
}

/**
 * Breadcrumb for tracking user actions leading to an error.
 */
export interface Breadcrumb {
  /** Type of breadcrumb */
  type: 'http' | 'navigation' | 'user' | 'debug';
  /** Category for grouping */
  category: string;
  /** Human-readable message */
  message: string;
  /** Breadcrumb level */
  level?: 'info' | 'warning' | 'error';
  /** Additional data */
  data?: Record<string, unknown>;
}

/**
 * Port interface for error tracking.
 */
export interface ErrorTrackerPort {
  /**
   * Capture an exception and send to error tracking service.
   */
  captureException(error: Error, context?: ErrorContext): void;

  /**
   * Capture a message (non-exception) for tracking.
   */
  captureMessage(message: string, level?: 'info' | 'warning' | 'error'): void;

  /**
   * Set user context for error tracking.
   */
  setUser(user: { id: string; email?: string; tenantId?: string }): void;

  /**
   * Clear user context (e.g., on logout).
   */
  clearUser(): void;

  /**
   * Set a tag that will be included with all subsequent events.
   */
  setTag(key: string, value: string): void;

  /**
   * Add a breadcrumb for tracking user actions.
   */
  addBreadcrumb(breadcrumb: Breadcrumb): void;

  /**
   * Clear all breadcrumbs.
   */
  clearBreadcrumbs?(): void;
}

/**
 * Set the error tracker provider implementation.
 * Call this at app bootstrap.
 */
export function setErrorTrackerProvider(provider: ErrorTrackerPort): void {
  setGlobalProvider(PROVIDER_KEY, provider);
}

/**
 * Get the error tracker provider.
 * Returns null if not configured (error tracking is optional).
 */
export function getErrorTrackerProvider(): ErrorTrackerPort | null {
  return getGlobalProvider<ErrorTrackerPort>(PROVIDER_KEY) ?? null;
}

/**
 * Check if error tracker provider is configured.
 */
export function hasErrorTrackerProvider(): boolean {
  return hasGlobalProvider(PROVIDER_KEY);
}

/**
 * Convenience function: Capture an exception if error tracker is configured.
 * Fails silently if no tracker is configured.
 */
export function captureException(error: Error, context?: ErrorContext): void {
  const tracker = getErrorTrackerProvider();
  if (tracker) {
    tracker.captureException(error, context);
  }
}

/**
 * Convenience function: Capture a message if error tracker is configured.
 * Fails silently if no tracker is configured.
 */
export function captureMessage(message: string, level?: 'info' | 'warning' | 'error'): void {
  const tracker = getErrorTrackerProvider();
  if (tracker) {
    tracker.captureMessage(message, level);
  }
}

/**
 * Noop error tracker for testing or when error tracking is disabled.
 */
export const noopErrorTracker: ErrorTrackerPort = {
  captureException: () => {},
  captureMessage: () => {},
  setUser: () => {},
  clearUser: () => {},
  setTag: () => {},
  addBreadcrumb: () => {},
  clearBreadcrumbs: () => {},
};
