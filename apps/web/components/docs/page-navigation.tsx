"use client";

import Link from "next/link";
import { cn } from "@unisane/ui/lib/utils";

interface PageLink {
  slug: string;
  name: string;
}

interface PageNavigationProps {
  previous?: PageLink;
  next?: PageLink;
  className?: string;
}

/**
 * Previous/Next navigation for component docs
 * - Stacks vertically on mobile
 * - Side-by-side on larger screens (@md+)
 * - Responsive text sizes and padding
 */
export function PageNavigation({ previous, next, className }: PageNavigationProps) {
  if (!previous && !next) return null;

  return (
    <div className={cn("grid grid-cols-1 @md:grid-cols-2 gap-3 @md:gap-4", className)}>
      {/* Previous */}
      {previous ? (
        <Link
          href={`/docs/components/${previous.slug}`}
          className="group flex items-center gap-3 p-3 @md:p-4 rounded-lg border border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant group-hover:text-primary transition-colors shrink-0">
            arrow_back
          </span>
          <div className="flex flex-col min-w-0">
            <span className="text-label-small text-on-surface-variant">
              Previous
            </span>
            <span className="text-body-medium @md:text-title-medium font-medium text-on-surface group-hover:text-primary transition-colors truncate">
              {previous.name}
            </span>
          </div>
        </Link>
      ) : (
        <div className="hidden @md:block" />
      )}

      {/* Next */}
      {next ? (
        <Link
          href={`/docs/components/${next.slug}`}
          className="group flex items-center justify-end gap-3 p-3 @md:p-4 rounded-lg border border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-container-low transition-colors"
        >
          <div className="flex flex-col items-end min-w-0">
            <span className="text-label-small text-on-surface-variant">
              Up next
            </span>
            <span className="text-body-medium @md:text-title-medium font-medium text-on-surface group-hover:text-primary transition-colors truncate">
              {next.name}
            </span>
          </div>
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant group-hover:text-primary transition-colors shrink-0">
            arrow_forward
          </span>
        </Link>
      ) : (
        <div className="hidden @md:block" />
      )}
    </div>
  );
}
