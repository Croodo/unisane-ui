// ─── USE ERROR HUB HOOK ───────────────────────────────────────────────────────
// React hook for accessing the ErrorHub and error state.

import { useContext, useEffect, useState, useCallback, useMemo } from "react";
import { DataTableError } from "../errors/base";
import { ErrorSeverity } from "../errors/severity";
import {
  ErrorHub,
  ErrorHubState,
  getErrorHub,
} from "../errors/error-hub";

// ─── TYPES ────────────────────────────────────────────────────────────────────

/**
 * Return type for the useErrorHub hook.
 */
export interface UseErrorHubReturn {
  /** Current error state */
  state: ErrorHubState;

  /** All stored errors */
  errors: DataTableError[];

  /** Most recent error */
  lastError: DataTableError | null;

  /** Whether any errors exist */
  hasErrors: boolean;

  /** Whether any fatal errors exist */
  hasFatalError: boolean;

  /** Whether any critical or fatal errors exist */
  hasCriticalError: boolean;

  /** Count of errors by severity */
  countBySeverity: Record<ErrorSeverity, number>;

  /** Clear all errors */
  clearErrors: () => void;

  /** Clear errors by severity level */
  clearErrorsBySeverity: (severity: ErrorSeverity) => void;

  /** Clear errors by error code */
  clearErrorsByCode: (code: string) => void;

  /** Get errors filtered by code */
  getErrorsByCode: (code: string) => DataTableError[];

  /** Get errors filtered by severity */
  getErrorsBySeverity: (severity: ErrorSeverity) => DataTableError[];

  /** Report a new error to the hub */
  reportError: (error: DataTableError) => void;

  /** The ErrorHub instance */
  errorHub: ErrorHub;
}

/**
 * Options for the useErrorHub hook.
 */
export interface UseErrorHubOptions {
  /**
   * Custom ErrorHub instance to use.
   * If not provided, uses the default singleton.
   */
  errorHub?: ErrorHub;

  /**
   * Callback when a new error is reported.
   */
  onError?: (error: DataTableError) => void;

  /**
   * Filter errors by minimum severity.
   * Only errors at or above this level will be tracked.
   */
  minSeverity?: ErrorSeverity;
}

// ─── MAIN HOOK ────────────────────────────────────────────────────────────────

/**
 * Hook to access the ErrorHub and error state.
 *
 * Provides reactive access to the error state, allowing components
 * to respond to errors as they occur.
 *
 * @example
 * ```tsx
 * function ErrorDisplay() {
 *   const { hasErrors, lastError, clearErrors } = useErrorHub();
 *
 *   if (!hasErrors) return null;
 *
 *   return (
 *     <div>
 *       <p>Error: {lastError?.message}</p>
 *       <button onClick={clearErrors}>Dismiss</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With custom error hub
 * function TableWithErrors() {
 *   const customHub = useMemo(() => createErrorHub({ maxErrors: 10 }), []);
 *   const { errors } = useErrorHub({ errorHub: customHub });
 *
 *   return <DataTable errorHub={customHub} />;
 * }
 * ```
 */
export function useErrorHub(options: UseErrorHubOptions = {}): UseErrorHubReturn {
  const { errorHub: customHub, onError, minSeverity } = options;

  // Use provided hub or default singleton
  const errorHub = useMemo(() => customHub ?? getErrorHub(), [customHub]);

  // Track error state
  const [state, setState] = useState<ErrorHubState>(() => errorHub.getState());

  // Subscribe to error changes
  useEffect(() => {
    const updateState = () => {
      setState(errorHub.getState());
    };

    // Initial state
    updateState();

    // Subscribe to new errors
    const unsubscribe = errorHub.subscribe((error) => {
      // Check minimum severity filter
      if (minSeverity && !error.isAtLeast(minSeverity)) {
        return;
      }

      // Update state
      updateState();

      // Call custom handler
      onError?.(error);
    });

    return unsubscribe;
  }, [errorHub, onError, minSeverity]);

  // Memoized actions
  const clearErrors = useCallback(() => {
    errorHub.clearErrors();
    setState(errorHub.getState());
  }, [errorHub]);

  const clearErrorsBySeverity = useCallback(
    (severity: ErrorSeverity) => {
      errorHub.clearErrorsBySeverity(severity);
      setState(errorHub.getState());
    },
    [errorHub]
  );

  const clearErrorsByCode = useCallback(
    (code: string) => {
      errorHub.clearErrorsByCode(code);
      setState(errorHub.getState());
    },
    [errorHub]
  );

  const getErrorsByCode = useCallback(
    (code: string) => {
      return errorHub.getErrorsByCode(code);
    },
    [errorHub]
  );

  const getErrorsBySeverity = useCallback(
    (severity: ErrorSeverity) => {
      return errorHub.getErrorsBySeverity(severity);
    },
    [errorHub]
  );

  const reportError = useCallback(
    (error: DataTableError) => {
      errorHub.report(error);
    },
    [errorHub]
  );

  return {
    state,
    errors: state.errors,
    lastError: state.lastError,
    hasErrors: state.hasErrors,
    hasFatalError: state.hasFatalError,
    hasCriticalError: state.hasCriticalError,
    countBySeverity: state.countBySeverity,
    clearErrors,
    clearErrorsBySeverity,
    clearErrorsByCode,
    getErrorsByCode,
    getErrorsBySeverity,
    reportError,
    errorHub,
  };
}

