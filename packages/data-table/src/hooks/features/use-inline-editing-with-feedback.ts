"use client";

import { useCallback } from "react";
import { useInlineEditing } from "./use-inline-editing";
import { useFeedback } from "../../feedback";
import type { UseInlineEditingOptions, InlineEditingController } from "../../types";

export interface UseInlineEditingWithFeedbackOptions<T extends { id: string }>
  extends UseInlineEditingOptions<T> {
  /**
   * Show toast notification on cell edit operations.
   * @default true
   */
  showFeedback?: boolean;
}

export interface UseInlineEditingWithFeedbackReturn<T extends { id: string }>
  extends InlineEditingController<T> {}

/**
 * Enhanced inline editing hook with integrated feedback notifications.
 *
 * This is a convenience wrapper around useInlineEditing that automatically
 * triggers toast notifications and ARIA announcements for edit operations.
 *
 * @example
 * ```tsx
 * const inlineEditing = useInlineEditingWithFeedback({
 *   data: rows,
 *   onCellChange: async (rowId, columnKey, value) => {
 *     await api.updateCell(rowId, columnKey, value);
 *   },
 * });
 *
 * // Successful edits will automatically show feedback
 * <DataTable inlineEditing={inlineEditing} ... />
 * ```
 */
export function useInlineEditingWithFeedback<T extends { id: string }>({
  showFeedback = true,
  onCellChange: userOnCellChange,
  ...options
}: UseInlineEditingWithFeedbackOptions<T>): UseInlineEditingWithFeedbackReturn<T> {
  const { feedback } = useFeedback();

  // Wrap onCellChange to add feedback
  const onCellChange = useCallback(
    async (rowId: string, columnKey: string, value: unknown, row: T) => {
      await userOnCellChange?.(rowId, columnKey, value, row);
      if (showFeedback) {
        feedback("rowEdited");
      }
    },
    [userOnCellChange, feedback, showFeedback]
  );

  return useInlineEditing({
    ...options,
    onCellChange,
  });
}

export default useInlineEditingWithFeedback;
