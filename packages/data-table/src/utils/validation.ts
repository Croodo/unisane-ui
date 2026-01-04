// ─── VALIDATION UTILITIES ─────────────────────────────────────────────────────
// Column and data validation utilities for DataTable.
// Runs in both development and production for consistent behavior.

import type { Column, ColumnGroup } from "../types/column";
import { isColumnGroup } from "../types/column";
import { DataTableError } from "../errors/base";
import { ErrorCollector, AggregateDataTableError } from "../errors/aggregate-error";
import {
  DuplicateColumnKeyError,
  InvalidColumnKeyError,
  MissingColumnAccessorError,
} from "../errors/column-errors";

// ─── TYPES ────────────────────────────────────────────────────────────────────

/**
 * Result of column validation.
 */
export interface ValidationResult {
  /** Whether validation passed (no errors) */
  valid: boolean;
  /** Array of validation errors */
  errors: DataTableError[];
  /** Number of columns validated */
  columnCount: number;
  /** Array of warning messages (non-blocking) */
  warnings: string[];
}

/**
 * Options for column validation.
 */
export interface ValidateColumnsOptions {
  /**
   * Throw on first error instead of collecting all.
   * @default false
   */
  throwOnFirst?: boolean;

  /**
   * Whether to include warnings for non-critical issues.
   * @default true
   */
  includeWarnings?: boolean;

  /**
   * Skip validation of accessor (for columns with cell renderer only).
   * @default false
   */
  skipAccessorValidation?: boolean;
}

// ─── COLUMN VALIDATION ────────────────────────────────────────────────────────

/**
 * Validate column configuration.
 * Checks for duplicate keys, invalid keys, and missing accessors.
 *
 * Runs in both development and production for consistent error handling.
 *
 * @param columns - Array of columns or column groups to validate
 * @param options - Validation options
 * @returns Validation result with errors and warnings
 *
 * @example
 * ```ts
 * const result = validateColumns(columns);
 *
 * if (!result.valid) {
 *   console.error("Column validation failed:", result.errors);
 *   // Or report to error hub
 *   const aggregate = new AggregateDataTableError(result.errors);
 *   errorHub.report(aggregate);
 * }
 * ```
 */
export function validateColumns<T>(
  columns: Array<Column<T> | ColumnGroup<T>>,
  options: ValidateColumnsOptions = {}
): ValidationResult {
  const collector = new ErrorCollector();
  const warnings: string[] = [];
  const seenKeys = new Set<string>();
  let columnCount = 0;

  function validateColumn(col: Column<T> | ColumnGroup<T>, path: string): void {
    // Handle column groups recursively
    if (isColumnGroup(col)) {
      col.children.forEach((child, index) => {
        validateColumn(child, `${path}[${index}]`);
      });
      return;
    }

    columnCount++;

    // Check for empty/invalid key
    if (!col.key || typeof col.key !== "string") {
      const error = new InvalidColumnKeyError(String(col.key ?? "undefined"));
      if (options.throwOnFirst) throw error;
      collector.add(error);
      return; // Can't continue validation without valid key
    }

    // Check for empty string key
    if (col.key.trim() === "") {
      const error = new InvalidColumnKeyError("(empty string)");
      if (options.throwOnFirst) throw error;
      collector.add(error);
      return;
    }

    // Check for duplicate key
    if (seenKeys.has(col.key)) {
      const error = new DuplicateColumnKeyError(col.key);
      if (options.throwOnFirst) throw error;
      collector.add(error);
    } else {
      seenKeys.add(col.key);
    }

    // Check for missing accessor (unless cell renderer is provided)
    if (!options.skipAccessorValidation) {
      // For Column<T>, the key can be used as accessor (via dot notation)
      // A column needs either a key that maps to data, or a custom render function
      const hasKey = col.key !== undefined;
      const hasRenderer = col.render !== undefined;

      if (!hasKey && !hasRenderer) {
        const error = new MissingColumnAccessorError(String(col.key ?? "unknown"));
        if (options.throwOnFirst) throw error;
        collector.add(error);
      }
    }

    // Warnings (non-blocking issues)
    if (options.includeWarnings !== false) {
      // Warn about missing header
      if (!col.header && !col.headerRender) {
        warnings.push(
          `Column "${String(col.key)}" has no header defined. Consider adding a header for accessibility.`
        );
      }

      // Warn about very wide columns (only for numeric widths)
      const numericWidth = typeof col.width === "number" ? col.width : null;
      if (numericWidth && numericWidth > 500) {
        warnings.push(
          `Column "${String(col.key)}" has a very wide width (${numericWidth}px). Consider if this is intentional.`
        );
      }

      // Warn about negative widths
      if (numericWidth && numericWidth < 0) {
        warnings.push(
          `Column "${String(col.key)}" has a negative width. This will be treated as auto width.`
        );
      }
    }
  }

  // Validate all columns
  columns.forEach((col, index) => {
    validateColumn(col, `columns[${index}]`);
  });

  return {
    valid: !collector.hasErrors(),
    errors: collector.getErrors(),
    columnCount,
    warnings,
  };
}

