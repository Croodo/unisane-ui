// ─── CONTROLLED STATE DESYNC WARNINGS ──────────────────────────────────────
// Utilities for detecting and warning about controlled state inconsistencies.
// Helps developers catch issues where external state doesn't match callbacks.

import type { MultiSortState, FilterState, PinPosition } from "../types/core";
import type { ControlledStateConfig } from "../types/config";
import { DataTableError, DataTableErrorCode } from "../errors/base";
import { ErrorSeverity } from "../errors/severity";
import type { ErrorHub } from "../errors/error-hub";

// ─── TYPES ────────────────────────────────────────────────────────────────────

/**
 * Types of controlled state that can be monitored.
 */
export type ControlledStateType =
  | "selection"
  | "sort"
  | "filter"
  | "search"
  | "columnPin"
  | "columnOrder";

/**
 * Desync warning information.
 */
export interface DesyncWarning {
  /** Type of state that desynced */
  stateType: ControlledStateType;
  /** The expected value (from callback) */
  expected: unknown;
  /** The actual value (from props) */
  actual: unknown;
  /** Human-readable description */
  message: string;
  /** Timestamp when the desync was detected */
  timestamp: Date;
}

/**
 * Options for the desync detector.
 */
export interface DesyncDetectorOptions {
  /** Error hub to report warnings to */
  errorHub?: ErrorHub;
  /** Callback when desync is detected */
  onDesync?: (warning: DesyncWarning) => void;
  /** Throttle warnings (ms) to avoid spam */
  throttleMs?: number;
  /** State types to monitor (default: all) */
  monitorTypes?: ControlledStateType[];
  /** Log warnings to console in development */
  consoleWarnings?: boolean;
}

// ─── DESYNC DETECTOR CLASS ────────────────────────────────────────────────────

/**
 * Detects and warns about controlled state desyncs.
 *
 * A desync occurs when:
 * 1. User performs an action (e.g., sorts a column)
 * 2. Callback is fired with new state (e.g., onSortChange)
 * 3. But the controlled prop doesn't update to match
 *
 * This is usually a bug where the developer forgot to update state in the callback.
 *
 * @example
 * ```ts
 * const detector = new DesyncDetector({
 *   errorHub,
 *   onDesync: (warning) => {
 *     console.warn(`Desync detected: ${warning.message}`);
 *   },
 * });
 *
 * // In sort handler
 * detector.expectSortChange(newSortState);
 *
 * // In useEffect after props update
 * useEffect(() => {
 *   detector.verifySortState(sortState);
 * }, [sortState]);
 * ```
 */
export class DesyncDetector {
  private options: Required<DesyncDetectorOptions>;
  private expectations: Map<ControlledStateType, {
    value: unknown;
    timestamp: number;
  }> = new Map();
  private lastWarningTime: Map<ControlledStateType, number> = new Map();
  private warnings: DesyncWarning[] = [];

  constructor(options: DesyncDetectorOptions = {}) {
    this.options = {
      errorHub: options.errorHub ?? null!,
      onDesync: options.onDesync ?? (() => {}),
      throttleMs: options.throttleMs ?? 100,
      monitorTypes: options.monitorTypes ?? [
        "selection",
        "sort",
        "filter",
        "search",
        "columnPin",
        "columnOrder",
      ],
      consoleWarnings: options.consoleWarnings ?? process.env.NODE_ENV !== "production",
    };
  }

  // ─── EXPECTATION SETTERS ───────────────────────────────────────────────────

  /**
   * Set expectation for selection state change.
   * Call this in onSelectionChange callback.
   */
  expectSelectionChange(expectedIds: string[]): void {
    this.setExpectation("selection", expectedIds);
  }

  /**
   * Set expectation for sort state change.
   * Call this in onSortChange callback.
   */
  expectSortChange(expectedSort: MultiSortState): void {
    this.setExpectation("sort", expectedSort);
  }

  /**
   * Set expectation for filter state change.
   * Call this in onFilterChange callback.
   */
  expectFilterChange(expectedFilters: FilterState): void {
    this.setExpectation("filter", expectedFilters);
  }

  /**
   * Set expectation for search state change.
   * Call this in onSearchChange callback.
   */
  expectSearchChange(expectedSearch: string): void {
    this.setExpectation("search", expectedSearch);
  }

  /**
   * Set expectation for column pin state change.
   * Call this in onColumnPinChange callback.
   */
  expectColumnPinChange(expectedPins: Record<string, PinPosition>): void {
    this.setExpectation("columnPin", expectedPins);
  }

