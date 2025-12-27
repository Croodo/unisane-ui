import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Text } from "@/primitives/text";
import { IconButton } from "./icon-button";
import { Ripple } from "./ripple";

const paginationVariants = cva("flex items-center gap-2", {
  variants: {
    variant: {
      default: "",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export type PaginationProps = VariantProps<typeof paginationVariants> & {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
}) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav
      className={cn(paginationVariants({ className }))}
      aria-label="Pagination"
    >
      {/* Previous button */}
      <IconButton
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        }
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        ariaLabel="Previous page"
        className="text-on-surface-variant"
      />

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) => (
          <React.Fragment key={index}>
            {page === "..." ? (
              <Text
                variant="bodyMedium"
                className="px-2 text-on-surface-variant"
              >
                ...
              </Text>
            ) : (
              <button
                className={cn(
                  "relative w-10u h-10u rounded-full flex items-center justify-center transition-colors overflow-hidden",
                  page === currentPage
                    ? "bg-primary text-on-primary"
                    : "text-on-surface-variant hover:bg-on-surface/10"
                )}
                onClick={() => onPageChange(page as number)}
                aria-current={page === currentPage ? "page" : undefined}
                aria-label={`Page ${page}`}
              >
                <Ripple />
                <Text variant="bodyMedium" className="relative z-10">{page}</Text>
              </button>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Next button */}
      <IconButton
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
          </svg>
        }
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        ariaLabel="Next page"
        className="text-on-surface-variant"
      />
    </nav>
  );
};
