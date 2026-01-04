"use client";

import React, { forwardRef } from "react";
import { cn, Icon } from "@unisane/ui";
import { useI18n } from "../i18n";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface DragHandleProps
  extends React.HTMLAttributes<HTMLButtonElement> {
  /** Whether the row is currently being dragged */
  isDragging?: boolean;
  /** Whether the handle is disabled */
  disabled?: boolean;
  /** Size variant */
  size?: "sm" | "md";
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

/**
 * Drag handle component for row reordering.
 *
 * Renders a grip icon that users can drag to reorder rows.
 * Supports keyboard reordering with Alt+Arrow keys when focused.
 *
 * @example
 * ```tsx
 * <DragHandle
 *   {...getDragHandleProps(row.id, rowIndex)}
 *   isDragging={isDraggingRow(row.id)}
 * />
 * ```
 */
export const DragHandle = forwardRef<HTMLButtonElement, DragHandleProps>(
  (
    { isDragging = false, disabled = false, size = "md", className, ...props },
    ref
  ) => {
    const { t } = useI18n();

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center rounded transition-colors",
          "text-outline-variant hover:text-on-surface-variant",
          "hover:bg-on-surface/8 active:bg-on-surface/12",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          "cursor-grab active:cursor-grabbing",
          "touch-none select-none",
          // WCAG 2.5.5: min 44px touch target
          size === "sm" && "min-w-[44px] min-h-[44px] w-11 h-11 sm:w-6 sm:h-6",
          size === "md" && "min-w-[44px] min-h-[44px] w-11 h-11 sm:w-8 sm:h-8",
          isDragging && "opacity-50 cursor-grabbing",
          disabled && "opacity-30 cursor-not-allowed pointer-events-none",
          className
        )}
        aria-label={t("dragRowHandle")}
        {...props}
      >
        <Icon
          symbol="drag_indicator"
          className={cn(
            size === "sm" && "text-[16px]",
            size === "md" && "text-[20px]"
          )}
        />
      </button>
    );
  }
);

DragHandle.displayName = "DragHandle";

export default DragHandle;
