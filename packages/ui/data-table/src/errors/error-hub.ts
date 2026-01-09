// ─── ERROR HUB ────────────────────────────────────────────────────────────────
// Central error management system for the DataTable.
// Provides error collection, filtering, subscription, and recovery coordination.

import { DataTableError } from "./base";
import {
  ErrorSeverity,
  SEVERITY_CONFIG,
  shouldAttemptRecovery,
  meetsMinSeverity,
} from "./severity";

// ─── TYPES ────────────────────────────────────────────────────────────────────

/**
 * Handler function for error notifications.
 */
export type ErrorHandler = (error: DataTableError) => void;

/**
 * Function to unsubscribe from error notifications.
 */
export type Unsubscribe = () => void;

/**
 * Configuration options for the ErrorHub.
 */
export interface ErrorHubOptions {
  /**
   * Maximum number of errors to retain in memory.
   * Oldest errors are removed when limit is reached.
   * @default 100
   */
  maxErrors?: number;

  /**
   * Whether to log errors to the console.
   * @default true in development, false in production
   */
  enableConsoleLog?: boolean;

  /**
   * Custom logger function.
   * Called for each error if logging is enabled.
   * @default console.error
   */
  logger?: (error: DataTableError) => void;

  /**
   * Global error handler called for every error.
   * Use for telemetry, monitoring, or global error handling.
   */
  onError?: ErrorHandler;

  /**
   * Minimum severity level to store/report.
   * Errors below this level are logged but not stored or reported.
   * @default ErrorSeverity.WARNING
   */
  minStoreSeverity?: ErrorSeverity;

  /**
   * Whether to deduplicate errors with the same code within a time window.
   * @default true
   */
  deduplicate?: boolean;

  /**
   * Time window in ms for deduplication.
   * @default 1000
   */
  deduplicateWindowMs?: number;
}

/**
 * Current state of the ErrorHub.
 */
export interface ErrorHubState {
  /** All stored errors */
  errors: DataTableError[];
  /** Total count of errors */
  errorCount: number;
  /** Most recent error */
  lastError: DataTableError | null;
  /** Whether any errors exist */
  hasErrors: boolean;
  /** Whether any fatal errors exist */
  hasFatalError: boolean;
  /** Whether any critical or fatal errors exist */
  hasCriticalError: boolean;
  /** Count by severity level */
  countBySeverity: Record<ErrorSeverity, number>;
}

/**
 * Recovery strategy interface.
 * Defined here to avoid circular imports, full implementation in recovery.ts
 */
export interface RecoveryStrategy {
  id: string;
  codes: string[];
  recover(error: DataTableError): boolean;
  getFallback?(error: DataTableError): unknown;
  maxAttempts?: number;
  retryDelay?: number;
}

// ─── ERROR HUB CLASS ──────────────────────────────────────────────────────────

/**
 * Central error management hub for the DataTable.
 *
 * Features:
 * - Collects and stores errors with size limits
 * - Publishes errors to subscribers
 * - Coordinates recovery strategies
 * - Provides error state queries
 * - Supports deduplication
 *
 * @example
 * ```ts
 * const hub = createErrorHub({
 *   onError: (error) => sendToTelemetry(error),
 *   maxErrors: 50,
 * });
 *
 * // Subscribe to errors
 * const unsubscribe = hub.subscribe((error) => {
 *   if (error.severity === ErrorSeverity.FATAL) {
 *     showCriticalErrorUI();
 *   }
 * });
 *
 * // Report an error
 * hub.report(new FilterError("age", 25));
 *
 * // Get current state
 * const state = hub.getState();
 * console.log(`${state.errorCount} errors occurred`);
 *
 * // Cleanup
 * unsubscribe();
 * ```
 */
export class ErrorHub {
  private errors: DataTableError[] = [];
  private handlers: Set<ErrorHandler> = new Set();
  private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();
  private recentErrors: Map<string, number> = new Map(); // code -> timestamp for dedup
  private options: Required<ErrorHubOptions>;

