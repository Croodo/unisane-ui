"use client";

import { useCallback, useRef, useEffect } from "react";

/**
 * Factory hook for managing controlled/uncontrolled state pattern.
 * Reduces code duplication across selection, sorting, and filtering hooks.
 *
 * @template T - The type of the state value
 * @param options - Configuration options
 * @returns State value and setter with proper controlled/uncontrolled handling
 *
 * @example
 * ```tsx
 * const { value, setValue, isControlled } = useControlledState({
 *   internalValue: state.sortState,
 *   externalValue: controlled.sortState,
 *   onChange: onSortChange,
 *   dispatch: (newValue) => dispatch({ type: "SET_SORT", sortState: newValue }),
 * });
 * ```
 */
export interface UseControlledStateOptions<T> {
  /** Internal state value from reducer */
  internalValue: T;
  /** External controlled value (undefined = uncontrolled) */
  externalValue: T | undefined;
  /** Callback to notify parent of changes */
  onChange?: (value: T) => void;
  /** Dispatch action to update internal state (for uncontrolled mode) */
  dispatch: (value: T) => void;
  /** Optional comparator for detecting changes (defaults to reference equality) */
  isEqual?: (a: T, b: T) => boolean;
}

export interface UseControlledStateReturn<T> {
  /** Current value (external if controlled, internal if uncontrolled) */
  value: T;
  /** Set value with proper controlled/uncontrolled handling */
  setValue: (newValue: T) => void;
  /** Whether the state is controlled externally */
  isControlled: boolean;
}

/**
 * Hook that abstracts the controlled/uncontrolled state pattern.
 * Handles both modes transparently and fires callbacks appropriately.
 */
export function useControlledState<T>({
  internalValue,
  externalValue,
  onChange,
  dispatch,
  isEqual = (a, b) => a === b,
}: UseControlledStateOptions<T>): UseControlledStateReturn<T> {
  const isControlled = externalValue !== undefined;

  // Get the current value based on mode
  const value = isControlled ? externalValue : internalValue;

  // Track previous value for change detection in uncontrolled mode
  const prevValueRef = useRef<T>(value);
  const isInitialMount = useRef(true);

  // Fire onChange callback when uncontrolled value changes
  useEffect(() => {
    // Skip initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevValueRef.current = value;
      return;
    }

    // Only fire callback in uncontrolled mode when value changes
    if (!isControlled && !isEqual(prevValueRef.current, value)) {
      prevValueRef.current = value;
      onChange?.(value);
    }
  }, [value, isControlled, onChange, isEqual]);

  // Setter that handles both modes
  const setValue = useCallback(
    (newValue: T) => {
      if (isControlled) {
        // Controlled mode: just notify parent
        onChange?.(newValue);
      } else {
        // Uncontrolled mode: update internal state
        // Callback will be fired by the useEffect above
        dispatch(newValue);
      }
    },
    [isControlled, onChange, dispatch]
  );

  return {
    value,
    setValue,
    isControlled,
  };
}

/**
 * Specialized version for Set-based state (like selection)
 */
export interface UseControlledSetOptions {
  /** Internal state value from reducer */
  internalValue: Set<string>;
  /** External controlled value (undefined = uncontrolled) */
  externalValue: string[] | undefined;
  /** Callback to notify parent of changes */
  onChange?: (value: string[]) => void;
  /** Dispatch action to update internal state */
  dispatch: (ids: string[]) => void;
}

export interface UseControlledSetReturn {
  /** Current value as Set */
  value: Set<string>;
  /** Current value as Array */
  valueArray: string[];
  /** Set value with proper controlled/uncontrolled handling */
  setValue: (ids: string[]) => void;
  /** Whether the state is controlled externally */
  isControlled: boolean;
}

/**
 * Hook for controlled/uncontrolled Set state (like row selection)
 */
export function useControlledSet({
  internalValue,
  externalValue,
  onChange,
  dispatch,
}: UseControlledSetOptions): UseControlledSetReturn {
  const isControlled = externalValue !== undefined;

  // Get the current value based on mode
  const value = isControlled ? new Set(externalValue) : internalValue;
  const valueArray = isControlled ? externalValue : Array.from(internalValue);

  // Track previous value for change detection
  const prevValueRef = useRef<Set<string>>(value);
  const isInitialMount = useRef(true);

  // Fire onChange callback when uncontrolled value changes
  useEffect(() => {
    // Skip initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevValueRef.current = value;
      return;
    }

    // Only fire callback in uncontrolled mode when value changes
    if (!isControlled) {
      const prev = prevValueRef.current;
      const hasChanged =
        prev.size !== value.size || [...value].some((id) => !prev.has(id));

      if (hasChanged) {
        prevValueRef.current = value;
        onChange?.(Array.from(value));
      }
    }
  }, [value, isControlled, onChange]);

  // Setter that handles both modes
  const setValue = useCallback(
    (ids: string[]) => {
      if (isControlled) {
        // Controlled mode: just notify parent
        onChange?.(ids);
      } else {
        // Uncontrolled mode: update internal state
        dispatch(ids);
      }
    },
    [isControlled, onChange, dispatch]
  );

  return {
    value,
    valueArray,
    setValue,
    isControlled,
  };
}
