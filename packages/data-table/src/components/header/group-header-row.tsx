"use client";

import React from "react";
import { cn } from "@unisane/ui";
import type { Column, ColumnGroup } from "../../types";
import { isColumnGroup } from "../../types";

export interface GroupHeaderRowProps<T> {
  columnDefinitions: Array<Column<T> | ColumnGroup<T>>;
  selectable: boolean;
  enableExpansion: boolean;
  showColumnBorders: boolean;
  paddingClass: string;
  hasPinnedLeftData: boolean;
  /** Whether row drag-to-reorder is enabled (affects sticky positioning) */
  reorderableRows?: boolean;
}

export function GroupHeaderRow<T>({
  columnDefinitions,
  selectable,
  enableExpansion,
  showColumnBorders,
  paddingClass,
  hasPinnedLeftData,
  reorderableRows = false,
}: GroupHeaderRowProps<T>) {
  return (
    <tr>
      {/* Checkbox placeholder */}
      {selectable && (
        <th
          className={cn(
            "bg-surface border-b border-outline-variant/50",
            // relative is required for z-index to work on table cells
            // z-30 to stay above pinned data columns (z-20), isolate creates stacking context
            "relative z-30 isolate",
            // Only show border-r if there are no more sticky columns after this
            showColumnBorders && !enableExpansion && !hasPinnedLeftData && "border-r border-outline-variant/50"
          )}
          style={{
            width: 48,
            minWidth: 48,
            maxWidth: 48,
            // Pinned left at position 0:
            // Use max() to only start translating once scroll exceeds drag handle width
            transform: reorderableRows
              ? "translateX(max(0px, calc(var(--header-scroll-offset, 0px) - 40px)))"
              : "translateX(var(--header-scroll-offset, 0px))",
            // No elevation shadow - only pinned data columns get shadow
          }}
          rowSpan={2}
        />
      )}

      {/* Expander placeholder */}
      {enableExpansion && (
        <th
          className={cn(
            "bg-surface border-b border-outline-variant/50",
            // relative is required for z-index to work on table cells
            // z-30 to stay above pinned data columns (z-20), isolate creates stacking context
            "relative z-30 isolate",
            // Only show border-r if there are no pinned-left data columns after this
            showColumnBorders && !hasPinnedLeftData && "border-r border-outline-variant/50"
          )}
          style={{
            width: 40,
            minWidth: 40,
            maxWidth: 40,
            // Pinned left at position 48 (after checkbox) or 0:
            // Use max() to only start translating once scroll exceeds the offset
            transform: (() => {
              const dragHandleWidth = reorderableRows ? 40 : 0;
              const checkboxWidth = selectable ? 48 : 0;
              const targetLeft = selectable ? 48 : 0;
              const offset = dragHandleWidth + checkboxWidth - targetLeft;
              return offset > 0
                ? `translateX(max(0px, calc(var(--header-scroll-offset, 0px) - ${offset}px)))`
                : "translateX(var(--header-scroll-offset, 0px))";
            })(),
            // No elevation shadow - only pinned data columns get shadow
          }}
          rowSpan={2}
        />
      )}

      {/* Group headers */}
      {columnDefinitions.map((def, idx) => {
        if (isColumnGroup(def)) {
          const isLastGroup = idx === columnDefinitions.length - 1;
          return (
            <th
              key={`group-${idx}`}
              colSpan={def.children.length}
              className={cn(
                "bg-surface border-b border-outline-variant/50",
                "text-label-medium font-semibold text-on-surface-variant text-center align-middle",
                paddingClass,
                showColumnBorders && !isLastGroup && "border-r border-outline-variant/50"
              )}
            >
              {def.header}
            </th>
          );
        } else {
          // Standalone column spans both rows
          const isLastColumn = idx === columnDefinitions.length - 1;
          return (
            <th
              key={String(def.key)}
              rowSpan={2}
              className={cn(
                "bg-surface border-b border-outline-variant/50",
                "text-label-large font-medium text-on-surface-variant align-middle",
                paddingClass,
                def.align === "center" && "text-center",
                def.align === "end" && "text-right",
                showColumnBorders && !isLastColumn && "border-r border-outline-variant/50"
              )}
            >
              {def.header}
            </th>
          );
        }
      })}
    </tr>
  );
}
