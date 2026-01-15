/**
 * Context-Aware Logger (Pino-based)
 *
 * High-performance structured JSON logger that automatically includes
 * context fields (requestId, tenantId, userId) from the current request context.
 *
 * Uses pino for production performance. pino-pretty is enabled by default
 * in development for human-readable output. To disable:
 * ```bash
 * LOG_PRETTY=false pnpm dev
 * ```
 */

import { createRequire } from 'module';
import pino from 'pino';
import type { DestinationStream, Logger as PinoLogger } from 'pino';
import { tryGetScopeContext } from '../scope/context';

// Create require for ESM compatibility (pino-pretty needs require())
const esmRequire = createRequire(import.meta.url);

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
 * Check if pretty printing is enabled.
 * Enabled by default in non-production unless explicitly disabled.
 */
function isPrettyEnabled(): boolean {
  // Explicitly disabled
  if (process.env.LOG_PRETTY === 'false' || process.env.LOG_PRETTY === '0') {
    return false;
  }
  // Explicitly enabled
  if (process.env.LOG_PRETTY === 'true' || process.env.LOG_PRETTY === '1') {
    return true;
  }
  // Default: enabled in non-production (and not in test)
  return process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';
}

// Lazy initialization to avoid calling at import time (which can fail under bundlers)
let _pinoLogger: PinoLogger | undefined;

/**
 * Get or create the pino logger instance.
 * Uses lazy initialization to avoid worker thread issues with Next.js bundling.
 */
function getPinoLoggerInstance(): PinoLogger {
  if (_pinoLogger) return _pinoLogger;

  const level = getLogLevel();

  // Pretty printing in non-prod if pino-pretty is available.
  // Use an inline destination stream to avoid worker threads (which can fail under bundlers).
  let destination: DestinationStream | undefined;
  if (isPrettyEnabled()) {
    try {
      const pretty = esmRequire('pino-pretty') as (options?: Record<string, unknown>) => DestinationStream;
      destination = pretty({
        colorize: true,
        translateTime: 'HH:MM:ss.l',
        singleLine: false,
        ignore: 'pid,hostname',
        levelFirst: true,
      });
    } catch {
      // pino-pretty not installed or unavailable — continue with JSON logs
    }
  }

  _pinoLogger = pino(
    {
      level,
      // Serialize errors properly
      serializers: {
        err: pino.stdSerializers.err,
        error: pino.stdSerializers.err,
      },
      // Keep logs clean (no pid/hostname in serverless)
      base: null,
    },
    destination
  );

  return _pinoLogger;
}

/**
 * Add scope context fields to log data.
 */
function withContext(data?: Record<string, unknown>): Record<string, unknown> {
  const context = tryGetScopeContext();
  return {
    ...(context?.requestId && { requestId: context.requestId }),
    ...(context?.scope?.id && { scopeId: context.scope.id }),
    ...(context?.scope?.type && { scopeType: context.scope.type }),
    ...(context?.userId && { userId: context.userId }),
    ...data,
  };
}

/**
 * Create a context-aware logger that wraps pino.
 */
function createContextAwareLogger(getPino: () => PinoLogger): Logger {
  return {
    trace: (msg, data) => getPino().trace(withContext(data), msg),
    debug: (msg, data) => getPino().debug(withContext(data), msg),
    info: (msg, data) => getPino().info(withContext(data), msg),
    warn: (msg, data) => getPino().warn(withContext(data), msg),
    error: (msg, data) => getPino().error(withContext(data), msg),
    fatal: (msg, data) => getPino().fatal(withContext(data), msg),
    child: (bindings) => {
      // Create a child logger that inherits the bindings
      const childPino = getPino().child(bindings);
      return {
        trace: (msg, data) => childPino.trace(withContext(data), msg),
        debug: (msg, data) => childPino.debug(withContext(data), msg),
        info: (msg, data) => childPino.info(withContext(data), msg),
        warn: (msg, data) => childPino.warn(withContext(data), msg),
        error: (msg, data) => childPino.error(withContext(data), msg),
        fatal: (msg, data) => childPino.fatal(withContext(data), msg),
        child: (more) => createContextAwareLogger(() => childPino).child(more),
      };
    },
  };
}

/**
 * The main logger instance.
 *
 * Automatically includes requestId, tenantId, and userId from context.
 * Uses lazy initialization to avoid worker thread issues with Next.js.
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
 * Pretty output is enabled by default in development. To disable:
 * ```bash
 * LOG_PRETTY=false pnpm dev
 * ```
 */
export const logger: Logger = createContextAwareLogger(getPinoLoggerInstance);

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
export function getPinoLogger(): PinoLogger {
  return getPinoLoggerInstance();
}
