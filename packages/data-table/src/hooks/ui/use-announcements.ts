"use client";

import { useCallback, useEffect, useRef, useId } from "react";
import type { MultiSortState, Column } from "../../types";
import { useI18n } from "../../i18n";
import { TIMING } from "../../constants";

// ─── TYPES ──────────────────────────────────────────────────────────────────

export interface UseAnnouncementsOptions<T> {
  /** Current sort state */
  sortState: MultiSortState;
  /** Column definitions for finding header names */
  columns: Column<T>[];
  /** Current column filters */
  columnFilters: Record<string, unknown>;
  /** Current search text */
  searchText: string;
  /** Selected rows count */
  selectedCount: number;
}

export interface UseAnnouncementsReturn {
  /** ID for the announcer region element */
  announcerRegionId: string;
  /** Function to manually announce a message */
  announce: (message: string) => void;
}

/**
 * Hook for managing screen reader announcements in the data table.
 *
 * Handles:
 * - Sort state change announcements
 * - Filter change announcements
 * - Manual announcements via the returned `announce` function
 *
 * Uses an assertive live region for immediate announcements.
 */
export function useAnnouncements<T>({
  sortState,
  columns,
  columnFilters,
  searchText,
}: UseAnnouncementsOptions<T>): UseAnnouncementsReturn {
  const { t } = useI18n();
  const announcerRegionId = useId();
  const announcementRef = useRef<string>("");
  const announceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track previous values for change detection
  const prevSortStateRef = useRef(sortState);
  const prevFilterCountRef = useRef(
    Object.keys(columnFilters).length + (searchText ? 1 : 0)
  );

  // Helper to announce changes to screen readers
  const announce = useCallback(
    (message: string) => {
      const region = document.getElementById(announcerRegionId);
      if (region && message) {
        // Clear any pending timeout
        if (announceTimeoutRef.current) {
          clearTimeout(announceTimeoutRef.current);
        }

        // Add non-breaking space for repeated messages to force re-announcement
        const finalMessage =
          message === announcementRef.current ? `${message}\u00A0` : message;
        announcementRef.current = message;
        region.textContent = finalMessage;

        // Clear after delay to allow for new announcements
        announceTimeoutRef.current = setTimeout(() => {
          // Check if region still exists before modifying (component may have unmounted)
          const currentRegion = document.getElementById(announcerRegionId);
          if (currentRegion) {
            currentRegion.textContent = "";
          }
          announceTimeoutRef.current = null;
        }, TIMING.ANNOUNCEMENT_CLEAR_MS);
      }
    },
    [announcerRegionId]
  );

  // Cleanup announcement timeout on unmount
  useEffect(() => {
    return () => {
      if (announceTimeoutRef.current) {
        clearTimeout(announceTimeoutRef.current);
        announceTimeoutRef.current = null;
      }
    };
  }, []);

  // Announce sort changes
  useEffect(() => {
    const prevSort = prevSortStateRef.current;
    prevSortStateRef.current = sortState;

    // Skip initial render
    if (prevSort === sortState) return;

    // Check if sort changed
    if (sortState.length > 0) {
      const firstSort = sortState[0];
      if (firstSort) {
        // Find column header for the sorted column
        const sortedColumn = columns.find(
          (c) => String(c.key) === firstSort.key
        );
        const columnName = sortedColumn?.header ?? firstSort.key;
        const message =
          firstSort.direction === "asc"
            ? t("srSortedAsc", { column: columnName })
            : t("srSortedDesc", { column: columnName });
        announce(message);
      }
    } else if (prevSort.length > 0) {
      announce(t("srNotSorted"));
    }
  }, [sortState, columns, t, announce]);

  // Announce filter changes
  useEffect(() => {
    const currentFilterCount =
      Object.keys(columnFilters).length + (searchText ? 1 : 0);
    const prevFilterCount = prevFilterCountRef.current;
    prevFilterCountRef.current = currentFilterCount;

    // Skip initial render
    if (prevFilterCount === currentFilterCount) return;

    if (currentFilterCount > prevFilterCount) {
      announce(t("srFilterApplied", { count: currentFilterCount }));
    } else if (currentFilterCount === 0 && prevFilterCount > 0) {
      announce(t("srFilterCleared"));
    }
  }, [columnFilters, searchText, t, announce]);

  return {
    announcerRegionId,
    announce,
  };
}

export default useAnnouncements;
