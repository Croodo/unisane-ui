"use client";

import React, { forwardRef, useRef, useEffect, useCallback, createContext, useContext, useState } from "react";
import { cn } from "@unisane/ui";
import { useOptionalDataTableContext } from "../context/provider";
import { useSafeRAF } from "../hooks/use-safe-raf";

// ─── SCROLL SYNC CONTEXT ─────────────────────────────────────────────────────
// Context to synchronize horizontal scroll between header and body tables

interface ScrollSyncContextValue {
  scrollLeft: number;
  setScrollLeft: (left: number) => void;
  registerScrollElement: (id: string, element: HTMLElement | null) => void;
  unregisterScrollElement: (id: string) => void;
}

const ScrollSyncContext = createContext<ScrollSyncContextValue | null>(null);

export function useScrollSync() {
  const context = useContext(ScrollSyncContext);
  if (!context) {
    throw new Error("useScrollSync must be used within DataTableLayout");
  }
  return context;
}

// ─── DATA TABLE LAYOUT ───────────────────────────────────────────────────────
// Root container for split-table layout with synchronized horizontal scrolling.
//
// Architecture:
// ┌─────────────────────────────────────────────────────────────────────┐
// │ DataTableLayout                                                      │
// │ ┌─────────────────────────────────────────────────────────────────┐ │
// │ │ StickyZone (sticky top-0)                                       │ │
// │ │ ├── Toolbar (DataTableToolbar)                                  │ │
// │ │ ├── ActiveFiltersBar                                            │ │
// │ │ ├── GroupingPillsBar                                            │ │
// │ │ └── ScrollableHeader (overflow-x-auto, synced)                  │ │
// │ │     └── <table><thead>...</thead></table>                       │ │
// │ └─────────────────────────────────────────────────────────────────┘ │
// │ ┌─────────────────────────────────────────────────────────────────┐ │
// │ │ ScrollableBody (overflow-x-auto, synced)                        │ │
// │ │ └── <table><tbody>...</tbody><tfoot>...</tfoot></table>         │ │
// │ └─────────────────────────────────────────────────────────────────┘ │
// │ CustomScrollbar                                                      │
// │ DataTablePagination                                                  │
// └─────────────────────────────────────────────────────────────────────┘

interface DataTableLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const DataTableLayout = forwardRef<HTMLDivElement, DataTableLayoutProps>(
  ({ children, className, ...props }, ref) => {
    const [scrollLeft, setScrollLeft] = useState(0);
    const scrollElementsRef = useRef<Map<string, HTMLElement>>(new Map());
    const isSyncingRef = useRef(false);

    // Safe RAF for scroll sync
    const { requestFrame } = useSafeRAF();

    const registerScrollElement = useCallback((id: string, element: HTMLElement | null) => {
      if (element) {
        scrollElementsRef.current.set(id, element);
      } else {
        scrollElementsRef.current.delete(id);
      }
    }, []);

    const unregisterScrollElement = useCallback((id: string) => {
      scrollElementsRef.current.delete(id);
    }, []);

    const handleSetScrollLeft = useCallback((left: number) => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;

      setScrollLeft(left);

      // Sync all registered scroll elements
      scrollElementsRef.current.forEach((element) => {
        if (element.scrollLeft !== left) {
          element.scrollLeft = left;
        }
      });

      // Reset syncing flag after a frame
      requestFrame(() => {
        isSyncingRef.current = false;
      });
    }, [requestFrame]);

    const contextValue: ScrollSyncContextValue = {
      scrollLeft,
      setScrollLeft: handleSetScrollLeft,
      registerScrollElement,
      unregisterScrollElement,
    };

    return (
      <ScrollSyncContext.Provider value={contextValue}>
        {/* SSR-safe scrollbar hiding styles */}
        <style dangerouslySetInnerHTML={{ __html: `
          /* Body scroll container: hide scrollbar on tablet+ (custom scrollbar used instead) */
          @media (min-width: 768px) {
            [data-datatable-scroll="body"] {
              scrollbar-width: none;
              -ms-overflow-style: none;
            }
            [data-datatable-scroll="body"]::-webkit-scrollbar {
              display: none;
            }
          }
          /* Header scroll container: always hide scrollbar (syncs with body, no independent scroll needed) */
          [data-datatable-scroll="header"] {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          [data-datatable-scroll="header"]::-webkit-scrollbar {
            display: none;
          }
        `}} />
        <div
          ref={ref}
          className={cn("relative bg-surface border-t border-outline-variant/50 @container", className)}
          {...props}
        >
          {children}
        </div>
      </ScrollSyncContext.Provider>
    );
  }
);
DataTableLayout.displayName = "DataTableLayout";

