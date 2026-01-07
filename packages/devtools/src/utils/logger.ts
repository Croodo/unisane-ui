import chalk from 'chalk';
import ora, { type Ora } from 'ora';

/**
 * Print the devtools banner
 */
export function banner(): void {
  console.log(chalk.cyan.bold('\n🛠  Unisane Devtools\n'));
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
export function kv(key: string, value: string | number | boolean | null | undefined): void {
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

export const log = {
  banner,
  success,
  error,
  warn,
  info,
  dim,
  spinner,
  section,
  kv,
  row,
};
