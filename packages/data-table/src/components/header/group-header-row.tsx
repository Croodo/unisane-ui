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
}

export function GroupHeaderRow<T>({
  columnDefinitions,
  selectable,
  enableExpansion,
  showColumnBorders,
  paddingClass,
  hasPinnedLeftData,
}: GroupHeaderRowProps<T>) {
  return (
    <tr>
      {/* Checkbox placeholder */}
      {selectable && (
        <th
          className={cn(
            "bg-surface border-b border-outline-variant/50",
            // Sticky positioning to stay at left edge when drag handle scrolls out
            // z-30 to stay above pinned data columns (z-20), isolate creates stacking context
            // Only apply on tablet+ (@md) - mobile scrolls everything together
            "@md:sticky @md:left-0 @md:z-30 @md:isolate",
            // Only show border-r if there are no more sticky columns after this
            showColumnBorders && !enableExpansion && !hasPinnedLeftData && "border-r border-outline-variant/50"
          )}
          style={{
            width: 48,
            minWidth: 48,
            maxWidth: 48,
          }}
          rowSpan={2}
        />
      )}

      {/* Expander placeholder */}
      {enableExpansion && (
        <th
          className={cn(
            "bg-surface border-b border-outline-variant/50",
            // Sticky positioning to stay at left edge (after checkbox if present)
            // z-30 to stay above pinned data columns (z-20), isolate creates stacking context
            // Only apply on tablet+ (@md) - mobile scrolls everything together
            "@md:sticky @md:z-30 @md:isolate",
            // Only show border-r if there are no pinned-left data columns after this
            showColumnBorders && !hasPinnedLeftData && "border-r border-outline-variant/50"
          )}
          style={{
            width: 40,
            minWidth: 40,
            maxWidth: 40,
            // Position after checkbox (48px) if selectable, otherwise at 0
            left: selectable ? 48 : 0,
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
