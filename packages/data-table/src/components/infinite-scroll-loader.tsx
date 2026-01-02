"use client";

import React, { forwardRef } from "react";
import { cn, Icon } from "@unisane/ui";
import { useI18n } from "../i18n";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface InfiniteScrollLoaderProps {
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Whether there's more data to load */
  hasMore: boolean;
  /** Error that occurred during loading */
  error?: Error | null;
  /** Callback to retry loading */
  onRetry?: () => void;
  /** Custom loading message */
  loadingMessage?: string;
  /** Custom end message when no more data */
  endMessage?: string;
  /** Custom error message */
  errorMessage?: string;
  /** Additional class name */
  className?: string;
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

/**
 * Loading indicator component for infinite scroll.
 *
 * Shows:
 * - Loading spinner when loading more data
 * - "No more items" message when all data is loaded
 * - Error message with retry button on failure
 *
 * Should be placed at the bottom of the scrollable list.
 * The sentinel ref from useInfiniteScroll should be attached to this component
 * or a nearby element.
 *
 * @example
 * ```tsx
 * const { sentinelRef, isLoading, hasMore, error, loadMore } = useInfiniteScroll({
 *   onLoadMore: fetchMoreData,
 * });
 *
 * return (
 *   <div>
 *     {data.map(renderItem)}
 *     <InfiniteScrollLoader
 *       ref={sentinelRef}
 *       isLoading={isLoading}
 *       hasMore={hasMore}
 *       error={error}
 *       onRetry={loadMore}
 *     />
 *   </div>
 * );
 * ```
 */
export const InfiniteScrollLoader = forwardRef<
  HTMLDivElement,
  InfiniteScrollLoaderProps
>(function InfiniteScrollLoader(
  {
    isLoading,
    hasMore,
    error,
    onRetry,
    loadingMessage,
    endMessage,
    errorMessage,
    className,
  },
  ref
) {
  const { t } = useI18n();

  // Error state
  if (error) {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center py-4 gap-2",
          className
        )}
        role="alert"
      >
        <Icon symbol="error" className="text-error text-[20px]" />
        <span className="text-body-medium text-error">
          {errorMessage ?? error.message ?? t("errorMessage")}
        </span>
        {onRetry && (
          <button
            onClick={onRetry}
            className={cn(
              "px-4 py-2 rounded-full text-label-large",
              "bg-error-container text-on-error-container",
              "hover:bg-error-container/80 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
            )}
          >
            {t("retry")}
          </button>
        )}
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center py-4 gap-2",
          className
        )}
        role="status"
        aria-live="polite"
      >
        <Icon
          symbol="progress_activity"
          className="text-primary text-[20px] animate-spin"
        />
        <span className="text-body-medium text-on-surface-variant">
          {loadingMessage ?? t("loadingMore")}
        </span>
      </div>
    );
  }

  // No more data
  if (!hasMore) {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center py-4",
          className
        )}
      >
        <span className="text-body-small text-on-surface-variant">
          {endMessage ?? t("endOfList")}
        </span>
      </div>
    );
  }

  // Invisible sentinel element (triggers intersection observer)
  return (
    <div
      ref={ref}
      className={cn("h-1", className)}
      aria-hidden="true"
    />
  );
});

export default InfiniteScrollLoader;
