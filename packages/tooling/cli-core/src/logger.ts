/**
 * @module @unisane/cli-core/logger
 *
 * Unified logging infrastructure for CLI tools.
 * Provides consistent styling and output formatting.
 */

import chalk from 'chalk';
import ora, { type Ora } from 'ora';

// ════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════

export interface LoggerOptions {
  /** Prefix for all log messages */
  prefix?: string;
  /** Whether to use colors */
  colors?: boolean;
  /** Verbose mode */
  verbose?: boolean;
}

export interface Logger {
  banner: (title?: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warn: (message: string) => void;
  info: (message: string) => void;
  dim: (message: string) => void;
  debug: (message: string) => void;
  spinner: (text: string) => Ora;
  section: (title: string) => void;
  kv: (key: string, value: unknown) => void;
  row: (label: string, value: string, width?: number) => void;
  newline: () => void;
  table: (headers: string[], rows: string[][]) => void;
  step: (current: number, total: number, message: string) => void;
}

// ════════════════════════════════════════════════════════════════════════════
// Default Logger Implementation
// ════════════════════════════════════════════════════════════════════════════

let _verbose = false;

/**
 * Set verbose mode globally
 */
export function setVerbose(enabled: boolean): void {
  _verbose = enabled;
}

/**
 * Print the CLI banner
 */
export function banner(title = 'Unisane Devtools'): void {
  console.log(chalk.cyan.bold(`\n🛠  ${title}\n`));
}

/**
 * Print success message
 */
export function success(message: string): void {
  console.log(chalk.green(`✔ ${message}`));
}

/**
 * Print error message
 */
export function error(message: string): void {
  console.error(chalk.red(`✖ ${message}`));
}

/**
 * Print warning message
 */
export function warn(message: string): void {
  console.warn(chalk.yellow(`⚠ ${message}`));
}

/**
 * Print info message
 */
export function info(message: string): void {
  console.log(chalk.blue(`ℹ ${message}`));
}

/**
 * Print a dimmed/muted message
 */
export function dim(message: string): void {
  console.log(chalk.dim(message));
}

/**
 * Print debug message (only in verbose mode)
 */
export function debug(message: string): void {
  if (_verbose) {
    console.log(chalk.gray(`  ${message}`));
  }
}

/**
 * Create a spinner
 */
export function spinner(text: string): Ora {
  return ora({ text, color: 'cyan' });
}

/**
 * Print a section header
 */
export function section(title: string): void {
  console.log(chalk.bold.underline(`\n${title}`));
}

/**
 * Print a key-value pair
 */
export function kv(key: string, value: unknown): void {
  const v = value === null || value === undefined ? chalk.dim('(none)') : String(value);
  console.log(`  ${chalk.dim(key + ':')} ${v}`);
}

/**
 * Print a table row
 */
export function row(label: string, value: string, width = 30): void {
  const paddedLabel = label.padEnd(width);
  console.log(`${chalk.dim(paddedLabel)} ${value}`);
}

/**
 * Print a newline
 */
export function newline(): void {
  console.log();
}

/**
 * Print a simple table
 */
export function table(headers: string[], rows: string[][]): void {
  // Calculate column widths
  const widths = headers.map((h, i) => {
    const maxRowWidth = Math.max(...rows.map(r => (r[i] ?? '').length));
    return Math.max(h.length, maxRowWidth) + 2;
  });

  // Print header
  const headerRow = headers.map((h, i) => h.padEnd(widths[i] ?? 0)).join('');
  console.log(chalk.bold(headerRow));
  console.log(chalk.dim('─'.repeat(headerRow.length)));

  // Print rows
  for (const r of rows) {
    const rowStr = r.map((cell, i) => (cell ?? '').padEnd(widths[i] ?? 0)).join('');
    console.log(rowStr);
  }
}

/**
 * Print a step indicator
 */
export function step(current: number, total: number, message: string): void {
  console.log(chalk.cyan(`[${current}/${total}]`) + ` ${message}`);
}

// ════════════════════════════════════════════════════════════════════════════
// Logger Object (for convenience)
// ════════════════════════════════════════════════════════════════════════════

export const log: Logger = {
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
};

// ════════════════════════════════════════════════════════════════════════════
// Factory for Custom Loggers
// ════════════════════════════════════════════════════════════════════════════

/**
 * Create a logger with a specific prefix
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  const { prefix = '', verbose = false } = options;

  const prefixStr = prefix ? `[${prefix}] ` : '';

  return {
    banner: (title) => banner(title ?? prefix),
    success: (msg) => success(prefixStr + msg),
    error: (msg) => error(prefixStr + msg),
    warn: (msg) => warn(prefixStr + msg),
    info: (msg) => info(prefixStr + msg),
    dim: (msg) => dim(prefixStr + msg),
    debug: (msg) => {
      if (verbose || _verbose) {
        console.log(chalk.gray(`  ${prefixStr}${msg}`));
      }
    },
    spinner: (text) => spinner(prefixStr + text),
    section,
    kv,
    row,
    newline,
    table,
    step,
  };
}