  /**
   * Set expectation for column order change.
   * Call this in onColumnOrderChange callback.
   */
  expectColumnOrderChange(expectedOrder: string[]): void {
    this.setExpectation("columnOrder", expectedOrder);
  }

  // ─── VERIFICATION METHODS ───────────────────────────────────────────────────

  /**
   * Verify that selection state matches expectation.
   * Call this after controlled props update.
   */
  verifySelectionState(actualIds: string[] | undefined): void {
    this.verifyState("selection", actualIds, (expected, actual) => {
      const expectedSet = new Set(expected as string[]);
      const actualSet = new Set(actual as string[] ?? []);
      return expectedSet.size === actualSet.size &&
        [...expectedSet].every((id) => actualSet.has(id));
    });
  }

  /**
   * Verify that sort state matches expectation.
   */
  verifySortState(actualSort: MultiSortState | undefined): void {
    this.verifyState("sort", actualSort, (expected, actual) => {
      return JSON.stringify(expected) === JSON.stringify(actual ?? []);
    });
  }

  /**
   * Verify that filter state matches expectation.
   */
  verifyFilterState(actualFilters: FilterState | undefined): void {
    this.verifyState("filter", actualFilters, (expected, actual) => {
      return JSON.stringify(expected) === JSON.stringify(actual ?? {});
    });
  }

  /**
   * Verify that search state matches expectation.
   */
  verifySearchState(actualSearch: string | undefined): void {
    this.verifyState("search", actualSearch, (expected, actual) => {
      return expected === (actual ?? "");
    });
  }

  /**
   * Verify that column pin state matches expectation.
   */
  verifyColumnPinState(actualPins: Record<string, PinPosition> | undefined): void {
    this.verifyState("columnPin", actualPins, (expected, actual) => {
      return JSON.stringify(expected) === JSON.stringify(actual ?? {});
    });
  }

  /**
   * Verify that column order matches expectation.
   */
  verifyColumnOrderState(actualOrder: string[] | undefined): void {
    this.verifyState("columnOrder", actualOrder, (expected, actual) => {
      const exp = expected as string[];
      const act = actual as string[] ?? [];
      return exp.length === act.length && exp.every((key, i) => key === act[i]);
    });
  }

  /**
   * Verify all controlled state at once.
   */
  verifyAllState(controlled: ControlledStateConfig | undefined): void {
    if (!controlled) return;

    if (controlled.selectedIds !== undefined) {
      this.verifySelectionState(controlled.selectedIds);
    }
    if (controlled.sortState !== undefined) {
      this.verifySortState(controlled.sortState);
    }
    if (controlled.filters !== undefined) {
      this.verifyFilterState(controlled.filters);
    }
    if (controlled.searchValue !== undefined) {
      this.verifySearchState(controlled.searchValue);
    }
    if (controlled.columnPinState !== undefined) {
      this.verifyColumnPinState(controlled.columnPinState);
    }
    if (controlled.columnOrder !== undefined) {
      this.verifyColumnOrderState(controlled.columnOrder);
    }
  }

  // ─── UTILITY METHODS ───────────────────────────────────────────────────────

  /**
   * Get all recorded warnings.
   */
  getWarnings(): DesyncWarning[] {
    return [...this.warnings];
  }

  /**
   * Clear recorded warnings.
   */
  clearWarnings(): void {
    this.warnings = [];
  }

  /**
   * Clear all expectations.
   */
  clearExpectations(): void {
    this.expectations.clear();
  }

  // ─── PRIVATE METHODS ────────────────────────────────────────────────────────

  private setExpectation(type: ControlledStateType, value: unknown): void {
    if (!this.options.monitorTypes.includes(type)) return;

    this.expectations.set(type, {
      value,
      timestamp: Date.now(),
    });
  }

  private verifyState(
    type: ControlledStateType,
    actual: unknown,
    compare: (expected: unknown, actual: unknown) => boolean
  ): void {
    if (!this.options.monitorTypes.includes(type)) return;

    const expectation = this.expectations.get(type);
    if (!expectation) return;

    // Check if expectation is still fresh (within throttle window)
    const age = Date.now() - expectation.timestamp;
    if (age > this.options.throttleMs * 5) {
      // Expectation is stale, clear it
      this.expectations.delete(type);
      return;
    }

    // Compare values
    if (!compare(expectation.value, actual)) {
      this.reportDesync(type, expectation.value, actual);
    } else {
      // Match found, clear expectation
      this.expectations.delete(type);
    }
  }

