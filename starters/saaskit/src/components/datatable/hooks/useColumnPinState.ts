import { useCallback, useEffect, useMemo, useState } from "react";

type PinDirection = "left" | "right" | null;

export interface UseColumnPinStateOptions {
  tableId?: string;
  externalPinState?: Record<string, PinDirection>;
  onPinChange?: (key: string, pin: PinDirection) => void;
  columnKeys: string[];
}

/**
 * Hook to manage column pin state with localStorage persistence.
 * Uses useMemo for initial state to avoid set-state-in-effect pattern.
 */
export function useColumnPinState({
  tableId,
  externalPinState,
  onPinChange,
  columnKeys,
}: UseColumnPinStateOptions) {
  // Load initial state from localStorage using useMemo (not useEffect + setState)
  const initialPinState = useMemo(() => {
    if (externalPinState || !tableId || typeof window === "undefined") {
      return {};
    }
    try {
      const saved = localStorage.getItem(`datatable-pins-${tableId}`);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, PinDirection>;
        // Filter to only include valid column keys
        const validKeys = new Set(columnKeys);
        const filtered: Record<string, PinDirection> = {};
        for (const [key, value] of Object.entries(parsed)) {
          if (validKeys.has(key)) {
            filtered[key] = value;
          }
        }
        return filtered;
      }
    } catch (e) {
      console.error("Failed to load pin state:", e);
    }
    return {};
  }, [tableId, externalPinState, columnKeys]);

  const [internalPinState, setInternalPinState] =
    useState<Record<string, PinDirection>>(initialPinState);

  // Use external state if provided, otherwise use internal
  const pinState = externalPinState ?? internalPinState;

  // Save to localStorage on change (this is fine - it's saving, not loading)
  useEffect(() => {
    if (!tableId || externalPinState) return;
    if (Object.keys(internalPinState).length > 0) {
      localStorage.setItem(
        `datatable-pins-${tableId}`,
        JSON.stringify(internalPinState)
      );
    } else {
      localStorage.removeItem(`datatable-pins-${tableId}`);
    }
  }, [internalPinState, tableId, externalPinState]);

  // Handler to update pin state
  const setPinState = useCallback(
    (key: string, pin: PinDirection) => {
      if (onPinChange) {
        onPinChange(key, pin);
      } else {
        setInternalPinState((prev) => ({ ...prev, [key]: pin }));
      }
    },
    [onPinChange]
  );

  // Reset all pins
  const resetPins = useCallback(() => {
    if (tableId) {
      localStorage.removeItem(`datatable-pins-${tableId}`);
    }
    setInternalPinState({});
  }, [tableId]);

  return {
    pinState,
    setPinState,
    resetPins,
  };
}
