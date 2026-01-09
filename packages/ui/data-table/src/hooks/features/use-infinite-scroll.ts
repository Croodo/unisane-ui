"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { SCROLL_CONSTANTS } from "../../constants";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface UseInfiniteScrollOptions {
  /**
   * Whether infinite scroll is enabled.
   * @default true
   */
  enabled?: boolean;

  /**
   * Callback to load more data.
   * Should return true if there's more data to load, false otherwise.
   */
  onLoadMore: () => Promise<boolean> | boolean;

  /**
   * Whether there's more data available to load.
   * When false, onLoadMore won't be called.
   * @default true
   */
  hasMore?: boolean;

  /**
   * Distance from bottom (in pixels) to trigger loading.
   * @default 200
   */
  threshold?: number;

  /**
   * Debounce delay for scroll events in milliseconds.
   * @default 150
   */
  debounceMs?: number;

  /**
   * Whether to load initial data on mount.
   * @default false
   */
  loadOnMount?: boolean;

  /**
   * Root margin for intersection observer (CSS margin syntax).
   * Alternative to threshold for more precise control.
   */
  rootMargin?: string;
}

export interface UseInfiniteScrollReturn {
  /**
   * Whether data is currently being loaded.
   */
  isLoading: boolean;

  /**
   * Any error that occurred during loading.
   */
  error: Error | null;

  /**
   * Whether there's more data to load.
   */
  hasMore: boolean;

  /**
   * Ref to attach to the scroll container.
   */
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;

  /**
   * Ref to attach to a sentinel element at the bottom of the list.
   * When this element becomes visible, more data is loaded.
   */
  sentinelRef: React.RefObject<HTMLDivElement | null>;

  /**
   * Manually trigger loading more data.
   */
  loadMore: () => Promise<void>;

  /**
   * Reset the infinite scroll state (clear error, reset hasMore).
   */
  reset: () => void;

  /**
   * Scroll event handler to attach to scroll container.
   * Use this if you prefer scroll-based loading over intersection observer.
   */
  onScroll: (event: React.UIEvent<HTMLElement>) => void;
}

// ─── HOOK ────────────────────────────────────────────────────────────────────

/**
 * Hook for implementing infinite scroll in a data table.
 *
 * Supports two modes:
 * 1. Intersection Observer (recommended): Attach sentinelRef to a sentinel element
 * 2. Scroll events: Use onScroll handler on the scroll container
 *
 * @example
 * ```tsx
 * // Using Intersection Observer (recommended)
 * const { sentinelRef, isLoading, hasMore } = useInfiniteScroll({
 *   onLoadMore: async () => {
 *     const newData = await fetchMoreData(page + 1);
 *     setData((prev) => [...prev, ...newData]);
 *     return newData.length > 0;
 *   },
 *   hasMore: page < totalPages,
 * });
 *
 * return (
 *   <div>
 *     {data.map(renderItem)}
 *     <div ref={sentinelRef} /> {/* Sentinel element *\/}
 *     {isLoading && <LoadingSpinner />}
 *   </div>
 * );
 *
 * // Using scroll events
 * const { scrollContainerRef, onScroll, isLoading } = useInfiniteScroll({
 *   onLoadMore: fetchMoreData,
 * });
 *
 * return (
 *   <div ref={scrollContainerRef} onScroll={onScroll} style={{ overflow: 'auto' }}>
 *     {data.map(renderItem)}
 *     {isLoading && <LoadingSpinner />}
 *   </div>
 * );
 * ```
 */
export function useInfiniteScroll({
  enabled = true,
  onLoadMore,
  hasMore: externalHasMore = true,
  threshold = SCROLL_CONSTANTS.THRESHOLD_PX,
  debounceMs = SCROLL_CONSTANTS.DEBOUNCE_MS,
  loadOnMount = false,
  rootMargin,
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
  // ─── STATE ─────────────────────────────────────────────────────────────────

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [internalHasMore, setInternalHasMore] = useState(true);

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingRef = useRef(false); // Prevents concurrent loads

  // Use external hasMore if provided, otherwise internal
  const hasMore = externalHasMore && internalHasMore;

  // ─── LOAD MORE ─────────────────────────────────────────────────────────────

  const loadMore = useCallback(async () => {
    if (!enabled || loadingRef.current || !hasMore) {
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const moreAvailable = await onLoadMore();
      if (!moreAvailable) {
        setInternalHasMore(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [enabled, hasMore, onLoadMore]);

  // ─── SCROLL HANDLER ────────────────────────────────────────────────────────

  const onScroll = useCallback(
    (event: React.UIEvent<HTMLElement>) => {
      if (!enabled || !hasMore || loadingRef.current) {
        return;
      }

      // Clear existing debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Debounce the scroll check
      debounceTimeoutRef.current = setTimeout(() => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;

        const { scrollTop, scrollHeight, clientHeight } = target;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

        if (distanceFromBottom <= threshold) {
          loadMore();
        }
      }, debounceMs);
    },
    [enabled, hasMore, threshold, debounceMs, loadMore]
  );

  // ─── INTERSECTION OBSERVER ─────────────────────────────────────────────────

  useEffect(() => {
    if (!enabled || !hasMore) {
      return;
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observerOptions: IntersectionObserverInit = {
      root: scrollContainerRef.current,
      rootMargin: rootMargin ?? `${threshold}px`,
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry?.isIntersecting && !loadingRef.current) {
        loadMore();
      }
    }, observerOptions);

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [enabled, hasMore, threshold, rootMargin, loadMore]);

  // ─── LOAD ON MOUNT ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (loadOnMount && enabled && hasMore) {
      loadMore();
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── CLEANUP ───────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // ─── RESET ─────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setError(null);
    setInternalHasMore(true);
    loadingRef.current = false;
    setIsLoading(false);
  }, []);

  // ─── RETURN ────────────────────────────────────────────────────────────────

  return {
    isLoading,
    error,
    hasMore,
    scrollContainerRef,
    sentinelRef,
    loadMore,
    reset,
    onScroll,
  };
}

export default useInfiniteScroll;
