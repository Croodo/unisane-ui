import React from "react";
import { cn } from "@ui/lib/utils";

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className="w-full overflow-x-auto rounded-sm border border-outline-variant/30 bg-surface">
    <table
      className={cn("w-full min-w-max caption-bottom text-body-small border-collapse", className)}
      {...props}
    >
      {children}
    </table>
  </div>
);

export const TableHeader: React.FC<
  React.HTMLAttributes<HTMLTableSectionElement>
> = ({ className, ...props }) => (
  <thead
    className={cn(
      "bg-surface-container-low border-b border-outline-variant/30 sticky top-0 z-10",
      className
    )}
    {...props}
  />
);

export const TableBody: React.FC<
  React.HTMLAttributes<HTMLTableSectionElement>
> = ({ className, ...props }) => (
  <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  className,
  ...props
}) => (
  <tr
    className={cn(
      "border-b border-outline-variant/15 transition-colors hover:bg-surface-container-low",
      className
    )}
    {...props}
  />
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  scope = "col",
  ...props
}) => (
  <th
    scope={scope}
    className={cn(
      "h-11 px-6 text-left align-middle font-medium text-label-medium text-on-surface-variant select-none whitespace-nowrap",
      className
    )}
    {...props}
  />
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  ...props
}) => (
  <td
    className={cn("px-6 py-4 align-middle text-on-surface font-medium tabular-nums", className)}
    {...props}
  />
);
