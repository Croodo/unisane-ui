"use client";

import React, { forwardRef } from "react";
import { cn } from "@unisane/ui";

// ─── TABLE ──────────────────────────────────────────────────────────────────

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ children, className, ...props }, ref) => (
    <table
      ref={ref}
      className={cn(
        "w-full border-separate border-spacing-0",
        className
      )}
      {...props}
    >
      {children}
    </table>
  )
);
Table.displayName = "Table";

// ─── TABLE CONTAINER ────────────────────────────────────────────────────────

interface TableContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const TableContainer = forwardRef<HTMLDivElement, TableContainerProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex-1 overflow-auto relative bg-surface",
        // Hide scrollbar but keep functionality
        "scrollbar-none",
        "[&::-webkit-scrollbar]:hidden",
        "[-ms-overflow-style:none]",
        "[scrollbar-width:none]",
        className
      )}
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
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ children, className, selected, active, clickable, ...props }, ref) => (
    <tr
      ref={ref}
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
  align?: "start" | "center" | "end";
  pinned?: "left" | "right" | null;
}

export const TableHeaderCell = forwardRef<
  HTMLTableCellElement,
  TableHeaderCellProps
>(({ children, className, sortable, align = "start", pinned, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "text-label-large font-medium text-on-surface-variant whitespace-nowrap",
      "bg-surface-container-low border-b border-outline-variant",
      sortable && "cursor-pointer select-none hover:bg-surface-container",
      align === "start" && "text-left",
      align === "center" && "text-center",
      align === "end" && "text-right",
      pinned === "left" && "sticky z-[9] isolate",
      pinned === "right" && "sticky z-[9] isolate",
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
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ children, className, align = "start", pinned, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        "text-body-medium text-on-surface whitespace-nowrap overflow-hidden text-ellipsis",
        "bg-surface border-b border-outline-variant/50",
        "group-hover:bg-surface-container-low transition-colors",
        align === "start" && "text-left",
        align === "center" && "text-center",
        align === "end" && "text-right",
        pinned === "left" && "sticky z-[9] isolate",
        pinned === "right" && "sticky z-[9] isolate",
        className
      )}
      {...props}
    >
      {children}
    </td>
  )
);
TableCell.displayName = "TableCell";
