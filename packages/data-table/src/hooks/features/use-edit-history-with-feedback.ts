"use client";

import { useCallback } from "react";
import {
  useEditHistory,
  type UseEditHistoryOptions,
  type UseEditHistoryReturn,
  type EditHistoryEntry,
} from "./use-edit-history";
import { useFeedback } from "../../feedback";

export interface UseEditHistoryWithFeedbackOptions<T = unknown>
  extends UseEditHistoryOptions<T> {
  /**
   * Show toast notification on undo/redo.
   * @default true
   */
  showFeedback?: boolean;
}

export interface UseEditHistoryWithFeedbackReturn<T = unknown>
  extends UseEditHistoryReturn<T> {}

/**
 * Enhanced edit history hook with integrated feedback notifications.
 *
 * This is a convenience wrapper around useEditHistory that automatically
 * triggers toast notifications and ARIA announcements for undo/redo operations.
 *
 * @example
 * ```tsx
 * const history = useEditHistoryWithFeedback({
 *   onApplyChange: handleApplyChange,
 * });
 *
 * // Undo/redo will automatically show feedback
 * history.undo();
 * history.redo();
 * ```
 */
export function useEditHistoryWithFeedback<T = unknown>({
  showFeedback = true,
  onUndo: userOnUndo,
  onRedo: userOnRedo,
  ...options
}: UseEditHistoryWithFeedbackOptions<T>): UseEditHistoryWithFeedbackReturn<T> {
  const { feedback } = useFeedback();

  // Wrap onUndo to add feedback
  const onUndo = useCallback(
    (entry: EditHistoryEntry<T>) => {
      if (showFeedback) {
        feedback("undone", { description: entry.description || "edit" });
      }
      userOnUndo?.(entry);
    },
    [feedback, showFeedback, userOnUndo]
  );

  // Wrap onRedo to add feedback
  const onRedo = useCallback(
    (entry: EditHistoryEntry<T>) => {
      if (showFeedback) {
        feedback("redone", { description: entry.description || "edit" });
      }
      userOnRedo?.(entry);
    },
    [feedback, showFeedback, userOnRedo]
  );

  const historyHook = useEditHistory({
    ...options,
    onUndo,
    onRedo,
  });

  // Wrap undo/redo to show feedback for empty stack
  const undoWithFeedback = useCallback(async () => {
    if (!historyHook.canUndo && showFeedback) {
      feedback("nothingToUndo");
      return { success: false, entry: null };
    }
    return historyHook.undo();
  }, [historyHook, feedback, showFeedback]);

  const redoWithFeedback = useCallback(async () => {
    if (!historyHook.canRedo && showFeedback) {
      feedback("nothingToRedo");
      return { success: false, entry: null };
    }
    return historyHook.redo();
  }, [historyHook, feedback, showFeedback]);

  return {
    ...historyHook,
    undo: undoWithFeedback,
    redo: redoWithFeedback,
  };
}

export default useEditHistoryWithFeedback;
