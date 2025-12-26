import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { stateLayers } from "../../utils/state-layers";

const tableVariants = cva("w-full border-collapse", {
  variants: {
    dense: {
      true: "",
      false: "",
    },
  },
  defaultVariants: {
    dense: false,
  },
});

interface TableProps
  extends React.TableHTMLAttributes<HTMLTableElement>,
    VariantProps<typeof tableVariants> {}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ dense = false, className, children, ...props }, ref) => {
    return (
      <div className="w-full overflow-x-auto">
        <table
          ref={ref}
          className={cn(tableVariants({ dense }), className)}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  }
);

Table.displayName = "Table";

// Table Header
export const TableHeader = forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <thead
        ref={ref}
        className={cn("border-b border-outline-variant", className)}
        {...props}
      >
        {children}
      </thead>
    );
  }
);

TableHeader.displayName = "TableHeader";

// Table Body
export const TableBody = forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <tbody ref={ref} className={className} {...props}>
        {children}
      </tbody>
    );
  }
);

TableBody.displayName = "TableBody";

// Table Footer
export const TableFooter = forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <tfoot
        ref={ref}
        className={cn("border-t border-outline-variant bg-surface-container", className)}
        {...props}
      >
        {children}
      </tfoot>
    );
  }
);

TableFooter.displayName = "TableFooter";

// Table Row
const tableRowVariants = cva("border-b border-outline-variant/30 transition-colors duration-short", {
  variants: {
    selected: {
      true: "bg-secondary-container/50",
      false: "",
    },
    interactive: {
      true: `${stateLayers.hover} cursor-pointer`,
      false: "",
    },
  },
  defaultVariants: {
    selected: false,
    interactive: false,
  },
});

interface TableRowProps
  extends React.HTMLAttributes<HTMLTableRowElement>,
    VariantProps<typeof tableRowVariants> {}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ selected = false, interactive = false, className, children, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={cn(tableRowVariants({ selected, interactive }), className)}
        {...props}
      >
        {children}
      </tr>
    );
  }
);

TableRow.displayName = "TableRow";

// Table Head Cell
const tableHeadVariants = cva("h-14u px-4u text-title-small font-medium text-on-surface text-left", {
  variants: {
    sortable: {
      true: `cursor-pointer select-none ${stateLayers.hover}`,
      false: "",
    },
  },
  defaultVariants: {
    sortable: false,
  },
});

interface TableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement>,
    VariantProps<typeof tableHeadVariants> {
  sorted?: "asc" | "desc" | false;
  onSort?: () => void;
}

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ sortable = false, sorted = false, onSort, className, children, ...props }, ref) => {
    return (
      <th
        ref={ref}
        className={cn(tableHeadVariants({ sortable }), className)}
        onClick={sortable ? onSort : undefined}
        {...props}
      >
        <div className="flex items-center gap-2u">
          <span>{children}</span>
          {sortable && (
            <span className="material-symbols-outlined w-4.5u h-4.5u text-on-surface-variant">
              {sorted && sorted === "asc" ? "arrow_upward" : sorted && sorted === "desc" ? "arrow_downward" : "unfold_more"}
            </span>
          )}
        </div>
      </th>
    );
  }
);

TableHead.displayName = "TableHead";

// Table Cell
export const TableCell = forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <td
        ref={ref}
        className={cn("h-13u px-4u text-body-medium text-on-surface", className)}
        {...props}
      >
        {children}
      </td>
    );
  }
);

TableCell.displayName = "TableCell";

// Table Caption
export const TableCaption = forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <caption
        ref={ref}
        className={cn("mt-4u text-body-small text-on-surface-variant", className)}
        {...props}
      >
        {children}
      </caption>
    );
  }
);

TableCaption.displayName = "TableCaption";