  private reportDesync(
    type: ControlledStateType,
    expected: unknown,
    actual: unknown
  ): void {
    // Throttle warnings per type
    const lastWarning = this.lastWarningTime.get(type) ?? 0;
    const now = Date.now();
    if (now - lastWarning < this.options.throttleMs) {
      return;
    }
    this.lastWarningTime.set(type, now);

    const warning: DesyncWarning = {
      stateType: type,
      expected,
      actual,
      message: this.formatWarningMessage(type, expected, actual),
      timestamp: new Date(),
    };

    this.warnings.push(warning);

    // Console warning in development
    if (this.options.consoleWarnings) {
      console.warn(
        `[DataTable] Controlled state desync detected for "${type}".\n` +
        `Expected: ${JSON.stringify(expected)}\n` +
        `Actual: ${JSON.stringify(actual)}\n` +
        `This usually means you forgot to update state in your callback handler.`
      );
    }

    // Callback
    this.options.onDesync(warning);

    // Report to error hub if available
    if (this.options.errorHub) {
      const error = new DataTableError(
        `Controlled state desync: ${type} state doesn't match expected value`,
        DataTableErrorCode.INCOMPATIBLE_OPTIONS,
        {
          severity: ErrorSeverity.WARNING,
          context: {
            stateType: type,
            expected: typeof expected === "object" ? JSON.stringify(expected) : expected,
            actual: typeof actual === "object" ? JSON.stringify(actual) : actual,
          },
        }
      );
      this.options.errorHub.report(error);
    }
  }

  private formatWarningMessage(
    type: ControlledStateType,
    expected: unknown,
    actual: unknown
  ): string {
    const typeLabels: Record<ControlledStateType, string> = {
      selection: "Row selection",
      sort: "Sort state",
      filter: "Filter state",
      search: "Search value",
      columnPin: "Column pin state",
      columnOrder: "Column order",
    };

    return (
      `${typeLabels[type]} doesn't match expected value. ` +
      `Expected: ${JSON.stringify(expected)}, ` +
      `Actual: ${JSON.stringify(actual)}`
    );
  }
}

// ─── HOOK HELPER ─────────────────────────────────────────────────────────────

/**
 * Create a desync detector for use in hooks.
 *
 * @example
 * ```ts
 * const detector = useMemo(
 *   () => createDesyncDetector({ errorHub }),
 *   [errorHub]
 * );
 *
 * const handleSortChange = useCallback((sort: MultiSortState) => {
 *   detector.expectSortChange(sort);
 *   onSortChange?.(sort);
 * }, [onSortChange, detector]);
 *
 * useEffect(() => {
 *   detector.verifySortState(controlled?.sortState);
 * }, [controlled?.sortState, detector]);
 * ```
 */
export function createDesyncDetector(
  options: DesyncDetectorOptions = {}
): DesyncDetector {
  return new DesyncDetector(options);
}

// ─── SIMPLE WARNING FUNCTION ─────────────────────────────────────────────────

/**
 * Simple function to warn about controlled state issues.
 * Use this for one-off checks without the full detector.
 *
 * @example
 * ```ts
 * // In your component
 * if (process.env.NODE_ENV !== "production") {
 *   warnControlledDesync(
 *     "sort",
 *     expectedSort,
 *     actualSort,
 *     errorHub
 *   );
 * }
 * ```
 */
export function warnControlledDesync(
  stateType: ControlledStateType,
  expected: unknown,
  actual: unknown,
  errorHub?: ErrorHub
): void {
  if (process.env.NODE_ENV === "production") return;
  if (JSON.stringify(expected) === JSON.stringify(actual)) return;

  console.warn(
    `[DataTable] Controlled "${stateType}" state mismatch.\n` +
    `Expected: ${JSON.stringify(expected)}\n` +
    `Received: ${JSON.stringify(actual)}\n` +
    `Make sure to update your state in the callback handler.`
  );

  if (errorHub) {
    const error = new DataTableError(
      `Controlled ${stateType} state mismatch`,
      DataTableErrorCode.INCOMPATIBLE_OPTIONS,
      {
        severity: ErrorSeverity.WARNING,
        context: { stateType, expected, actual },
      }
    );
    errorHub.report(error);
  }
}
