"use client";

import { useCallback } from "react";
import { useClipboardPaste, type UseClipboardPasteOptions, type UseClipboardPasteReturn, type PasteResult } from "./use-clipboard-paste";
import { useFeedback } from "../../feedback";

export interface UseClipboardPasteWithFeedbackOptions<T extends { id: string }>
  extends UseClipboardPasteOptions<T> {
  /**
   * Show toast notification on copy/paste operations.
   * @default true
   */
  showFeedback?: boolean;
}

export interface UseClipboardPasteWithFeedbackReturn<T extends { id: string }>
  extends UseClipboardPasteReturn<T> {}

/**
 * Enhanced clipboard paste hook with integrated feedback notifications.
 *
 * This is a convenience wrapper around useClipboardPaste that automatically
 * triggers toast notifications and ARIA announcements for copy/paste operations.
 *
 * @example
 * ```tsx
 * const clipboard = useClipboardPasteWithFeedback({
 *   data: rows,
 *   columnKeys: ["name", "email"],
 *   getActiveCell: () => activeCell,
 *   onCellChange: handleCellChange,
 * });
 *
 * // Paste will automatically show feedback
 * <div onKeyDown={clipboard.handleKeyDown}>...</div>
 * ```
 */
export function useClipboardPasteWithFeedback<T extends { id: string }>({
  showFeedback = true,
  onPasteComplete: userOnPasteComplete,
  ...options
}: UseClipboardPasteWithFeedbackOptions<T>): UseClipboardPasteWithFeedbackReturn<T> {
  const { feedback } = useFeedback();

  // Wrap onPasteComplete to add feedback
  const onPasteComplete = useCallback(
    (result: PasteResult<T>) => {
      if (showFeedback) {
        if (result.success) {
          feedback("paste", { count: result.cellsUpdated });
        } else if (result.errors.length > 0) {
          // Check if it was a validation error
          if (result.errors.some((e) => e.includes("validation"))) {
            feedback("pasteValidationError", { count: result.errors.length });
          } else {
            feedback("pasteFailed");
          }
        }
      }

      // Call user's callback if provided
      userOnPasteComplete?.(result);
    },
    [feedback, showFeedback, userOnPasteComplete]
  );

  const clipboardHook = useClipboardPaste({
    ...options,
    onPasteComplete,
  });

  // Wrap copy functions to add feedback
  const copyWithFeedback = useCallback(
    async (getCellValue: (rowId: string, columnKey: string) => unknown): Promise<boolean> => {
      const success = await clipboardHook.copy(getCellValue);
      if (showFeedback && success) {
        feedback("copy", { count: 1 });
      }
      return success;
    },
    [clipboardHook, feedback, showFeedback]
  );

  const copyRangeWithFeedback = useCallback(
    async (
      startRowId: string,
      startColumnKey: string,
      endRowId: string,
      endColumnKey: string,
      getCellValue: (rowId: string, columnKey: string) => unknown
    ): Promise<boolean> => {
      const success = await clipboardHook.copyRange(
        startRowId,
        startColumnKey,
        endRowId,
        endColumnKey,
        getCellValue
      );
      if (showFeedback && success) {
        // Estimate count based on range (we don't have exact cell count here)
        feedback("copy", { count: 1 });
      }
      return success;
    },
    [clipboardHook, feedback, showFeedback]
  );

  const copyCellsWithFeedback = useCallback(
    async (
      cells: Array<{ rowId: string; columnKey: string }>,
      getCellValue: (rowId: string, columnKey: string) => unknown
    ): Promise<boolean> => {
      const success = await clipboardHook.copyCells(cells, getCellValue);
      if (showFeedback && success) {
        feedback("copy", { count: cells.length });
      }
      return success;
    },
    [clipboardHook, feedback, showFeedback]
  );

  return {
    ...clipboardHook,
    copy: copyWithFeedback,
    copyRange: copyRangeWithFeedback,
    copyCells: copyCellsWithFeedback,
  };
}

export default useClipboardPasteWithFeedback;
