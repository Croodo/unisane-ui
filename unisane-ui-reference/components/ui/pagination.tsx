"use client";

import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { Button } from "./button";

const paginationButtonVariants = cva(
  "inline-flex items-center justify-center rounded-sm font-medium transition-all duration-short focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
  {
    variants: {
      size: {
        sm: "h-8u min-w-8u px-2u text-label-medium",
        md: "h-10u min-w-10u px-3u text-label-large",
        lg: "h-12u min-w-12u px-4u text-title-medium",
      },
      disabled: {
        true: "opacity-38 cursor-not-allowed",
        false: "cursor-pointer",
      },
    },
    defaultVariants: {
      size: "md",
      disabled: false,
    },
  }
);

const pageButtonVariants = cva("", {
  variants: {
    active: {
      true: "bg-primary text-on-primary shadow-1",
      false: "bg-surface text-on-surface hover:bg-on-surface/8",
    },
  },
  defaultVariants: {
    active: false,
  },
});

const navButtonVariants = cva("bg-surface text-on-surface", {
  variants: {
    isDisabled: {
      true: "opacity-38",
      false: "hover:bg-on-surface/8",
    },
  },
  defaultVariants: {
    isDisabled: false,
  },
});

interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

export const Pagination = forwardRef<HTMLDivElement, PaginationProps>(
  (
    {
      currentPage,
      totalPages,
      onPageChange,
      siblingCount = 1,
      showFirstLast = true,
      showPrevNext = true,
      size = "md",
      disabled = false,
      className = "",
      ...props
    },
    ref
  ) => {
    const range = (start: number, end: number) => {
      const length = end - start + 1;
      return Array.from({ length }, (_, idx) => start + idx);
    };

    const generatePagination = () => {
      const totalNumbers = siblingCount * 2 + 3; // siblings + current + first + last
      const totalBlocks = totalNumbers + 2; // + 2 ellipsis

      if (totalPages <= totalBlocks) {
        return range(1, totalPages);
      }

      const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
      const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

      const showLeftEllipsis = leftSiblingIndex > 2;
      const showRightEllipsis = rightSiblingIndex < totalPages - 1;

      if (!showLeftEllipsis && showRightEllipsis) {
        const leftItemCount = 3 + 2 * siblingCount;
        const leftRange = range(1, leftItemCount);
        return [...leftRange, "ellipsis", totalPages];
      }

      if (showLeftEllipsis && !showRightEllipsis) {
        const rightItemCount = 3 + 2 * siblingCount;
        const rightRange = range(totalPages - rightItemCount + 1, totalPages);
        return [1, "ellipsis", ...rightRange];
      }

      const middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [1, "ellipsis", ...middleRange, "ellipsis", totalPages];
    };

    const pages = generatePagination();

    const pageButton = (page: number, isActive: boolean) => (
      <button
        key={page}
        type="button"
        onClick={() => !disabled && onPageChange(page)}
        disabled={disabled}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          paginationButtonVariants({ size, disabled }),
          pageButtonVariants({ active: isActive })
        )}
      >
        {page}
      </button>
    );

    const navButton = (
      direction: "first" | "prev" | "next" | "last",
      isDisabled: boolean
    ) => {
      const icons = {
        first: "first_page",
        prev: "chevron_left",
        next: "chevron_right",
        last: "last_page",
      };

      const labels = {
        first: "First page",
        prev: "Previous page",
        next: "Next page",
        last: "Last page",
      };

      const handlers = {
        first: () => onPageChange(1),
        prev: () => onPageChange(currentPage - 1),
        next: () => onPageChange(currentPage + 1),
        last: () => onPageChange(totalPages),
      };

      return (
        <button
          type="button"
          onClick={() => !disabled && !isDisabled && handlers[direction]()}
          disabled={disabled || isDisabled}
          aria-label={labels[direction]}
          className={cn(
            paginationButtonVariants({ size, disabled }),
            navButtonVariants({ isDisabled: isDisabled || disabled })
          )}
        >
          <span className="material-symbols-outlined">{icons[direction]}</span>
        </button>
      );
    };

    return (
      <nav
        ref={ref}
        role="navigation"
        aria-label="Pagination"
        className={cn("flex items-center gap-1u", className)}
        {...props}
      >
        {showFirstLast && navButton("first", currentPage === 1)}
        {showPrevNext && navButton("prev", currentPage === 1)}

        {pages.map((page, index) => {
          if (page === "ellipsis") {
            return (
              <span
                key={`ellipsis-${index}`}
                className={cn(
                  paginationButtonVariants({ size }),
                  "bg-transparent text-on-surface-variant cursor-default"
                )}
                aria-hidden="true"
              >
                ...
              </span>
            );
          }
          return pageButton(page as number, page === currentPage);
        })}

        {showPrevNext && navButton("next", currentPage === totalPages)}
        {showFirstLast && navButton("last", currentPage === totalPages)}
      </nav>
    );
  }
);

Pagination.displayName = "Pagination";

// Simple pagination variant
interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageInfo?: boolean;
  disabled?: boolean;
  className?: string;
}

export const SimplePagination = ({
  currentPage,
  totalPages,
  onPageChange,
  showPageInfo = true,
  disabled = false,
  className,
}: SimplePaginationProps) => {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <Button
        variant="outlined"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={disabled || currentPage === 1}
      >
        <span className="material-symbols-outlined">chevron_left</span>
        Previous
      </Button>

      {showPageInfo && (
        <span className="text-body-medium text-on-surface-variant mx-4u">
          Page {currentPage} of {totalPages}
        </span>
      )}

      <Button
        variant="outlined"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={disabled || currentPage === totalPages}
      >
        Next
        <span className="material-symbols-outlined">chevron_right</span>
      </Button>
    </div>
  );
};