/**
 * Validate columns and throw if invalid.
 * Use this for strict validation that should stop rendering.
 *
 * @param columns - Columns to validate
 * @throws AggregateDataTableError if validation fails
 *
 * @example
 * ```ts
 * try {
 *   assertValidColumns(columns);
 * } catch (error) {
 *   if (error instanceof AggregateDataTableError) {
 *     console.error(`${error.errorCount} column errors found`);
 *   }
 *   throw error;
 * }
 * ```
 */
export function assertValidColumns<T>(
  columns: Array<Column<T> | ColumnGroup<T>>
): void {
  const result = validateColumns(columns);
  if (!result.valid) {
    throw new AggregateDataTableError(
      result.errors,
      `Invalid column configuration: ${result.errors.length} error(s) found`
    );
  }
}

// ─── KEY VALIDATION ───────────────────────────────────────────────────────────

/**
 * Check if a column key is valid.
 * Valid keys are non-empty strings that don't contain reserved characters.
 */
export function isValidColumnKey(key: unknown): key is string {
  if (typeof key !== "string") return false;
  if (key.trim() === "") return false;
  // Reserved characters that might cause issues
  if (key.includes("||")) return false; // Cell ID separator
  return true;
}

/**
 * Find duplicate column keys in an array of columns.
 *
 * @param columns - Columns to check
 * @returns Array of duplicate keys (empty if no duplicates)
 */
export function findDuplicateColumnKeys<T>(
  columns: Array<Column<T> | ColumnGroup<T>>
): string[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];

  function checkColumn(col: Column<T> | ColumnGroup<T>): void {
    if (isColumnGroup(col)) {
      col.children.forEach(checkColumn);
      return;
    }

    if (typeof col.key === "string") {
      if (seen.has(col.key)) {
        if (!duplicates.includes(col.key)) {
          duplicates.push(col.key);
        }
      } else {
        seen.add(col.key);
      }
    }
  }

  columns.forEach(checkColumn);
  return duplicates;
}

/**
 * Get all column keys from an array of columns (including nested groups).
 */
export function getAllColumnKeys<T>(
  columns: Array<Column<T> | ColumnGroup<T>>
): string[] {
  const keys: string[] = [];

  function extractKeys(col: Column<T> | ColumnGroup<T>): void {
    if (isColumnGroup(col)) {
      col.children.forEach(extractKeys);
    } else if (typeof col.key === "string") {
      keys.push(col.key);
    }
  }

  columns.forEach(extractKeys);
  return keys;
}

// ─── DATA VALIDATION ──────────────────────────────────────────────────────────

/**
 * Validate that all rows have unique IDs.
 *
 * @param data - Array of data rows
 * @param idKey - Key to use for ID (default: "id")
 * @returns Validation result
 */
export function validateRowIds<T extends Record<string, unknown>>(
  data: T[],
  idKey: string = "id"
): { valid: boolean; duplicates: string[]; missing: number[] } {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const missing: number[] = [];

  data.forEach((row, index) => {
    const id = row[idKey];

    if (id === undefined || id === null || id === "") {
      missing.push(index);
    } else {
      const idStr = String(id);
      if (seen.has(idStr)) {
        if (!duplicates.includes(idStr)) {
          duplicates.push(idStr);
        }
      } else {
        seen.add(idStr);
      }
    }
  });

  return {
    valid: duplicates.length === 0 && missing.length === 0,
    duplicates,
    missing,
  };
}
