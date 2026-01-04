// ─── SAFE EXPORT UTILITIES ─────────────────────────────────────────────────
// Wrappers for export functions that integrate with the ErrorHub system.

import type { ExportResult, ExportFormat, ExportConfig } from "./types";
import { exportToCSV } from "./csv";
import { exportToJSON } from "./json";
import { exportToExcel } from "./excel";
import type { ErrorHub } from "../../errors/error-hub";
import { ExportError } from "../../errors/runtime-errors";

// ─── TYPES ────────────────────────────────────────────────────────────────────

/**
 * Extended export result with error information
 */
export interface SafeExportResult extends ExportResult {
  /** The format that was exported */
  format: ExportFormat;
  /** Duration of export in milliseconds */
  duration?: number;
  /** Whether the error was reported to the hub */
  errorReported?: boolean;
}

/**
 * Options for safe export
 */
export interface SafeExportOptions {
  /** Error hub to report errors to */
  errorHub: ErrorHub;
  /** Callback when export starts */
  onStart?: (format: ExportFormat) => void;
  /** Callback when export completes successfully */
  onSuccess?: (result: SafeExportResult) => void;
  /** Callback when export fails */
  onError?: (error: ExportError, result: SafeExportResult) => void;
  /** Whether to log errors to console (development) */
  logErrors?: boolean;
}

// ─── SAFE EXPORT FUNCTION ─────────────────────────────────────────────────────

/**
 * Safely export data to the specified format.
 * Catches errors and reports them to the ErrorHub.
 *
 * @param config - Export configuration
 * @param options - Safe export options
 * @returns Export result with error information
 *
 * @example
 * ```ts
 * const result = await safeExport(
 *   { format: "csv", data, columns },
 *   { errorHub, onSuccess: () => toast.success("Export complete") }
 * );
 *
 * if (!result.success) {
 *   // Error was already reported to errorHub
 *   console.log("Export failed:", result.error);
 * }
 * ```
 */
export async function safeExport<T extends { id: string }>(
  config: ExportConfig<T>,
  options: SafeExportOptions
): Promise<SafeExportResult> {
  const { errorHub, onStart, onSuccess, onError, logErrors = false } = options;
  const startTime = Date.now();

  // Notify start
  onStart?.(config.format);

  try {
    let result: ExportResult;

    // Execute the appropriate export function
    switch (config.format) {
      case "csv":
        result = exportToCSV(config);
        break;
      case "json":
        result = exportToJSON(config);
        break;
      case "excel":
        result = await exportToExcel(config);
        break;
      case "pdf":
        // PDF export not yet implemented
        result = { success: false, error: "PDF export not yet implemented" };
        break;
      default:
        result = { success: false, error: `Unknown export format: ${(config as { format: string }).format}` };
    }

    const duration = Date.now() - startTime;
    const safeResult: SafeExportResult = {
      ...result,
      format: config.format,
      duration,
    };

    if (result.success) {
      onSuccess?.(safeResult);
    } else {
      // Create and report error
      const error = new ExportError(
        config.format,
        result.error ?? "Export failed"
      );
      errorHub.report(error);
      safeResult.errorReported = true;

      if (logErrors) {
        console.error(`[DataTable] Export to ${config.format} failed:`, result.error);
      }

      onError?.(error, safeResult);
    }

    return safeResult;
  } catch (cause) {
    const duration = Date.now() - startTime;
    const message = cause instanceof Error ? cause.message : "Unknown error during export";

    // Create and report error
    const error = new ExportError(
      config.format,
      message,
      { cause: cause instanceof Error ? cause : undefined }
    );
    errorHub.report(error);

    if (logErrors) {
      console.error(`[DataTable] Export to ${config.format} threw:`, cause);
    }

    const safeResult: SafeExportResult = {
      success: false,
      error: message,
      format: config.format,
      duration,
      errorReported: true,
    };

    onError?.(error, safeResult);
    return safeResult;
  }
}

// ─── FORMAT-SPECIFIC WRAPPERS ─────────────────────────────────────────────────

/**
 * Safely export to CSV format.
 */
export async function safeExportCSV<T extends { id: string }>(
  config: Omit<ExportConfig<T> & { format: "csv" }, "format">,
  options: SafeExportOptions
): Promise<SafeExportResult> {
  return safeExport({ ...config, format: "csv" }, options);
}

/**
 * Safely export to JSON format.
 */
