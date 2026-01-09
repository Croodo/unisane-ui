/**
 * @unisane/cli-core
 *
 * Shared CLI infrastructure for Unisane developer tools.
 *
 * Provides:
 * - Unified logging with consistent styling
 * - Standardized error handling
 * - User prompts and confirmations
 *
 * @example
 * ```typescript
 * import { log, handleError, prompt } from '@unisane/cli-core';
 *
 * async function myCommand() {
 *   log.banner('My Tool');
 *
 *   const confirmed = await prompt.confirm('Continue?');
 *   if (!confirmed) return;
 *
 *   const spinner = log.spinner('Processing...');
 *   spinner.start();
 *
 *   try {
 *     // ... do work
 *     spinner.succeed('Done!');
 *   } catch (error) {
 *     spinner.fail('Failed');
 *     handleError(error);
 *   }
 * }
 * ```
 */

// Logger
export {
  log,
  createLogger,
  setVerbose,
  banner,
  success,
  error,
  warn,
  info,
  dim,
  debug,
  spinner,
  section,
  kv,
  row,
  newline,
  table,
  step,
} from './logger.js';
export type { Logger, LoggerOptions } from './logger.js';

// Errors
export {
  CLIError,
  UserError,
  ConfigError,
  ValidationError,
  DependencyError,
  CancelledError,
  handleError,
  withErrorHandling,
  assert,
  assertDefined,
} from './errors.js';

// Prompts
export {
  prompt,
  confirm,
  text,
  password,
  select,
  multiselect,
  autocomplete,
  number,
} from './prompts.js';
export type { Choice } from './prompts.js';