// ─── LISTENER HOOK ────────────────────────────────────────────────────────────

/**
 * Hook to listen for specific error codes.
 *
 * @param codes - Error codes to listen for
 * @param handler - Callback when matching error occurs
 * @param options - Additional options
 *
 * @example
 * ```tsx
 * function FilterErrorHandler() {
 *   useErrorListener(["DT_506"], (error) => {
 *     toast.warning(`Filter failed: ${error.message}`);
 *   });
 *
 *   return null;
 * }
 * ```
 */
export function useErrorListener(
  codes: string[],
  handler: (error: DataTableError) => void,
  options: { errorHub?: ErrorHub } = {}
): void {
  const errorHub = options.errorHub ?? getErrorHub();

  useEffect(() => {
    const unsubscribe = errorHub.subscribe((error) => {
      if (codes.includes(error.code)) {
        handler(error);
      }
    });

    return unsubscribe;
  }, [errorHub, codes, handler]);
}

// ─── SEVERITY LISTENER HOOK ───────────────────────────────────────────────────

/**
 * Hook to listen for errors at or above a specific severity.
 *
 * @param minSeverity - Minimum severity to listen for
 * @param handler - Callback when matching error occurs
 * @param options - Additional options
 *
 * @example
 * ```tsx
 * function CriticalErrorHandler() {
 *   useSeverityListener(ErrorSeverity.CRITICAL, (error) => {
 *     showCriticalErrorModal(error);
 *   });
 *
 *   return null;
 * }
 * ```
 */
export function useSeverityListener(
  minSeverity: ErrorSeverity,
  handler: (error: DataTableError) => void,
  options: { errorHub?: ErrorHub } = {}
): void {
  const errorHub = options.errorHub ?? getErrorHub();

  useEffect(() => {
    const unsubscribe = errorHub.subscribe((error) => {
      if (error.isAtLeast(minSeverity)) {
        handler(error);
      }
    });

    return unsubscribe;
  }, [errorHub, minSeverity, handler]);
}

// ─── LAST ERROR HOOK ──────────────────────────────────────────────────────────

/**
 * Hook to track only the last error.
 * More lightweight than full useErrorHub when you only need the latest error.
 *
 * @param options - Additional options
 *
 * @example
 * ```tsx
 * function ErrorToast() {
 *   const { error, clear } = useLastError();
 *
 *   if (!error) return null;
 *
 *   return (
 *     <Toast onClose={clear}>
 *       {error.message}
 *     </Toast>
 *   );
 * }
 * ```
 */
export function useLastError(
  options: { errorHub?: ErrorHub; minSeverity?: ErrorSeverity } = {}
): {
  error: DataTableError | null;
  clear: () => void;
} {
  const errorHub = options.errorHub ?? getErrorHub();
  const [error, setError] = useState<DataTableError | null>(null);

  useEffect(() => {
    const unsubscribe = errorHub.subscribe((newError) => {
      if (options.minSeverity && !newError.isAtLeast(options.minSeverity)) {
        return;
      }
      setError(newError);
    });

    return unsubscribe;
  }, [errorHub, options.minSeverity]);

  const clear = useCallback(() => {
    setError(null);
  }, []);

  return { error, clear };
}
