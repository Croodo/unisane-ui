// ─── ERROR SEVERITY SYSTEM ────────────────────────────────────────────────────
// Defines severity levels for DataTable errors and their behavior configuration.

/**
 * Severity levels for DataTable errors.
 * Determines how errors are handled, logged, and displayed.
 */
export enum ErrorSeverity {
  /**
   * Non-blocking issue, logged but UI continues normally.
   * Examples: Deprecated prop usage, performance warning, minor config issue.
   */
  WARNING = "warning",

  /**
   * Feature is degraded but table remains functional.
   * Examples: Single cell render failed, export partially failed, filter bypassed.
   */
  ERROR = "error",

  /**
   * Component cannot function properly, shows fallback UI.
   * Examples: Column config invalid, data processing failed, virtualization error.
   */
  CRITICAL = "critical",

  /**
   * Entire table is unusable, triggers error boundary.
   * Examples: Provider missing, unrecoverable state corruption, missing required props.
   */
  FATAL = "fatal",
}

/**
 * Configuration for how each severity level should be handled.
 */
export interface SeverityConfig {
  /** Whether to log the error to console */
  log: boolean;
  /** Whether to notify the user (via toast, inline message, etc.) */
  notify: boolean;
  /** Whether to trigger the error boundary */
  boundary: boolean;
  /** Whether to attempt automatic recovery */
  recover: boolean;
}

/**
 * Default behavior configuration for each severity level.
 */
export const SEVERITY_CONFIG: Record<ErrorSeverity, SeverityConfig> = {
  [ErrorSeverity.WARNING]: {
    log: true,
    notify: false,
    boundary: false,
    recover: false,
  },
  [ErrorSeverity.ERROR]: {
    log: true,
    notify: true,
    boundary: false,
    recover: true,
  },
  [ErrorSeverity.CRITICAL]: {
    log: true,
    notify: true,
    boundary: true,
    recover: true,
  },
  [ErrorSeverity.FATAL]: {
    log: true,
    notify: true,
    boundary: true,
    recover: false,
  },
};

/**
 * Ordered list of severities from lowest to highest.
 * Used for comparing and escalating severity levels.
 */
export const SEVERITY_ORDER: readonly ErrorSeverity[] = [
  ErrorSeverity.WARNING,
  ErrorSeverity.ERROR,
  ErrorSeverity.CRITICAL,
  ErrorSeverity.FATAL,
] as const;

/**
 * Get the configuration for a given severity level.
 */
export function getSeverityConfig(severity: ErrorSeverity): SeverityConfig {
  return SEVERITY_CONFIG[severity];
}

/**
 * Compare two severity levels.
 * @returns negative if a < b, 0 if equal, positive if a > b
 */
export function compareSeverity(a: ErrorSeverity, b: ErrorSeverity): number {
  return SEVERITY_ORDER.indexOf(a) - SEVERITY_ORDER.indexOf(b);
}

/**
 * Get the higher of two severity levels.
 */
export function maxSeverity(a: ErrorSeverity, b: ErrorSeverity): ErrorSeverity {
  return compareSeverity(a, b) >= 0 ? a : b;
}

/**
 * Check if a severity level meets or exceeds a minimum threshold.
 */
export function meetsMinSeverity(
  severity: ErrorSeverity,
  minSeverity: ErrorSeverity
): boolean {
  return compareSeverity(severity, minSeverity) >= 0;
}

/**
 * Check if an error should be reported based on minimum severity.
 */
export function shouldReport(
  severity: ErrorSeverity,
  minReportSeverity: ErrorSeverity
): boolean {
  return meetsMinSeverity(severity, minReportSeverity);
}

/**
 * Check if an error should trigger the error boundary.
 */
export function shouldTriggerBoundary(severity: ErrorSeverity): boolean {
  return getSeverityConfig(severity).boundary;
}

/**
 * Check if an error should attempt recovery.
 */
export function shouldAttemptRecovery(severity: ErrorSeverity): boolean {
  return getSeverityConfig(severity).recover;
}

/**
 * Check if an error should notify the user.
 */
export function shouldNotifyUser(severity: ErrorSeverity): boolean {
  return getSeverityConfig(severity).notify;
}