  constructor(options: ErrorHubOptions = {}) {
    this.options = {
      maxErrors: options.maxErrors ?? 100,
      enableConsoleLog:
        options.enableConsoleLog ?? process.env.NODE_ENV !== "production",
      logger: options.logger ?? this.defaultLogger,
      onError: options.onError ?? (() => {}),
      minStoreSeverity: options.minStoreSeverity ?? ErrorSeverity.WARNING,
      deduplicate: options.deduplicate ?? true,
      deduplicateWindowMs: options.deduplicateWindowMs ?? 1000,
    };
  }

  // ─── PUBLIC METHODS ─────────────────────────────────────────────────────────

  /**
   * Report an error to the hub.
   * This is the main entry point for error handling.
   *
   * @param error - The error to report
   * @returns Whether the error was stored (false if deduplicated/filtered)
   */
  report(error: DataTableError): boolean {
    // Check minimum severity
    if (!meetsMinSeverity(error.severity, this.options.minStoreSeverity)) {
      // Still log but don't store
      if (this.options.enableConsoleLog) {
        this.options.logger(error);
      }
      return false;
    }

    // Check for deduplication
    if (this.options.deduplicate && this.isDuplicate(error)) {
      return false;
    }

    // Log if enabled
    if (this.options.enableConsoleLog && SEVERITY_CONFIG[error.severity].log) {
      this.options.logger(error);
    }

    // Attempt recovery if applicable
    if (shouldAttemptRecovery(error.severity)) {
      const recovered = this.attemptRecovery(error);
      if (recovered) {
        // Error was recovered, don't store it
        return false;
      }
    }

    // Store error
    this.storeError(error);

    // Track for deduplication
    if (this.options.deduplicate) {
      this.trackForDeduplication(error);
    }

    // Notify handlers
    this.notifyHandlers(error);

    return true;
  }

