"use client";

import React, { memo } from "react";
import type { ReactNode } from "react";
import { cn, Icon } from "@unisane/ui";
import type { Column, PinPosition, ColumnMetaMap } from "../types/index";
import { DENSITY_STYLES, COLUMN_WIDTHS, type Density } from "../constants/index";

// ─── SUMMARY TYPES ───────────────────────────────────────────────────────────

export type SummaryCalculation = "sum" | "average" | "count" | "min" | "max";

export interface SummaryValue {
  value: number | string | null;
  formattedValue: string;
  type: SummaryCalculation | "custom";
}

// ─── UTILITY FUNCTIONS ───────────────────────────────────────────────────────

/**
 * Get a nested value from an object using dot notation
 */
function getNestedValue<T>(obj: T, path: string): unknown {
  const keys = path.split(".");
  let value: unknown = obj;
  for (const key of keys) {
    if (value == null) return undefined;
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}

/**
 * Calculate a summary value for a column
 */
export function calculateSummary<T>(
  data: T[],
  columnKey: string,
  calculation: SummaryCalculation
): number | null {
  const values = data
    .map((row) => {
      const val = getNestedValue(row, columnKey);
      return typeof val === "number" ? val : null;
    })
    .filter((v): v is number => v !== null);

  if (values.length === 0) return null;

  switch (calculation) {
    case "sum":
      return values.reduce((acc, v) => acc + v, 0);
    case "average":
      return values.reduce((acc, v) => acc + v, 0) / values.length;
    case "count":
      return values.length;
    case "min":
      return Math.min(...values);
    case "max":
      return Math.max(...values);
    default:
      return null;
  }
}

/**
 * Format a summary value for display
 */
export function formatSummaryValue(
  value: number | null,
  calculation: SummaryCalculation
): string {
  if (value === null) return "—";

  switch (calculation) {
    case "count":
      return value.toLocaleString();
    case "average":
      return value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    case "sum":
    case "min":
    case "max":
    default:
      return value.toLocaleString(undefined, {
        maximumFractionDigits: 2,
      });
  }
}

/**
 * Get label for summary type
 */
function getSummaryLabel(type: SummaryCalculation): string {
  switch (type) {
    case "sum":
      return "Total";
    case "average":
      return "Avg";
    case "count":
      return "Count";
    case "min":
      return "Min";
    case "max":
      return "Max";
    default:
      return "";
  }
}

// ─── SUMMARY ROW PROPS ───────────────────────────────────────────────────────

export interface SummaryRowProps<T> {
  /** Data to calculate summaries from */
  data: T[];
  /** Column definitions */
  columns: Column<T>[];
  /** Column metadata for positioning */
  columnMeta: ColumnMetaMap;
  /** Get effective pin position for a column */
  getEffectivePinPosition: (col: Column<T>) => PinPosition;
  /** Whether selection checkbox column is shown */
  selectable: boolean;
  /** Whether expansion column is shown */
  enableExpansion: boolean;
  /** Whether to show column borders */
  showColumnBorders: boolean;
  /** Row density */
  density?: Density;
  /** Label for the summary row (defaults to "Summary") */
  label?: string;
  /** Whether this is the last pinned left column */
  lastPinnedLeftKey?: string | null;
  /** Whether this is the first pinned right column */
  firstPinnedRightKey?: string | null;
  /** Custom summary renderer for specific columns */
  customSummaryRenderer?: Record<string, (data: T[]) => ReactNode>;
}

// ─── SUMMARY CELL ────────────────────────────────────────────────────────────

interface SummaryCellProps<T> {
  column: Column<T>;
  data: T[];
  meta: ColumnMetaMap[string] | undefined;
  pinPosition: PinPosition;
  paddingClass: string;
  showColumnBorders: boolean;
  isLastColumn: boolean;
  isLastPinnedLeft: boolean;
  isFirstPinnedRight: boolean;
  customRenderer?: (data: T[]) => ReactNode;
}

function SummaryCell<T>({
  column,
  data,
  meta,
  pinPosition,
  paddingClass,
  showColumnBorders,
  isLastColumn,
  isLastPinnedLeft,
  isFirstPinnedRight,
  customRenderer,
}: SummaryCellProps<T>) {
  const summaryType = column.summary;
  const columnKey = String(column.key);

  // Render content
  let content: ReactNode = null;

  if (customRenderer) {
    // Use custom renderer if provided
    content = customRenderer(data);
  } else if (typeof summaryType === "function") {
    // Use column-defined custom function
    content = summaryType(data);
  } else if (summaryType) {
    // Use built-in calculation
    const value = calculateSummary(data, columnKey, summaryType);
    const formatted = formatSummaryValue(value, summaryType);
    const label = getSummaryLabel(summaryType);

    content = (
      <div className="flex flex-col gap-0.5">
        <span className="text-label-small text-on-surface-variant uppercase tracking-wider">
          {label}
        </span>
        <span className="text-body-medium font-semibold text-on-surface">
          {formatted}
        </span>
      </div>
    );
  }

  return (
    <td
      className={cn(
        "bg-surface-container-low border-t-2 border-outline-variant",
        "text-on-surface whitespace-nowrap",
        paddingClass,
        column.align === "center" && "text-center",
        column.align === "end" && "text-right",
        column.align !== "center" && column.align !== "end" && "text-left",
        // Pinned styling
        pinPosition ? "sticky z-20 isolate" : "z-0",
        // Column borders
        showColumnBorders && !isLastColumn && !pinPosition && "border-r border-outline-variant/50",
        showColumnBorders && isLastPinnedLeft && "border-r border-outline-variant/50",
        showColumnBorders && isFirstPinnedRight && "border-l border-outline-variant/50"
      )}
      style={{
        width: meta?.width,
        minWidth: meta?.width,
        maxWidth: meta?.width,
        left: pinPosition === "left" ? meta?.left : undefined,
        right: pinPosition === "right" ? meta?.right : undefined,
        boxShadow:
          pinPosition === "left"
            ? "4px 0 8px -3px rgba(0, 0, 0, 0.15)"
            : pinPosition === "right"
            ? "-4px 0 8px -3px rgba(0, 0, 0, 0.15)"
            : undefined,
      }}
    >
      {content}
    </td>
  );
}

// ─── SUMMARY ROW COMPONENT ───────────────────────────────────────────────────

function SummaryRowInner<T extends { id: string }>({
  data,
  columns,
  columnMeta,
  getEffectivePinPosition,
  selectable,
  enableExpansion,
  showColumnBorders,
  density = "standard",
  label = "Summary",
  lastPinnedLeftKey,
  firstPinnedRightKey,
  customSummaryRenderer = {},
}: SummaryRowProps<T>) {
  const paddingClass = DENSITY_STYLES[density];

  // Check if any column has summary defined
  const hasSummary = columns.some(
    (col) => col.summary || customSummaryRenderer[String(col.key)]
  );

  if (!hasSummary || data.length === 0) {
    return null;
  }

  // Calculate sticky offsets for checkbox and expander columns
  const checkboxWidth = selectable ? COLUMN_WIDTHS.CHECKBOX : 0;
  const expanderWidth = enableExpansion ? COLUMN_WIDTHS.EXPANDER : 0;

  return (
    <tr className="bg-surface-container-low">
      {/* Checkbox placeholder */}
      {selectable && (
        <td
          className={cn(
            "bg-surface-container-low border-t-2 border-outline-variant",
            "sticky left-0 z-20 isolate",
            paddingClass,
            showColumnBorders && !enableExpansion && !lastPinnedLeftKey && "border-r border-outline-variant/50"
          )}
          style={{ width: COLUMN_WIDTHS.CHECKBOX, minWidth: COLUMN_WIDTHS.CHECKBOX }}
        >
          {/* Summary label in first cell */}
          <div className="flex items-center gap-1.5">
            <Icon symbol="functions" className="text-[18px] text-primary" />
            <span className="text-label-medium font-semibold text-on-surface">
              {label}
            </span>
          </div>
        </td>
      )}

      {/* Expander placeholder */}
      {enableExpansion && (
        <td
          className={cn(
            "bg-surface-container-low border-t-2 border-outline-variant",
            "sticky z-20 isolate",
            paddingClass,
            showColumnBorders && !lastPinnedLeftKey && "border-r border-outline-variant/50"
          )}
          style={{
            width: COLUMN_WIDTHS.EXPANDER,
            minWidth: COLUMN_WIDTHS.EXPANDER,
            left: checkboxWidth,
          }}
        >
          {/* If no checkbox column, show label here */}
          {!selectable && (
            <div className="flex items-center gap-1.5">
              <Icon symbol="functions" className="text-[18px] text-primary" />
              <span className="text-label-medium font-semibold text-on-surface">
                {label}
              </span>
            </div>
          )}
        </td>
      )}

      {/* Data columns */}
      {columns.map((col, index) => {
        const key = String(col.key);
        const meta = columnMeta[key];
        const pinPosition = getEffectivePinPosition(col);
        const isLastColumn = index === columns.length - 1;

        // Show label in first data column if no checkbox/expander
        const showLabel = !selectable && !enableExpansion && index === 0;

        // Check for custom renderer
        const customRenderer = customSummaryRenderer[key];

        // If this is the label column and no summary, show label
        if (showLabel && !col.summary && !customRenderer) {
          return (
            <td
              key={key}
              className={cn(
                "bg-surface-container-low border-t-2 border-outline-variant",
                paddingClass,
                pinPosition ? "sticky z-20 isolate" : "z-0",
                showColumnBorders && !isLastColumn && !pinPosition && "border-r border-outline-variant/50",
                showColumnBorders && key === lastPinnedLeftKey && "border-r border-outline-variant/50",
                showColumnBorders && key === firstPinnedRightKey && "border-l border-outline-variant/50"
              )}
              style={{
                width: meta?.width,
                minWidth: meta?.width,
                maxWidth: meta?.width,
                left: pinPosition === "left" ? meta?.left : undefined,
                right: pinPosition === "right" ? meta?.right : undefined,
                boxShadow:
                  pinPosition === "left"
                    ? "4px 0 8px -3px rgba(0, 0, 0, 0.15)"
                    : pinPosition === "right"
                    ? "-4px 0 8px -3px rgba(0, 0, 0, 0.15)"
                    : undefined,
              }}
            >
              <div className="flex items-center gap-1.5">
                <Icon symbol="functions" className="text-[18px] text-primary" />
                <span className="text-label-medium font-semibold text-on-surface">
                  {label}
                </span>
              </div>
            </td>
          );
        }

        return (
          <SummaryCell
            key={key}
            column={col}
            data={data}
            meta={meta}
            pinPosition={pinPosition}
            paddingClass={paddingClass}
            showColumnBorders={showColumnBorders}
            isLastColumn={isLastColumn}
            isLastPinnedLeft={key === lastPinnedLeftKey}
            isFirstPinnedRight={key === firstPinnedRightKey}
            customRenderer={customRenderer}
          />
        );
      })}
    </tr>
  );
}

export const SummaryRow = memo(SummaryRowInner) as typeof SummaryRowInner;
