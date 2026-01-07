/**
 * Context-Aware Logger (Pino-based)
 *
 * High-performance structured JSON logger that automatically includes
 * context fields (requestId, tenantId, userId) from the current request context.
 *
 * Uses pino for production performance. Use pino-pretty for development:
 * ```bash
 * pnpm add -D pino-pretty
 * LOG_PRETTY=true pnpm dev
 * ```
 */

import pino from 'pino';
import { ctx } from '../context';

/**
 * Log levels supported by pino.
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Logger interface for consistent API.
 */
export interface Logger {
  trace(msg: string, data?: Record<string, unknown>): void;
  debug(msg: string, data?: Record<string, unknown>): void;
  info(msg: string, data?: Record<string, unknown>): void;
  warn(msg: string, data?: Record<string, unknown>): void;
  error(msg: string, data?: Record<string, unknown>): void;
  fatal(msg: string, data?: Record<string, unknown>): void;
  child(bindings: Record<string, unknown>): Logger;
}

/**
 * Get log level from environment.
 */
function getLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase();
  const validLevels: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
  if (envLevel && validLevels.includes(envLevel as LogLevel)) {
    return envLevel as LogLevel;
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

/**
 * Check if pretty printing is enabled (for development).
 */
function isPrettyEnabled(): boolean {
  return process.env.LOG_PRETTY === 'true' || process.env.LOG_PRETTY === '1';
}

/**
 * Create the base pino logger instance.
 */
function createBaseLogger(): pino.Logger {
  const options: pino.LoggerOptions = {
    level: getLogLevel(),
    // Use ISO timestamps for consistency
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
    // Serialize errors properly
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
    },
    // Base fields
    base: {
      service: process.env.SERVICE_NAME || 'unisane',
    },
  };

  // In development with LOG_PRETTY, use pino-pretty transport
  if (isPrettyEnabled() && process.env.NODE_ENV !== 'production') {
    return pino({
      ...options,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname,service',
        },
      },
    });
  }

  return pino(options);
}

/**
 * The base pino instance.
 */
const baseLogger = createBaseLogger();

/**
 * Create a context-aware logger that wraps pino.
 */
function createContextAwareLogger(pinoLogger: pino.Logger): Logger {
  /**
   * Add context fields to log data.
   */
  function withContext(data?: Record<string, unknown>): Record<string, unknown> {
    const context = ctx.tryGet();
    return {
      ...(context?.requestId && { requestId: context.requestId }),
      ...(context?.tenantId && { tenantId: context.tenantId }),
      ...(context?.userId && { userId: context.userId }),
      ...data,
    };
  }

  return {
    trace: (msg, data) => pinoLogger.trace(withContext(data), msg),
    debug: (msg, data) => pinoLogger.debug(withContext(data), msg),
    info: (msg, data) => pinoLogger.info(withContext(data), msg),
    warn: (msg, data) => pinoLogger.warn(withContext(data), msg),
    error: (msg, data) => pinoLogger.error(withContext(data), msg),
    fatal: (msg, data) => pinoLogger.fatal(withContext(data), msg),
    child: (bindings) => createContextAwareLogger(pinoLogger.child(bindings)),
  };
}

/**
 * The main logger instance.
 *
 * Automatically includes requestId, tenantId, and userId from context.
 *
 * @example
 * ```typescript
 * import { logger } from '@unisane/kernel';
 *
 * // Basic logging - automatically includes context fields
 * logger.info('User signed in', { email: 'user@example.com' });
 *
 * // Log with error
 * logger.error('Failed to process payment', { error: err, orderId: 'order_456' });
 *
 * // Create a child logger with default fields
 * const billingLogger = logger.child({ module: 'billing' });
 * billingLogger.info('Subscription created'); // Includes module: 'billing'
 * ```
 *
 * For pretty output in development:
 * ```bash
 * LOG_PRETTY=true pnpm dev
 * ```
 */
export const logger: Logger = createContextAwareLogger(baseLogger);

/**
 * Create a module-specific logger.
 *
 * @example
 * ```typescript
 * const log = createModuleLogger('billing');
 * log.info('Processing payment'); // Includes module: 'billing'
 * ```
 */
export function createModuleLogger(module: string): Logger {
  return logger.child({ module });
}

/**
 * Get the underlying pino logger for advanced use cases.
 * Use sparingly - prefer the context-aware logger.
 */
export function getPinoLogger(): pino.Logger {
  return baseLogger;
}