export async function safeExportJSON<T extends { id: string }>(
  config: Omit<ExportConfig<T> & { format: "json" }, "format">,
  options: SafeExportOptions
): Promise<SafeExportResult> {
  return safeExport({ ...config, format: "json" }, options);
}

/**
 * Safely export to Excel format.
 */
export async function safeExportExcel<T extends { id: string }>(
  config: Omit<ExportConfig<T> & { format: "excel" }, "format">,
  options: SafeExportOptions
): Promise<SafeExportResult> {
  return safeExport({ ...config, format: "excel" }, options);
}

// ─── EXPORT WITH RETRY ────────────────────────────────────────────────────────

/**
 * Export with automatic retry on failure.
 *
 * @param config - Export configuration
 * @param options - Safe export options
 * @param retryOptions - Retry configuration
 * @returns Export result
 */
export async function safeExportWithRetry<T extends { id: string }>(
  config: ExportConfig<T>,
  options: SafeExportOptions,
  retryOptions: {
    maxAttempts?: number;
    delayMs?: number;
    onRetry?: (attempt: number, error: string) => void;
  } = {}
): Promise<SafeExportResult> {
  const { maxAttempts = 3, delayMs = 1000, onRetry } = retryOptions;
  const { errorHub, ...restOptions } = options;

  let lastResult: SafeExportResult | null = null;
  let lastError: ExportError | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const isLastAttempt = attempt === maxAttempts;

    // Execute export without error reporting for non-final attempts
    lastResult = await safeExportInternal(config, {
      ...restOptions,
      errorHub,
      reportErrors: isLastAttempt,
    });

    if (lastResult.success) {
      return lastResult;
    }

    // If not the last attempt, wait and retry
    if (!isLastAttempt) {
      onRetry?.(attempt, lastResult.error ?? "Unknown error");
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }

  return lastResult!;
}

/**
 * Internal export function with error reporting control.
 */
async function safeExportInternal<T extends { id: string }>(
  config: ExportConfig<T>,
  options: SafeExportOptions & { reportErrors: boolean }
): Promise<SafeExportResult> {
  const { errorHub, onStart, onSuccess, onError, logErrors = false, reportErrors } = options;
  const startTime = Date.now();

  // Notify start
  onStart?.(config.format);

  try {
    let result: ExportResult;

    // Execute the appropriate export function
    switch (config.format) {
      case "csv":
        result = exportToCSV(config);
        break;
      case "json":
        result = exportToJSON(config);
        break;
      case "excel":
        result = await exportToExcel(config);
        break;
      case "pdf":
        result = { success: false, error: "PDF export not yet implemented" };
        break;
      default:
        result = { success: false, error: `Unknown export format: ${(config as { format: string }).format}` };
    }

    const duration = Date.now() - startTime;
    const safeResult: SafeExportResult = {
      ...result,
      format: config.format,
      duration,
    };

    if (result.success) {
      onSuccess?.(safeResult);
    } else {
      const error = new ExportError(config.format, result.error ?? "Export failed");

      if (reportErrors) {
        errorHub.report(error);
        safeResult.errorReported = true;
      }

      if (logErrors) {
        console.error(`[DataTable] Export to ${config.format} failed:`, result.error);
      }

      onError?.(error, safeResult);
    }

    return safeResult;
  } catch (cause) {
    const duration = Date.now() - startTime;
    const message = cause instanceof Error ? cause.message : "Unknown error during export";

    const error = new ExportError(
      config.format,
      message,
      { cause: cause instanceof Error ? cause : undefined }
    );

    if (reportErrors) {
      errorHub.report(error);
    }

    if (logErrors) {
      console.error(`[DataTable] Export to ${config.format} threw:`, cause);
    }

    const safeResult: SafeExportResult = {
      success: false,
      error: message,
      format: config.format,
      duration,
      errorReported: reportErrors,
    };

    onError?.(error, safeResult);
    return safeResult;
  }
}

// ─── BATCH EXPORT ─────────────────────────────────────────────────────────────

/**
 * Export to multiple formats at once.
 *
 * @param configs - Array of export configurations
 * @param options - Safe export options
 * @returns Array of export results
 */
export async function safeBatchExport<T extends { id: string }>(
  configs: ExportConfig<T>[],
  options: SafeExportOptions
): Promise<SafeExportResult[]> {
  const results: SafeExportResult[] = [];

  for (const config of configs) {
    const result = await safeExport(config, options);
    results.push(result);
  }

  return results;
}
