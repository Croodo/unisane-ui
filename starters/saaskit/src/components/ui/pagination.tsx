import React, { isValidElement, cloneElement } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, Slot } from "@/src/lib/utils";
import { Text } from "@/src/primitives/text";
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
  getPageHref?: (page: number) => string;
  renderLink?: (page: number, children: React.ReactNode) => React.ReactNode;
};

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
  getPageHref,
  renderLink,
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

  const renderPageButton = (page: number) => {
    const isCurrent = page === currentPage;
    const buttonClasses = cn(
      "relative w-12 h-12 rounded-sm flex items-center justify-center transition-colors overflow-hidden",
      isCurrent
        ? "bg-primary text-on-primary"
        : "text-on-surface-variant hover:bg-on-surface/10"
    );

    const innerContent = (
      <>
        <Ripple />
        <Text variant="bodyMedium" className="relative z-10">{page}</Text>
      </>
    );

    // renderLink pattern: render user's custom Link component
    if (renderLink) {
      const customLink = renderLink(page, innerContent);
      if (isValidElement(customLink)) {
        return (
          <Slot
            className={buttonClasses}
            aria-current={isCurrent ? "page" : undefined}
            aria-label={`Page ${page}`}
          >
            {customLink}
          </Slot>
        );
      }
    }

    // getPageHref: render as anchor
    if (getPageHref) {
      return (
        <a
          href={getPageHref(page)}
          className={buttonClasses}
          onClick={(e) => {
            e.preventDefault();
            onPageChange(page);
          }}
          aria-current={isCurrent ? "page" : undefined}
          aria-label={`Page ${page}`}
        >
          {innerContent}
        </a>
      );
    }

    return (
      <button
        className={buttonClasses}
        onClick={() => onPageChange(page)}
        aria-current={isCurrent ? "page" : undefined}
        aria-label={`Page ${page}`}
      >
        {innerContent}
      </button>
    );
  };

  return (
    <nav
      className={cn(paginationVariants({ className }))}
      aria-label="Pagination"
    >
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
              renderPageButton(page as number)
            )}
          </React.Fragment>
        ))}
      </div>

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
