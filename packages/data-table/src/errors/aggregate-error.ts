// ─── AGGREGATE ERROR ──────────────────────────────────────────────────────────
// Combines multiple errors into a single error for batch validation and reporting.

import { DataTableError, DataTableErrorCode } from "./base";
import { ErrorSeverity, maxSeverity, SEVERITY_ORDER } from "./severity";

// ─── AGGREGATE ERROR CLASS ────────────────────────────────────────────────────

/**
 * Aggregates multiple DataTable errors into a single error.
 * Useful for batch validation where multiple issues can occur.
 *
 * The aggregate error's severity is the maximum severity of all contained errors.
 *
 * @example
 * ```ts
 * const errors = [
 *   new DuplicateColumnKeyError("id"),
 *   new MissingColumnAccessorError("name"),
 * ];
 *
 * const aggregate = new AggregateDataTableError(errors, "Column validation failed");
 * console.log(aggregate.errorCount); // 2
 * console.log(aggregate.severity); // ErrorSeverity.CRITICAL
 * ```
 */
export class AggregateDataTableError extends DataTableError {
  /** All contained errors */
  public readonly errors: DataTableError[];

  /** Number of contained errors */
  public readonly errorCount: number;

  constructor(errors: DataTableError[], message?: string) {
    const count = errors.length;
    const defaultMessage = `${count} error${count === 1 ? "" : "s"} occurred`;

    super(message ?? defaultMessage, DataTableErrorCode.INVALID_CONFIG, {
      context: {
        errorCount: count,
        errorCodes: errors.map((e) => e.code),
        errorMessages: errors.map((e) => e.message),
      },
    });

    this.name = "AggregateDataTableError";
    this.errors = errors;
    this.errorCount = count;

    // Severity is the maximum of all contained errors
    this.severity = this.calculateMaxSeverity();
  }

  /**
   * Calculate the maximum severity from all contained errors.
   */
  private calculateMaxSeverity(): ErrorSeverity {
    if (this.errors.length === 0) {
      return ErrorSeverity.ERROR;
    }

    const firstError = this.errors[0];
    if (!firstError) {
      return ErrorSeverity.ERROR;
    }

    let maxSev = firstError.severity;
    for (let i = 1; i < this.errors.length; i++) {
      const error = this.errors[i];
      if (error) {
        maxSev = maxSeverity(maxSev, error.severity);
      }
    }
    return maxSev;
  }

  /**
   * Get errors filtered by severity level.
   */
  getErrorsBySeverity(severity: ErrorSeverity): DataTableError[] {
    return this.errors.filter((e) => e.severity === severity);
  }

  /**
   * Get errors filtered by error code.
   */
  getErrorsByCode(code: string): DataTableError[] {
    return this.errors.filter((e) => e.code === code);
  }

  /**
   * Check if any error has a specific code.
   */
  hasErrorCode(code: string): boolean {
    return this.errors.some((e) => e.code === code);
  }

  /**
   * Check if any error has a specific severity.
   */
  hasSeverity(severity: ErrorSeverity): boolean {
    return this.errors.some((e) => e.severity === severity);
  }

  /**
   * Check if any error is fatal.
   */
  hasFatalError(): boolean {
    return this.hasSeverity(ErrorSeverity.FATAL);
  }

  /**
   * Check if any error is critical or fatal.
   */
  hasCriticalError(): boolean {
    return (
      this.hasSeverity(ErrorSeverity.CRITICAL) ||
      this.hasSeverity(ErrorSeverity.FATAL)
    );
  }

  /**
   * Get count of errors by severity.
   */
  getCountBySeverity(): Record<ErrorSeverity, number> {
    const counts: Record<ErrorSeverity, number> = {
      [ErrorSeverity.WARNING]: 0,
      [ErrorSeverity.ERROR]: 0,
      [ErrorSeverity.CRITICAL]: 0,
      [ErrorSeverity.FATAL]: 0,
    };

    for (const error of this.errors) {
      counts[error.severity]++;
    }

    return counts;
  }

  /**
   * Returns a formatted string with all errors listed.
   */
  toFormattedString(): string {
    const lines = [`[AGGREGATE] ${this.message}:`];
    for (const error of this.errors) {
      lines.push(`  - ${error.toFormattedString()}`);
    }
    return lines.join("\n");
  }

  /**
   * Returns all errors as a JSON object.
   */
  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      errorCount: this.errorCount,
      errors: this.errors.map((e) => e.toJSON()),
      countBySeverity: this.getCountBySeverity(),
    };
  }

  /**
   * Iterate over contained errors.
   */
  [Symbol.iterator](): Iterator<DataTableError> {
    return this.errors[Symbol.iterator]();
  }
}

