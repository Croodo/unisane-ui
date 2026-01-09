/**
 * Re-export logger from @unisane/cli-core
 *
 * This module re-exports the unified logging infrastructure from cli-core
 * for backwards compatibility with existing devtools code.
 */

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
} from '@unisane/cli-core';
export type { Logger, LoggerOptions } from '@unisane/cli-core';
