"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface UseSelectionPersistenceOptions<T extends { id: string }> {
  /**
   * Whether persistence is enabled.
   * @default true
   */
  enabled?: boolean;

  /**
   * Current page data (the rows currently visible).
   * Used to reconcile selection with what's currently viewable.
   */
  data: T[];

  /**
   * Initial selection state (e.g., from localStorage or server).
   */
  initialSelection?: string[];

  /**
   * Maximum number of selections to persist.
   * Prevents memory issues with very large selections.
   * @default 10000
   */
  maxSelections?: number;

  /**
   * Callback when selection changes.
   * Receives the full persistent selection set.
   */
  onSelectionChange?: (selectedIds: string[]) => void;

  /**
   * Persist to localStorage with this key.
   * If provided, selection survives page refreshes.
   */
  storageKey?: string;
}

export interface UseSelectionPersistenceReturn {
  /**
   * All selected IDs (persisted across pages/filters).
   */
  selectedIds: string[];

  /**
   * Set of selected IDs for O(1) lookup.
   */
  selectedSet: Set<string>;

  /**
   * Number of selected items.
   */
  selectedCount: number;

  /**
   * Select a single row by ID.
   */
  select: (id: string) => void;

  /**
   * Deselect a single row by ID.
   */
  deselect: (id: string) => void;

  /**
   * Toggle selection of a single row.
   */
  toggle: (id: string) => void;

  /**
   * Select multiple rows by IDs.
   */
  selectMany: (ids: string[]) => void;

  /**
   * Deselect multiple rows by IDs.
   */
  deselectMany: (ids: string[]) => void;

  /**
   * Select all rows in current page data.
   */
  selectAllVisible: () => void;

  /**
   * Deselect all rows in current page data.
   */
  deselectAllVisible: () => void;

  /**
   * Clear all selections.
   */
  clearAll: () => void;

  /**
   * Replace entire selection with new IDs.
   */
  setSelection: (ids: string[]) => void;

  /**
   * Check if a specific row is selected.
   */
  isSelected: (id: string) => boolean;

  /**
   * Whether all visible rows are selected.
   */
  allVisibleSelected: boolean;

  /**
   * Whether some (but not all) visible rows are selected.
   */
  someVisibleSelected: boolean;

  /**
   * Props to pass directly to DataTable for controlled selection.
   */
  dataTableProps: {
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
  };
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const DEFAULT_MAX_SELECTIONS = 10000;
const STORAGE_DEBOUNCE_MS = 300;

// ─── HOOK ────────────────────────────────────────────────────────────────────

/**
 * Hook for persisting row selection across pages, filters, and page reloads.
 *
 * Features:
 * - Maintains selection state across pagination changes
 * - Maintains selection across filter/search changes
 * - Optional localStorage persistence for page reload survival
 * - Efficient Set-based lookups for large selections
 * - Maximum selection limit to prevent memory issues
 *
 * @example
 * ```tsx
 * // Basic usage with persistence across pages
 * const { selectedIds, dataTableProps } = useSelectionPersistence({
 *   data: currentPageData,
 *   onSelectionChange: (ids) => console.log("Selected:", ids),
 * });
 *
 * return <DataTable {...dataTableProps} data={currentPageData} columns={columns} />;
 *
 * // With localStorage persistence
 * const { selectedIds, dataTableProps } = useSelectionPersistence({
 *   data: currentPageData,
 *   storageKey: "my-table-selection",
 * });
 *
 * // With initial selection from server
 * const { dataTableProps } = useSelectionPersistence({
 *   data: currentPageData,
 *   initialSelection: serverSelectedIds,
 * });
 * ```
 */
export function useSelectionPersistence<T extends { id: string }>({
  enabled = true,
  data,
  initialSelection,
  maxSelections = DEFAULT_MAX_SELECTIONS,
  onSelectionChange,
  storageKey,
}: UseSelectionPersistenceOptions<T>): UseSelectionPersistenceReturn {
  // ─── INITIAL STATE ────────────────────────────────────────────────────────

  const getInitialSelection = useCallback((): Set<string> => {
    // Try localStorage first
    if (storageKey && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            return new Set(parsed.slice(0, maxSelections));
          }
        }
      } catch {
        // Ignore parse errors
      }
    }

    // Fall back to initialSelection prop
    if (initialSelection) {
      return new Set(initialSelection.slice(0, maxSelections));
    }