// ─── STICKY ZONE ─────────────────────────────────────────────────────────────
// Contains toolbar, filters, grouping pills - all sticky together at top.
// Automatically measures its height and sets --data-table-header-offset CSS variable
// on the parent DataTableLayout so the table header can position correctly.

interface StickyZoneProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Offset from the top for sticky positioning (e.g., to account for fixed headers) */
  stickyOffset?: string;
}

export const StickyZone = forwardRef<HTMLDivElement, StickyZoneProps>(
  ({ children, className, style, stickyOffset: stickyOffsetProp, ...props }, ref) => {
    const internalRef = useRef<HTMLDivElement>(null);

    // Get stickyOffset from context if available, otherwise use prop or default
    const context = useOptionalDataTableContext();
    const stickyOffset = stickyOffsetProp ?? context?.config.stickyOffset ?? "var(--app-header-height, 0px)";
    const parentRef = useRef<HTMLElement | null>(null);

    // Measure height and update parent's CSS variable
    useEffect(() => {
      const element = internalRef.current;
      if (!element) return;

      // Find the DataTableLayout parent
      parentRef.current = element.parentElement;

      const updateHeight = () => {
        const height = element.offsetHeight;
        if (parentRef.current) {
          parentRef.current.style.setProperty("--data-table-header-offset", `${height}px`);
        }
      };

      // Initial measurement
      updateHeight();

      // Observe size changes
      const observer = new ResizeObserver(updateHeight);
      observer.observe(element);

      return () => {
        observer.disconnect();
        if (parentRef.current) {
          parentRef.current.style.removeProperty("--data-table-header-offset");
        }
      };
    }, []);

    return (
      <div
        ref={(node) => {
          internalRef.current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={cn(
          // z-20: Below sidebar drawer (z-30) so drawer overlays table when open
          "sticky z-20 bg-surface",
          className
        )}
        style={{
          // Use stickyOffset prop (defaults to --app-header-height CSS variable)
          // This allows the DataTable to work with any layout's fixed header
          top: stickyOffset,
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
StickyZone.displayName = "StickyZone";

// ─── SYNCED SCROLL CONTAINER ─────────────────────────────────────────────────
// Generic horizontal scroll container that syncs with other containers

interface SyncedScrollContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Unique ID for this scroll container (for sync registration) */
  scrollId: string;
}

export const SyncedScrollContainer = forwardRef<HTMLDivElement, SyncedScrollContainerProps>(
  ({ children, className, scrollId, ...props }, ref) => {
    const { setScrollLeft, registerScrollElement, unregisterScrollElement } = useScrollSync();
    const internalRef = useRef<HTMLDivElement>(null);

    // Register this scroll element
    useEffect(() => {
      const element = internalRef.current;
      registerScrollElement(scrollId, element);
      return () => unregisterScrollElement(scrollId);
    }, [scrollId, registerScrollElement, unregisterScrollElement]);

    // Handle scroll event
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
      setScrollLeft(e.currentTarget.scrollLeft);
    }, [setScrollLeft]);


    // Hide native scrollbar on desktop (tablet+), show on mobile for touch usability
    // Custom scrollbar component is used on desktop instead
    return (
      <div
        ref={(node) => {
          internalRef.current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        data-datatable-scroll="body"
        className={cn(
          "overflow-x-auto",
          // Hide native scrollbar - uses global CSS for cross-browser support
          // See: data-datatable-scroll attribute and injected styles
          className
        )}
        onScroll={handleScroll}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SyncedScrollContainer.displayName = "SyncedScrollContainer";

// ─── STICKY HEADER SCROLL CONTAINER ─────────────────────────────────────────
// Special container for sticky header that syncs horizontal scroll with body.
// Uses native overflow-x scroll (synced via context) so position:sticky works for pinned cells.
// Dropdowns use portal rendering to escape overflow clipping.
// Scrollbar is always hidden (syncs with body which has native scrollbar on mobile, custom on desktop).
// Adds elevation shadow when the header becomes "stuck" during vertical scroll.

interface StickyHeaderScrollContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const StickyHeaderScrollContainer = forwardRef<HTMLDivElement, StickyHeaderScrollContainerProps>(
  ({ children, className, style, ...props }, ref) => {
    const { scrollLeft, setScrollLeft, registerScrollElement, unregisterScrollElement } = useScrollSync();
    const [isStuck, setIsStuck] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Register this scroll element for sync
    useEffect(() => {
      const element = containerRef.current;
      registerScrollElement("header", element);
      return () => unregisterScrollElement("header");
    }, [registerScrollElement, unregisterScrollElement]);

    // Sync scroll position from context (when body scrolls)
    useEffect(() => {
      const element = containerRef.current;
      if (element && element.scrollLeft !== scrollLeft) {
        element.scrollLeft = scrollLeft;
      }
    }, [scrollLeft]);

    // Handle scroll event (when header is scrolled directly - shouldn't happen often with hidden scrollbar)
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
      setScrollLeft(e.currentTarget.scrollLeft);
    }, [setScrollLeft]);

    // Use Intersection Observer to detect when header becomes stuck
    // A sentinel element is placed just above the sticky header
    // When the sentinel goes out of view (intersectionRatio < 1), header is stuck
    useEffect(() => {
      const sentinel = sentinelRef.current;
      if (!sentinel) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          // Header is stuck when sentinel is not fully visible
          setIsStuck(entry ? !entry.isIntersecting : false);
        },
        {
          // Use the nearest scrolling ancestor as root
          root: null,
          // Trigger when sentinel starts to leave viewport
          threshold: 0,
          // Small negative margin to trigger slightly before the sentinel leaves
          rootMargin: "0px 0px 0px 0px",
        }
      );

      observer.observe(sentinel);
      return () => observer.disconnect();
    }, []);

    return (
      <>
        {/* Sentinel element - positioned just above the sticky container */}
        {/* When this scrolls out of view, we know the header is stuck */}
        <div
          ref={sentinelRef}
          className="h-px w-full pointer-events-none"
          aria-hidden="true"
        />
        <div
          ref={(node) => {
            containerRef.current = node;
            if (typeof ref === "function") {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          data-datatable-scroll="header"
          className={cn(
            "overflow-x-auto transition-shadow duration-200",
            isStuck && "shadow-[0_2px_4px_-1px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.06)]",
            className
          )}
          style={style}
          onScroll={handleScroll}
          {...props}
        >
          {children}
        </div>
      </>
    );
  }
);
StickyHeaderScrollContainer.displayName = "StickyHeaderScrollContainer";

// ─── SPLIT TABLE COMPONENTS ──────────────────────────────────────────────────
// Separate table elements for header and body to allow sticky behavior

interface HeaderTableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
  tableWidth?: number;
}

export const HeaderTable = forwardRef<HTMLTableElement, HeaderTableProps>(
  ({ children, className, tableWidth, style, ...props }, ref) => (
    <table
      ref={ref}
      role="presentation"
      aria-hidden="true"
      className={cn(
        "w-full border-separate border-spacing-0 table-fixed",
        className
      )}
      style={{
        minWidth: tableWidth ? `${tableWidth}px` : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </table>
  )
);
HeaderTable.displayName = "HeaderTable";

interface BodyTableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
  tableWidth?: number;
}

export const BodyTable = forwardRef<HTMLTableElement, BodyTableProps>(
  ({ children, className, tableWidth, style, ...props }, ref) => (
    <table
      ref={ref}
      role="grid"
      className={cn(
        "w-full border-separate border-spacing-0 table-fixed",
        className
      )}
      style={{
        minWidth: tableWidth ? `${tableWidth}px` : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </table>
  )
);
BodyTable.displayName = "BodyTable";