  /**
   * Subscribe to error notifications.
   *
   * @param handler - Function called when an error is reported
   * @returns Unsubscribe function
   */
  subscribe(handler: ErrorHandler): Unsubscribe {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  /**
   * Register a recovery strategy for specific error codes.
   *
   * @param strategy - The recovery strategy to register
   */
  registerRecoveryStrategy(strategy: RecoveryStrategy): void {
    strategy.codes.forEach((code) => {
      this.recoveryStrategies.set(code, strategy);
    });
  }

  /**
   * Set a recovery strategy for a single error code.
   *
   * @param code - Error code to handle
   * @param strategy - Recovery strategy
   */
  setRecoveryStrategy(code: string, strategy: RecoveryStrategy): void {
    this.recoveryStrategies.set(code, strategy);
  }

  /**
   * Get the current error state.
   */
  getState(): ErrorHubState {
    const countBySeverity = {
      [ErrorSeverity.WARNING]: 0,
      [ErrorSeverity.ERROR]: 0,
      [ErrorSeverity.CRITICAL]: 0,
      [ErrorSeverity.FATAL]: 0,
    };

    for (const error of this.errors) {
      countBySeverity[error.severity]++;
    }

    return {
      errors: [...this.errors],
      errorCount: this.errors.length,
      lastError: this.errors[this.errors.length - 1] ?? null,
      hasErrors: this.errors.length > 0,
      hasFatalError: countBySeverity[ErrorSeverity.FATAL] > 0,
      hasCriticalError:
        countBySeverity[ErrorSeverity.CRITICAL] > 0 ||
        countBySeverity[ErrorSeverity.FATAL] > 0,
      countBySeverity,
    };
  }

  /**
   * Get all stored errors.
   */
  getErrors(): DataTableError[] {
    return [...this.errors];
  }

  /**
   * Get errors filtered by severity level.
   */
  getErrorsBySeverity(severity: ErrorSeverity): DataTableError[] {
    return this.errors.filter((e) => e.severity === severity);
  }

  /**
   * Get errors filtered by error code.
   */
  getErrorsByCode(code: string): DataTableError[] {
    return this.errors.filter((e) => e.code === code);
  }

  /**
   * Get the most recent error.
   */
  getLastError(): DataTableError | null {
    return this.errors[this.errors.length - 1] ?? null;
  }

  /**
   * Check if any errors of a specific severity exist.
   */
  hasSeverity(severity: ErrorSeverity): boolean {
    return this.errors.some((e) => e.severity === severity);
  }

  /**
   * Clear all stored errors.
   */
  clearErrors(): void {
    this.errors = [];
    this.recentErrors.clear();
  }

  /**
   * Clear errors by severity level.
   */
  clearErrorsBySeverity(severity: ErrorSeverity): void {
    this.errors = this.errors.filter((e) => e.severity !== severity);
  }

  /**
   * Clear errors by error code.
   */
  clearErrorsByCode(code: string): void {
    this.errors = this.errors.filter((e) => e.code !== code);
  }

  /**
   * Get the count of errors.
   */
  getErrorCount(): number {
    return this.errors.length;
  }

  /**
   * Check if there are any errors.
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Get recovery strategy for an error code.
   */
  getRecoveryStrategy(code: string): RecoveryStrategy | undefined {
    return this.recoveryStrategies.get(code);
  }

  /**
   * Remove all handlers and reset state.
   */
  destroy(): void {
    this.handlers.clear();
    this.errors = [];
    this.recentErrors.clear();
    this.recoveryStrategies.clear();
  }

  // ─── PRIVATE METHODS ────────────────────────────────────────────────────────

  private defaultLogger = (error: DataTableError): void => {
    const method =
      error.severity === ErrorSeverity.WARNING ? "warn" : "error";
    console[method](error.toFormattedString(), error.context ?? {});
  };

  private storeError(error: DataTableError): void {
    this.errors.push(error);

    // Enforce max errors limit
    if (this.errors.length > this.options.maxErrors) {
      this.errors.shift(); // Remove oldest
    }
  }

  private notifyHandlers(error: DataTableError): void {
    // Call global handler
    this.options.onError(error);

    // Call all subscribed handlers
    this.handlers.forEach((handler) => {
      try {
        handler(error);
      } catch (handlerError) {
        // Don't let handler errors break the system
        console.error("Error in error handler:", handlerError);
      }
    });
  }

  private attemptRecovery(error: DataTableError): boolean {
    const strategy = this.recoveryStrategies.get(error.code);
    if (!strategy) return false;

    try {
      return strategy.recover(error);
    } catch {
      // Recovery failed, continue with normal error handling
      return false;
    }
  }

  private isDuplicate(error: DataTableError): boolean {
    const lastOccurrence = this.recentErrors.get(error.code);
    if (!lastOccurrence) return false;

    const now = Date.now();
    return now - lastOccurrence < this.options.deduplicateWindowMs;
  }

  private trackForDeduplication(error: DataTableError): void {
    this.recentErrors.set(error.code, Date.now());

    // Cleanup old entries periodically
    if (this.recentErrors.size > 50) {
      const now = Date.now();
      for (const [code, timestamp] of this.recentErrors.entries()) {
        if (now - timestamp > this.options.deduplicateWindowMs) {
          this.recentErrors.delete(code);
        }
      }
    }
  }
}

// ─── SINGLETON & FACTORY ──────────────────────────────────────────────────────

let defaultHub: ErrorHub | null = null;

/**
 * Get the default singleton ErrorHub instance.
 * Creates one if it doesn't exist.
 */
export function getErrorHub(): ErrorHub {
  if (!defaultHub) {
    defaultHub = new ErrorHub();
  }
  return defaultHub;
}

/**
 * Create a new ErrorHub instance with custom options.
 * Use this when you need multiple hubs or custom configuration.
 */
export function createErrorHub(options?: ErrorHubOptions): ErrorHub {
  return new ErrorHub(options);
}

/**
 * Reset the default singleton hub.
 * Mainly useful for testing.
 */
export function resetDefaultErrorHub(): void {
  if (defaultHub) {
    defaultHub.destroy();
    defaultHub = null;
  }
}