    return new Set();
  }, [storageKey, initialSelection, maxSelections]);

  // ─── STATE ────────────────────────────────────────────────────────────────

  const [selectedSet, setSelectedSet] = useState<Set<string>>(getInitialSelection);

  // Debounce timer ref for storage
  const storageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track previous selection for change detection
  const prevSelectionRef = useRef<Set<string>>(selectedSet);

  // ─── STORAGE PERSISTENCE ──────────────────────────────────────────────────

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;

    // Debounce storage writes
    if (storageTimerRef.current) {
      clearTimeout(storageTimerRef.current);
    }

    storageTimerRef.current = setTimeout(() => {
      try {
        const ids = Array.from(selectedSet);
        localStorage.setItem(storageKey, JSON.stringify(ids));
      } catch {
        // Ignore storage errors (quota exceeded, etc.)
      }
    }, STORAGE_DEBOUNCE_MS);

    return () => {
      if (storageTimerRef.current) {
        clearTimeout(storageTimerRef.current);
      }
    };
  }, [selectedSet, storageKey]);

  // ─── CHANGE CALLBACK ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!enabled) return;

    const prev = prevSelectionRef.current;
    const current = selectedSet;

    // Check if selection actually changed
    const hasChanged =
      prev.size !== current.size ||
      [...current].some((id) => !prev.has(id)) ||
      [...prev].some((id) => !current.has(id));

    if (hasChanged && onSelectionChange) {
      onSelectionChange(Array.from(current));
    }

    prevSelectionRef.current = current;
  }, [selectedSet, onSelectionChange, enabled]);

  // ─── DERIVED STATE ────────────────────────────────────────────────────────

  const visibleIds = useMemo(() => data.map((row) => row.id), [data]);

  const allVisibleSelected = useMemo(() => {
    if (visibleIds.length === 0) return false;
    return visibleIds.every((id) => selectedSet.has(id));
  }, [visibleIds, selectedSet]);

  const someVisibleSelected = useMemo(() => {
    if (visibleIds.length === 0) return false;
    const someSelected = visibleIds.some((id) => selectedSet.has(id));
    return someSelected && !allVisibleSelected;
  }, [visibleIds, selectedSet, allVisibleSelected]);

  // ─── SELECTION ACTIONS ────────────────────────────────────────────────────

  const select = useCallback(
    (id: string) => {
      if (!enabled) return;
      setSelectedSet((prev) => {
        if (prev.has(id)) return prev;
        if (prev.size >= maxSelections) {
          console.warn(`Selection limit (${maxSelections}) reached`);
          return prev;
        }
        const next = new Set(prev);
        next.add(id);
        return next;
      });
    },
    [enabled, maxSelections]
  );

  const deselect = useCallback(
    (id: string) => {
      if (!enabled) return;
      setSelectedSet((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [enabled]
  );

  const toggle = useCallback(
    (id: string) => {
      if (!enabled) return;
      setSelectedSet((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          if (next.size >= maxSelections) {
            console.warn(`Selection limit (${maxSelections}) reached`);
            return prev;
          }
          next.add(id);
        }
        return next;
      });
    },
    [enabled, maxSelections]
  );

  const selectMany = useCallback(
    (ids: string[]) => {
      if (!enabled) return;
      setSelectedSet((prev) => {
        const next = new Set(prev);
        for (const id of ids) {
          if (next.size >= maxSelections) {
            console.warn(`Selection limit (${maxSelections}) reached`);
            break;
          }
          next.add(id);
        }
        return next;
      });
    },
    [enabled, maxSelections]
  );

  const deselectMany = useCallback(
    (ids: string[]) => {
      if (!enabled) return;
      setSelectedSet((prev) => {
        const next = new Set(prev);
        for (const id of ids) {
          next.delete(id);
        }
        return next;
      });
    },
    [enabled]
  );

  const selectAllVisible = useCallback(() => {
    if (!enabled) return;
    selectMany(visibleIds);
  }, [enabled, visibleIds, selectMany]);

  const deselectAllVisible = useCallback(() => {
    if (!enabled) return;
    deselectMany(visibleIds);
  }, [enabled, visibleIds, deselectMany]);

  const clearAll = useCallback(() => {
    if (!enabled) return;
    setSelectedSet(new Set());
  }, [enabled]);

  const setSelection = useCallback(
    (ids: string[]) => {
      if (!enabled) return;
      setSelectedSet(new Set(ids.slice(0, maxSelections)));
    },
    [enabled, maxSelections]
  );

  const isSelected = useCallback((id: string) => selectedSet.has(id), [selectedSet]);

  // ─── DATATABLE INTEGRATION ────────────────────────────────────────────────

  /**
   * Handle selection change from DataTable.
   * Merges with persisted selection rather than replacing.
   */
  const handleDataTableSelectionChange = useCallback(
    (ids: string[]) => {
      if (!enabled) return;

      setSelectedSet((prev) => {
        const next = new Set(prev);

        // First, remove any visible IDs that are no longer selected
        for (const visibleId of visibleIds) {
          if (!ids.includes(visibleId)) {
            next.delete(visibleId);
          }
        }

        // Then, add any newly selected IDs
        for (const id of ids) {
          if (next.size >= maxSelections) {
            console.warn(`Selection limit (${maxSelections}) reached`);
            break;
          }
          next.add(id);
        }

        return next;
      });
    },
    [enabled, visibleIds, maxSelections]
  );

  const dataTableProps = useMemo(
    () => ({
      selectedIds: Array.from(selectedSet),
      onSelectionChange: handleDataTableSelectionChange,
    }),
    [selectedSet, handleDataTableSelectionChange]
  );

  // ─── RETURN ───────────────────────────────────────────────────────────────

  return {
    selectedIds: Array.from(selectedSet),
    selectedSet,
    selectedCount: selectedSet.size,
    select,
    deselect,
    toggle,
    selectMany,
    deselectMany,
    selectAllVisible,
    deselectAllVisible,
    clearAll,
    setSelection,
    isSelected,
    allVisibleSelected,
    someVisibleSelected,
    dataTableProps,
  };
}

export default useSelectionPersistence;