// ─── ERROR COLLECTOR ──────────────────────────────────────────────────────────

/**
 * Utility class for collecting errors during validation.
 * Provides a fluent API for building aggregate errors.
 *
 * @example
 * ```ts
 * const collector = new ErrorCollector();
 *
 * if (isDuplicate) {
 *   collector.add(new DuplicateColumnKeyError(key));
 * }
 *
 * if (isMissing) {
 *   collector.add(new MissingColumnAccessorError(key));
 * }
 *
 * // Throw if any errors were collected
 * collector.throwIfErrors("Column validation failed");
 *
 * // Or get the aggregate error
 * const aggregate = collector.toAggregateError("Validation failed");
 * if (aggregate) {
 *   errorHub.report(aggregate);
 * }
 * ```
 */
export class ErrorCollector {
  private errors: DataTableError[] = [];

  /**
   * Add an error to the collection.
   * @returns this for chaining
   */
  add(error: DataTableError): this {
    this.errors.push(error);
    return this;
  }

  /**
   * Add multiple errors to the collection.
   * @returns this for chaining
   */
  addAll(errors: DataTableError[]): this {
    this.errors.push(...errors);
    return this;
  }

  /**
   * Conditionally add an error.
   * @returns this for chaining
   */
  addIf(condition: boolean, error: DataTableError | (() => DataTableError)): this {
    if (condition) {
      this.errors.push(typeof error === "function" ? error() : error);
    }
    return this;
  }

  /**
   * Check if any errors were collected.
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Get the count of collected errors.
   */
  count(): number {
    return this.errors.length;
  }

  /**
   * Get all collected errors.
   */
  getErrors(): DataTableError[] {
    return [...this.errors];
  }

  /**
   * Get the first error, or undefined if empty.
   */
  getFirstError(): DataTableError | undefined {
    return this.errors[0];
  }

  /**
   * Clear all collected errors.
   * @returns this for chaining
   */
  clear(): this {
    this.errors = [];
    return this;
  }

  /**
   * Throw an aggregate error if any errors were collected.
   * Does nothing if no errors were collected.
   *
   * @throws AggregateDataTableError if errors exist
   */
  throwIfErrors(message?: string): void {
    if (this.errors.length > 0) {
      throw new AggregateDataTableError(this.errors, message);
    }
  }

  /**
   * Return an aggregate error if any errors were collected.
   * Returns null if no errors were collected.
   */
  toAggregateError(message?: string): AggregateDataTableError | null {
    if (this.errors.length === 0) {
      return null;
    }
    return new AggregateDataTableError(this.errors, message);
  }

  /**
   * Get the maximum severity of all collected errors.
   * Returns ErrorSeverity.WARNING if no errors.
   */
  getMaxSeverity(): ErrorSeverity {
    if (this.errors.length === 0) {
      return ErrorSeverity.WARNING;
    }

    const firstError = this.errors[0];
    if (!firstError) {
      return ErrorSeverity.WARNING;
    }

    let max = firstError.severity;
    for (let i = 1; i < this.errors.length; i++) {
      const error = this.errors[i];
      if (error) {
        max = maxSeverity(max, error.severity);
      }
    }
    return max;
  }

  /**
   * Check if any collected error is at or above a severity threshold.
   */
  hasSeverityAtLeast(minSeverity: ErrorSeverity): boolean {
    const minIndex = SEVERITY_ORDER.indexOf(minSeverity);
    return this.errors.some(
      (e) => SEVERITY_ORDER.indexOf(e.severity) >= minIndex
    );
  }
}

// ─── UTILITY FUNCTIONS ────────────────────────────────────────────────────────

/**
 * Create an aggregate error from multiple errors.
 * Returns null if the errors array is empty.
 */
export function aggregateErrors(
  errors: DataTableError[],
  message?: string
): AggregateDataTableError | null {
  if (errors.length === 0) {
    return null;
  }
  return new AggregateDataTableError(errors, message);
}

/**
 * Flatten nested aggregate errors into a single array.
 */
export function flattenErrors(error: DataTableError): DataTableError[] {
  if (error instanceof AggregateDataTableError) {
    return error.errors.flatMap(flattenErrors);
  }
  return [error];
}

/**
 * Check if an error is an aggregate error.
 */
export function isAggregateError(
  error: unknown
): error is AggregateDataTableError {
  return error instanceof AggregateDataTableError;
}
