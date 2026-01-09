"use client";

import { useRef, useCallback, useEffect } from "react";
import { useSafeRAF } from "../use-safe-raf";

/**
 * Options for the useFocusRestore hook
 */
export interface UseFocusRestoreOptions {
  /** Whether to capture focus on mount */
  captureOnMount?: boolean;
  /** Selector to use when restoring focus (if element is no longer in DOM) */
  fallbackSelector?: string;
}

/**
 * Return type for the useFocusRestore hook
 */
export interface UseFocusRestoreReturn {
  /** Capture the currently focused element */
  captureFocus: () => void;
  /** Restore focus to the captured element */
  restoreFocus: () => void;
  /** Check if focus was captured */
  hasCapturedFocus: () => boolean;
  /** Get ref to the container for cleanup */
  containerRef: React.RefObject<HTMLElement | null>;
}

/**
 * Hook for capturing and restoring focus.
 *
 * Useful for:
 * - Modals/dialogs that need to restore focus when closed
 * - Inline editing that needs to restore focus to the cell
 * - Any component that temporarily takes focus
 *
 * @example
 * ```tsx
 * const { captureFocus, restoreFocus } = useFocusRestore();
 *
 * const openDialog = () => {
 *   captureFocus();
 *   setIsOpen(true);
 * };
 *
 * const closeDialog = () => {
 *   setIsOpen(false);
 *   restoreFocus();
 * };
 * ```
 */
export function useFocusRestore({
  captureOnMount = false,
  fallbackSelector,
}: UseFocusRestoreOptions = {}): UseFocusRestoreReturn {
  const capturedElementRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const { requestFrame } = useSafeRAF();

  // Capture the currently focused element
  const captureFocus = useCallback(() => {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      capturedElementRef.current = activeElement;
    }
  }, []);

  // Restore focus to the captured element
  const restoreFocus = useCallback(() => {
    requestFrame(() => {
      const element = capturedElementRef.current;

      // Try to focus the captured element
      if (element && document.contains(element)) {
        element.focus();
        capturedElementRef.current = null;
        return;
      }

      // If element is no longer in DOM, try the fallback selector
      if (fallbackSelector) {
        const fallbackElement = document.querySelector(fallbackSelector);
        if (fallbackElement instanceof HTMLElement) {
          fallbackElement.focus();
        }
      }

      capturedElementRef.current = null;
    });
  }, [requestFrame, fallbackSelector]);

  // Check if focus was captured
  const hasCapturedFocus = useCallback(() => {
    return capturedElementRef.current !== null;
  }, []);

  // Capture focus on mount if requested
  useEffect(() => {
    if (captureOnMount) {
      captureFocus();
    }
  }, [captureOnMount, captureFocus]);

  // Clean up captured reference on unmount
  useEffect(() => {
    return () => {
      capturedElementRef.current = null;
    };
  }, []);

  return {
    captureFocus,
    restoreFocus,
    hasCapturedFocus,
    containerRef,
  };
}

export default useFocusRestore;
