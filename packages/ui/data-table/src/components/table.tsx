"use client";

import React, { forwardRef } from "react";
import { cn } from "@unisane/ui";

// ─── TABLE ──────────────────────────────────────────────────────────────────

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
  /** Accessible label for the table (required for screen readers) */
  "aria-label"?: string;
  /** ID of element that labels this table */
  "aria-labelledby"?: string;
  /** ID of element that describes this table */
  "aria-describedby"?: string;
  /** Total row count for virtual scrolling accessibility */
  "aria-rowcount"?: number;
  /** Total column count for accessibility */
  "aria-colcount"?: number;
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ children, className, "aria-label": ariaLabel, "aria-rowcount": rowCount, "aria-colcount": colCount, ...props }, ref) => (
    <table
      ref={ref}
      role="grid"
      aria-label={ariaLabel}
      aria-rowcount={rowCount}
      aria-colcount={colCount}
      className={cn(
        "w-full border-separate border-spacing-0 table-fixed",
        className
      )}
      {...props}
    >
      {children}
    </table>
  )
);
Table.displayName = "Table";

// ─── TABLE SCROLL CONTAINER ─────────────────────────────────────────────────
// This container wraps the entire table and handles horizontal scrolling.
// The sticky header positioning is handled via CSS variable --data-table-header-offset.
//
// Layout Architecture:
// - This container has overflow-x: auto for horizontal scroll
// - The thead inside uses position: sticky with top offset from CSS variable
// - Consumers wrap this in a parent that sets the CSS variable based on toolbar height

interface TableContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const TableContainer = forwardRef<HTMLDivElement, TableContainerProps>(
  ({ children, className, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative bg-surface @container",
        // Only horizontal scrolling - vertical is page scroll
        // The table grows naturally with content
        "overflow-x-auto",
        // Show native scrollbar on mobile for touch discoverability, hide on tablet+ where custom scrollbar is used
        "@md:[&::-webkit-scrollbar]:hidden",
        className
      )}
      style={{
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
);
TableContainer.displayName = "TableContainer";

// ─── TABLE HEAD ─────────────────────────────────────────────────────────────

interface TableHeadProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

export const TableHead = forwardRef<HTMLTableSectionElement, TableHeadProps>(
  ({ children, className, ...props }, ref) => (
    <thead ref={ref} className={cn("", className)} {...props}>
      {children}
    </thead>
  )
);
TableHead.displayName = "TableHead";

// ─── TABLE BODY ─────────────────────────────────────────────────────────────

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ children, className, ...props }, ref) => (
    <tbody ref={ref} className={cn("", className)} {...props}>
      {children}
    </tbody>
  )
);
TableBody.displayName = "TableBody";

// ─── TABLE ROW ──────────────────────────────────────────────────────────────

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
  selected?: boolean;
  active?: boolean;
  clickable?: boolean;
  /** Row index for accessibility (1-based) */
  "aria-rowindex"?: number;
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ children, className, selected, active, clickable, "aria-rowindex": rowIndex, ...props }, ref) => (
    <tr
      ref={ref}
      role="row"
      aria-selected={selected}
      aria-rowindex={rowIndex}
      className={cn(
        "group transition-colors duration-snappy",
        selected && "bg-primary/8",
        active && "bg-secondary-container",
        clickable && "cursor-pointer",
        !selected && !active && "hover:bg-surface-container-low",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  )
);
TableRow.displayName = "TableRow";

// ─── TABLE HEADER CELL ──────────────────────────────────────────────────────

interface TableHeaderCellProps
  extends Omit<React.ThHTMLAttributes<HTMLTableCellElement>, "align"> {
  children?: React.ReactNode;
  sortable?: boolean;
  /** Current sort direction */
  sortDirection?: "asc" | "desc" | null;
  align?: "start" | "center" | "end";
  pinned?: "left" | "right" | null;
  /** Column index for accessibility (1-based) */
  "aria-colindex"?: number;
}

export const TableHeaderCell = forwardRef<
  HTMLTableCellElement,
  TableHeaderCellProps
>(({ children, className, sortable, sortDirection, align = "start", pinned, "aria-colindex": colIndex, ...props }, ref) => (
  <th
    ref={ref}
    role="columnheader"
    scope="col"
    aria-colindex={colIndex}
    aria-sort={sortDirection === "asc" ? "ascending" : sortDirection === "desc" ? "descending" : undefined}
    className={cn(
      "text-label-large font-medium text-on-surface-variant whitespace-nowrap",
      "bg-surface-container-low border-b border-outline-variant/50",
      sortable && "cursor-pointer select-none hover:bg-surface-container",
      align === "start" && "text-left",
      align === "center" && "text-center",
      align === "end" && "text-right",
      // z-20 matches header cells for consistent stacking
      // Only enable sticky on tablet+ (≥768px container width) - mobile scrolls everything together
      pinned === "left" && "@md:sticky z-20 isolate",
      pinned === "right" && "@md:sticky z-20 isolate",
      className
    )}
    {...props}
  >
    {children}
  </th>
));
TableHeaderCell.displayName = "TableHeaderCell";

// ─── TABLE CELL ─────────────────────────────────────────────────────────────

interface TableCellProps extends Omit<React.TdHTMLAttributes<HTMLTableCellElement>, "align"> {
  children?: React.ReactNode;
  align?: "start" | "center" | "end";
  pinned?: "left" | "right" | null;
  /** Column index for accessibility (1-based) */
  "aria-colindex"?: number;
  /** Whether this cell is selected */
  "aria-selected"?: boolean;
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ children, className, align = "start", pinned, "aria-colindex": colIndex, "aria-selected": selected, ...props }, ref) => (
    <td
      ref={ref}
      role="gridcell"
      aria-colindex={colIndex}
      aria-selected={selected}
      className={cn(
        "text-body-medium text-on-surface whitespace-nowrap overflow-hidden text-ellipsis",
        "bg-surface border-b border-outline-variant/50",
        "group-hover:bg-surface-container-low transition-colors",
        align === "start" && "text-left",
        align === "center" && "text-center",
        align === "end" && "text-right",
        // z-20 matches header cells for consistent stacking
        // Only enable sticky on tablet+ (≥768px container width) - mobile scrolls everything together
        pinned === "left" && "@md:sticky z-20 isolate",
        pinned === "right" && "@md:sticky z-20 isolate",
        className
      )}
      {...props}
    >
      {children}
    </td>
  )
);
TableCell.displayName = "TableCell";
