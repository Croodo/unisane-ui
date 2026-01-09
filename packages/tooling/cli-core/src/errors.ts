/**
 * @module @unisane/cli-core/errors
 *
 * Standardized error handling for CLI tools.
 */

import { log } from './logger.js';

// ════════════════════════════════════════════════════════════════════════════
// Error Types
// ════════════════════════════════════════════════════════════════════════════

/**
 * Base error for CLI operations
 */
export class CLIError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'CLI_ERROR',
    public readonly exitCode: number = 1
  ) {
    super(message);
    this.name = 'CLIError';
  }
}

/**
 * Error for user-caused issues (invalid input, missing files, etc.)
 */
export class UserError extends CLIError {
  constructor(message: string, code = 'USER_ERROR') {
    super(message, code, 1);
    this.name = 'UserError';
  }
}

/**
 * Error for configuration issues
 */
export class ConfigError extends CLIError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR', 1);
    this.name = 'ConfigError';
  }
}

/**
 * Error for validation failures
 */
export class ValidationError extends CLIError {
  constructor(
    message: string,
    public readonly errors: string[] = []
  ) {
    super(message, 'VALIDATION_ERROR', 1);
    this.name = 'ValidationError';
  }
}

/**
 * Error when a required dependency is missing
 */
export class DependencyError extends CLIError {
  constructor(
    public readonly dependency: string,
    message?: string
  ) {
    super(message ?? `Missing required dependency: ${dependency}`, 'DEPENDENCY_ERROR', 1);
    this.name = 'DependencyError';
  }
}

/**
 * Error when a command is cancelled by user
 */
export class CancelledError extends CLIError {
  constructor(message = 'Operation cancelled') {
    super(message, 'CANCELLED', 0);
    this.name = 'CancelledError';
  }
}

// ════════════════════════════════════════════════════════════════════════════
// Error Handlers
// ════════════════════════════════════════════════════════════════════════════

/**
 * Handle CLI errors consistently
 */
export function handleError(error: unknown): never {
  if (error instanceof CancelledError) {
    log.dim(error.message);
    process.exit(0);
  }

  if (error instanceof ValidationError) {
    log.error(error.message);
    if (error.errors.length > 0) {
      error.errors.forEach((e) => log.dim(`  - ${e}`));
    }
    process.exit(error.exitCode);
  }

  if (error instanceof CLIError) {
    log.error(error.message);
    process.exit(error.exitCode);
  }

  if (error instanceof Error) {
    log.error(error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }

  log.error(String(error));
  process.exit(1);
}

/**
 * Wrap an async function with error handling
 */
export function withErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R | void> {
  return async (...args: T) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error);
    }
  };
}

/**
 * Assert a condition, throwing UserError if false
 */
export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new UserError(message);
  }
}

/**
 * Assert a value is defined
 */
export function assertDefined<T>(value: T | undefined | null, name: string): T {
  if (value === undefined || value === null) {
    throw new UserError(`${name} is required but was not provided`);
  }
  return value;
}
