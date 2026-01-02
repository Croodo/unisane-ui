"use client";

import React, { forwardRef, useRef, useEffect, useCallback, createContext, useContext, useState } from "react";
import { cn } from "@unisane/ui";

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
      requestAnimationFrame(() => {
        isSyncingRef.current = false;
      });
    }, []);

    const contextValue: ScrollSyncContextValue = {
      scrollLeft,
      setScrollLeft: handleSetScrollLeft,
      registerScrollElement,
      unregisterScrollElement,
    };

    return (
      <ScrollSyncContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn("relative bg-surface", className)}
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
}

export const StickyZone = forwardRef<HTMLDivElement, StickyZoneProps>(
  ({ children, className, style, ...props }, ref) => {
    const internalRef = useRef<HTMLDivElement>(null);
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
          "sticky top-0 z-30 bg-surface",
          className
        )}
        style={style}
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
          "overflow-x-auto",
          // Hide scrollbar - we use custom scrollbar
          "[&::-webkit-scrollbar]:hidden",
          className
        )}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
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
// Uses clip-path to clip horizontally while allowing vertical overflow for dropdowns.
// Uses translateX to sync scroll position from the body container via context.
// Sets --header-scroll-offset CSS variable so pinned cells can counter-translate.

interface StickyHeaderScrollContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const StickyHeaderScrollContainer = forwardRef<HTMLDivElement, StickyHeaderScrollContainerProps>(
  ({ children, className, style, ...props }, ref) => {
    const { scrollLeft } = useScrollSync();

    return (
      <div
        ref={ref}
        className={cn("relative overflow-x-clip", className)}
        style={{
          // clip-path clips horizontally but allows vertical overflow for dropdowns
          clipPath: "inset(0 0 -100vh 0)",
          // Provide scroll offset for pinned cells to counter-translate
          "--header-scroll-offset": `${scrollLeft}px`,
          ...style,
        } as React.CSSProperties}
        {...props}
      >
        <div
          style={{
            transform: `translateX(-${scrollLeft}px)`,
            willChange: "transform",
          }}
        >
          {children}
        </div>
      </div>
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
