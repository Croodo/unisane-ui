// ─── LOGGER UTILITY ──────────────────────────────────────────────────────────
// Standardized logging for the DataTable package.
// Provides consistent error handling patterns across all modules.

import { DataTableError, DataTableErrorCode, type DataTableErrorCodeValue } from "../errors";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  /** Component or module name */
  source?: string;
  /** Additional context data */
  data?: Record<string, unknown>;
  /** Error code for programmatic handling */
  code?: DataTableErrorCodeValue;
}

export interface LoggerOptions {
  /** Minimum log level to output (default: "warn" in production, "debug" otherwise) */
  minLevel?: LogLevel;
  /** Custom log handler (replaces console) */
  handler?: (level: LogLevel, message: string, context?: LogContext) => void;
  /** Prefix for all log messages */
  prefix?: string;
}

// ─── LOG LEVEL PRIORITY ──────────────────────────────────────────────────────

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// ─── LOGGER CLASS ────────────────────────────────────────────────────────────

/**
 * Logger class for consistent logging across the DataTable package.
 *
 * Features:
 * - Respects NODE_ENV (production mode suppresses debug/info)
 * - Supports custom log handlers
 * - Integrates with DataTableError system
 * - Provides structured context logging
 *
 * @example
 * ```typescript
 * const logger = createLogger({ source: "useRowDrag" });
 *
 * logger.debug("Drag started", { rowId: "123" });
 * logger.warn("Cache miss", { cacheKey: "row-1" });
 * logger.error("Failed to reorder", { fromIndex: 0, toIndex: 5 });
 * ```
 */
class Logger {
  private readonly options: Required<LoggerOptions>;
  private readonly isProduction: boolean;

  constructor(options: LoggerOptions = {}) {
    this.isProduction = typeof process !== "undefined" && process.env?.NODE_ENV === "production";

    this.options = {
      minLevel: options.minLevel ?? (this.isProduction ? "warn" : "debug"),
      handler: options.handler ?? this.defaultHandler.bind(this),
      prefix: options.prefix ?? "DataTable",
    };
  }

  private defaultHandler(level: LogLevel, message: string, context?: LogContext): void {
    const formattedMessage = this.formatMessage(message, context);

    switch (level) {
      case "debug":
        console.debug(formattedMessage);
        break;
      case "info":
        console.info(formattedMessage);
        break;
      case "warn":
        console.warn(formattedMessage);
        break;
      case "error":
        console.error(formattedMessage);
        break;
    }
  }

  private formatMessage(message: string, context?: LogContext): string {
    const parts: string[] = [];

    // Add prefix
    parts.push(`[${this.options.prefix}]`);

    // Add source if provided
    if (context?.source) {
      parts.push(`[${context.source}]`);
    }

    // Add error code if provided
    if (context?.code) {
      parts.push(`[${context.code}]`);
    }

    // Add message
    parts.push(message);

    // Add data if provided and not in production
    if (context?.data && !this.isProduction) {
      parts.push(JSON.stringify(context.data));
    }

    return parts.join(" ");
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.options.minLevel];
  }

  /**
   * Log a debug message (development only)
   */
  debug(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog("debug")) {
      this.options.handler("debug", message, { data });
    }
  }

  /**
   * Log an info message
   */
  info(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog("info")) {
      this.options.handler("info", message, { data });
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: Omit<LogContext, "source">): void {
    if (this.shouldLog("warn")) {
      this.options.handler("warn", message, context);
    }
  }

  /**
   * Log an error message
   */
  error(message: string, context?: Omit<LogContext, "source">): void {
    if (this.shouldLog("error")) {
      this.options.handler("error", message, context);
    }
  }

  /**
   * Log a DataTableError
   */
  logError(error: DataTableError): void {
    if (this.shouldLog("error")) {
      this.options.handler("error", error.message, {
        code: error.code,
        data: error.context,
      });
    }
  }

  /**
   * Create a child logger with a specific source
   */
  child(source: string): SourcedLogger {
    return new SourcedLogger(this, source);
  }
}

/**
 * Logger with a fixed source for a specific module/component
 */
class SourcedLogger {
  constructor(
    private readonly parent: Logger,
    private readonly source: string
  ) {}

  debug(message: string, data?: Record<string, unknown>): void {
    (this.parent as unknown as { options: Required<LoggerOptions>; shouldLog: (l: LogLevel) => boolean }).shouldLog(
      "debug"
    ) &&
      (
        this.parent as unknown as {
          options: Required<LoggerOptions>;
          shouldLog: (l: LogLevel) => boolean;
        }
      ).options.handler("debug", message, { source: this.source, data });
  }

  info(message: string, data?: Record<string, unknown>): void {
    // Simplified - just use parent methods with source in data
    this.parent.info(`[${this.source}] ${message}`, data);
  }

  warn(message: string, context?: Omit<LogContext, "source">): void {
    this.parent.warn(`[${this.source}] ${message}`, context);
  }

  error(message: string, context?: Omit<LogContext, "source">): void {
    this.parent.error(`[${this.source}] ${message}`, context);
  }
}

// ─── FACTORY FUNCTIONS ───────────────────────────────────────────────────────

/**
 * Create a new logger instance
 */
export function createLogger(options?: LoggerOptions): Logger {
  return new Logger(options);
}

/**
 * Default logger instance for the DataTable package
 */
export const logger = createLogger();

// ─── CONVENIENCE FUNCTIONS ───────────────────────────────────────────────────

/**
 * Log a warning only in development mode
 */
export function devWarn(message: string, context?: LogContext): void {
  if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
    logger.warn(message, context);
  }
}

/**
 * Log an error and optionally throw a DataTableError
 */
export function logAndThrow(
  message: string,
  code: DataTableErrorCodeValue,
  context?: Record<string, unknown>
): never {
  const error = new DataTableError(message, code, { context });
  logger.logError(error);
  throw error;
}

/**
 * Log an error without throwing (for recoverable errors)
 */
export function logRecoverable(
  message: string,
  code: DataTableErrorCodeValue,
  context?: Record<string, unknown>
): void {
  logger.error(message, { code, data: context });
}

/**
 * Wrap an async operation with error logging
 */
export async function withErrorLogging<T>(
  operation: () => Promise<T>,
  errorMessage: string,
  code: DataTableErrorCodeValue = DataTableErrorCode.RENDER_ERROR
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const dtError = new DataTableError(errorMessage, code, {
      cause: error instanceof Error ? error : undefined,
      context: { originalError: String(error) },
    });
    logger.logError(dtError);
    throw dtError;
  }
}

/**
 * Wrap a sync operation with error logging
 */
export function withErrorLoggingSync<T>(
  operation: () => T,
  errorMessage: string,
  code: DataTableErrorCodeValue = DataTableErrorCode.RENDER_ERROR
): T {
  try {
    return operation();
  } catch (error) {
    const dtError = new DataTableError(errorMessage, code, {
      cause: error instanceof Error ? error : undefined,
      context: { originalError: String(error) },
    });
    logger.logError(dtError);
    throw dtError;
  }
}
