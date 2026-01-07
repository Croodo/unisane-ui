import React from "react";
import type { PaginationState } from "../types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PAGE_SIZE_OPTIONS } from "../constants";

interface CursorPagination {
  nextCursor?: string | undefined;
  prevCursor?: string | undefined;
  onNext: () => void;
  onPrev: () => void;
  limit: number;
  onLimitChange?: ((n: number) => void) | undefined;
  pageIndex?: number | undefined;
}

export interface DataTablePaginationProps {
  mode?: "page" | "cursor" | undefined;
  cursor?: CursorPagination | undefined;
  totalItems?: number | undefined;
  currentCount?: number | undefined;
  pagination: PaginationState;
  onPaginationChange: (newPagination: PaginationState) => void;
  pageSizeOptions: number[];
}

export const DataTablePagination: React.FC<DataTablePaginationProps> = ({
  mode = "page",
  cursor,
  totalItems,
  currentCount,
  pagination,
  onPaginationChange,
  pageSizeOptions,
}) => {
  const { page, pageSize } = pagination;
  const totalPages =
    totalItems !== undefined
      ? Math.max(1, Math.ceil(totalItems / Math.max(pageSize, 1)))
      : 1;

  // Calculate start/end based on currentCount if available, otherwise fallback to page math
  // For cursor mode, use cursor.pageIndex if available
  const currentPage =
    mode === "cursor" && cursor?.pageIndex ? cursor.pageIndex : page;
  const currentLimit =
    mode === "cursor" && cursor?.limit ? cursor.limit : pageSize;

  // Calculate display range: "startItem - endItem of total"
  const startItem =
    currentCount !== undefined && currentCount > 0
      ? (currentPage - 1) * currentLimit + 1
      : currentCount === 0
        ? 0
        : (currentPage - 1) * currentLimit + 1;

  const endItem =
    currentCount !== undefined
      ? currentCount === 0
        ? 0
        : startItem + currentCount - 1
      : totalItems !== undefined
        ? Math.min(currentPage * currentLimit, totalItems)
        : currentPage * currentLimit;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      onPaginationChange({ ...pagination, page: newPage });
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = Number(e.target.value);
    onPaginationChange({ page: 1, pageSize: newSize });
  };

  if (mode === "cursor" && cursor) {
    return (
      <div className="flex items-center justify-end px-3 py-2 border-t border-border bg-background text-xs text-muted-foreground select-none gap-3">
        <div className="flex items-center gap-2">
          <span className="text-foreground">Rows:</span>
          {cursor.onLimitChange ? (
            <div className="relative">
              <select
                value={cursor.limit}
                onChange={(e) => cursor.onLimitChange?.(Number(e.target.value))}
                className="appearance-none h-8 bg-background border border-border rounded-md font-medium text-foreground pl-3 pr-8 py-1 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-colors hover:bg-accent"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                <svg
                  className="h-4 w-4 text-muted-foreground"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          ) : (
            <span className="font-medium text-foreground">{cursor.limit}</span>
          )}
        </div>

        {/* Display count and total */}
        <div className="mx-2 text-foreground">
          {startItem}-{endItem}
          {totalItems !== undefined && ` of ${totalItems.toLocaleString()}`}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => cursor.prevCursor && cursor.onPrev()}
            disabled={!cursor.prevCursor}
            className={`p-1 rounded transition-colors ${
              cursor.prevCursor
                ? "text-foreground hover:bg-muted"
                : "text-muted-foreground/40 cursor-not-allowed"
            }`}
            aria-label="Previous page"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => cursor.nextCursor && cursor.onNext()}
            disabled={!cursor.nextCursor}
            className={`p-1 rounded transition-colors ${
              cursor.nextCursor
                ? "text-foreground hover:bg-muted"
                : "text-muted-foreground/40 cursor-not-allowed"
            }`}
            aria-label="Next page"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end px-3 py-2 border-t border-border bg-background text-xs text-muted-foreground select-none">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <div className="relative">
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="appearance-none h-8 bg-background border border-border rounded-md font-medium text-foreground pl-3 pr-8 py-1 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-colors hover:bg-accent"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
              <svg
                className="h-4 w-4 text-muted-foreground"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="mx-2 text-foreground">
          {startItem}-{endItem}
          {totalItems !== undefined && ` of ${totalItems.toLocaleString()}`}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className={`p-1 rounded transition-colors ${
              page === 1
                ? "text-muted-foreground/40 cursor-not-allowed"
                : "text-foreground hover:bg-muted"
            }`}
            aria-label="Previous page"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className={`p-1 rounded transition-colors ${
              page === totalPages
                ? "text-muted-foreground/40 cursor-not-allowed"
                : "text-foreground hover:bg-muted"
            }`}
            aria-label="Next page"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
