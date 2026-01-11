"use client";

import React from "react";
import { Skeleton } from "@unisane/ui";
import { cn } from "@unisane/ui";
import type { Column, ColumnMetaMap, PinPosition } from "../types/index";
import type { Density } from "../constants/index";
import { DENSITY_STYLES } from "../constants/index";

// ─── TYPES ─────────────────────────────────────────────────────────────────────

interface SkeletonLoadingStateProps<T> {
  columns: Column<T>[];
  columnMeta: ColumnMetaMap;
  getEffectivePinPosition: (col: Column<T>) => PinPosition;
  rowCount: number;
  selectable: boolean;
  enableExpansion: boolean;
  showColumnBorders: boolean;
  density: Density;
  reorderableRows?: boolean;
}

// ─── SKELETON WIDTH UTILS ──────────────────────────────────────────────────────

/**
 * Get skeleton width class based on column hints
 * Varies widths to create a more realistic loading appearance
 */
function getSkeletonWidthClass<T>(column: Column<T>, rowIndex: number): string {
  // Check alignment - right-aligned columns are typically numbers
  if (column.align === "end") {
    return "w-12";
  }

  // Check inputType for editing hints
  if (column.inputType === "number") {
    return "w-12";
  }

  if (column.inputType === "date" || column.inputType === "datetime-local") {
    return "w-20";
  }

  // For text columns, vary the width based on row index for visual interest
  const widths = ["w-24", "w-32", "w-20", "w-28", "w-16"];
  const keyLength = typeof column.key === "string" ? column.key.length : 0;
  return widths[(rowIndex + keyLength) % widths.length] ?? "w-24";
}

/**
 * Get skeleton variant based on column hints
 */
function getSkeletonVariant<T>(column: Column<T>): "text" | "circular" | "rectangular" {
  // If column header suggests avatar/image
  const key = typeof column.key === "string" ? column.key.toLowerCase() : "";
  const header = typeof column.header === "string" ? column.header.toLowerCase() : "";

  if (key.includes("avatar") || key.includes("image") || key.includes("photo") ||
      header.includes("avatar") || header.includes("image") || header.includes("photo")) {
    return "circular";
  }

  return "text";
}

// ─── SKELETON CELL ─────────────────────────────────────────────────────────────

function SkeletonCell<T>({
  column,
  columnMeta,
  getEffectivePinPosition,
  rowIndex,
  showColumnBorders,
  density,
}: {
  column: Column<T>;
  columnMeta: ColumnMetaMap;
  getEffectivePinPosition: (col: Column<T>) => PinPosition;
  rowIndex: number;
  showColumnBorders: boolean;
  density: Density;
}) {
  const columnKey = String(column.key);
  const meta = columnMeta[columnKey];
  const pinPosition = getEffectivePinPosition(column);
  const isPinned = pinPosition !== null;
  const cellPadding = DENSITY_STYLES[density];

  const widthClass = getSkeletonWidthClass(column, rowIndex);
  const variant = getSkeletonVariant(column);

  return (
    <td
      className={cn(
        cellPadding,
        showColumnBorders && "border-r border-outline-variant last:border-r-0",
        isPinned && "sticky bg-surface z-10",
        pinPosition === "left" && "left-0",
        pinPosition === "right" && "right-0"
      )}
      style={{
        width: meta?.width,
        left: pinPosition === "left" ? meta?.left : undefined,
        right: pinPosition === "right" ? meta?.right : undefined,
      }}
    >
      <Skeleton
        variant={variant}
        className={cn(
          variant === "circular" ? "size-8" : cn("h-4 rounded-sm", widthClass)
        )}
      />
    </td>
  );
}

// ─── SKELETON ROW ──────────────────────────────────────────────────────────────

function SkeletonRow<T>({
  rowIndex,
  columns,
  columnMeta,
  getEffectivePinPosition,
  selectable,
  enableExpansion,
  showColumnBorders,
  density,
  reorderableRows,
}: {
  rowIndex: number;
  columns: Column<T>[];
  columnMeta: ColumnMetaMap;
  getEffectivePinPosition: (col: Column<T>) => PinPosition;
  selectable: boolean;
  enableExpansion: boolean;
  showColumnBorders: boolean;
  density: Density;
  reorderableRows?: boolean;
}) {
  const cellPadding = DENSITY_STYLES[density];

  return (
    <tr
      className="border-b border-outline-variant last:border-b-0"
      aria-hidden="true"
    >
      {/* Drag handle column */}
      {reorderableRows && (
        <td className={cn(cellPadding, "w-10")}>
          <Skeleton variant="rectangular" className="h-4 w-4 rounded-sm" />
        </td>
      )}

      {/* Selection checkbox column */}
      {selectable && (
        <td className={cn(cellPadding, "w-12")}>
          <Skeleton variant="rectangular" className="size-5 rounded-sm" />
        </td>
      )}

      {/* Expansion toggle column */}
      {enableExpansion && (
        <td className={cn(cellPadding, "w-12")}>
          <Skeleton variant="circular" className="size-5" />
        </td>
      )}

      {/* Data columns */}
      {columns.map((column) => (
        <SkeletonCell
          key={String(column.key)}
          column={column}
          columnMeta={columnMeta}
          getEffectivePinPosition={getEffectivePinPosition}
          rowIndex={rowIndex}
          showColumnBorders={showColumnBorders}
          density={density}
        />
      ))}
    </tr>
  );
}

// ─── SKELETON LOADING STATE ────────────────────────────────────────────────────

export function SkeletonLoadingState<T>({
  columns,
  columnMeta,
  getEffectivePinPosition,
  rowCount,
  selectable,
  enableExpansion,
  showColumnBorders,
  density,
  reorderableRows = false,
}: SkeletonLoadingStateProps<T>) {
  return (
    <tbody className="bg-surface" role="status" aria-busy="true" aria-label="Loading data">
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <SkeletonRow
          key={rowIndex}
          rowIndex={rowIndex}
          columns={columns}
          columnMeta={columnMeta}
          getEffectivePinPosition={getEffectivePinPosition}
          selectable={selectable}
          enableExpansion={enableExpansion}
          showColumnBorders={showColumnBorders}
          density={density}
          reorderableRows={reorderableRows}
        />
      ))}
    </tbody>
  );
}
