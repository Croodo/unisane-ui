"use client";

import { useMemo, useCallback } from "react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

/**
 * Column span definition for a specific cell
 */
export interface ColumnSpan {
  /** Row ID where the span applies */
  rowId: string;
  /** Starting column key */
  columnKey: string;
  /** Number of columns to span (including the starting column) */
  span: number;
}

/**
 * Cell span info returned for rendering
 */
export interface CellSpanInfo {
  /** Whether this cell should be rendered (false if hidden by a span) */
  shouldRender: boolean;
  /** Number of columns this cell spans (1 = normal, > 1 = spanning) */
  colSpan: number;
  /** Whether this cell is the start of a span */
  isSpanStart: boolean;
  /** Column keys that this cell spans (for export/calculation) */
  spannedColumns: string[];
}

/**
 * Function type for dynamic column span calculation
 */
export type ColumnSpanFn<T> = (
  row: T,
  columnKey: string,
  columnIndex: number,
  allColumns: string[]
) => number | undefined;

export interface UseColumnSpanOptions<T extends { id: string }> {
  /**
   * Whether column spanning is enabled.
   * @default true
   */
  enabled?: boolean;

  /**
   * Static column span definitions.
   * Use this for predefined spans that don't change.
   */
  spans?: ColumnSpan[];

  /**
   * Dynamic column span function.
   * Called for each cell to determine its span.
   * Return the number of columns to span, or undefined for no span.
   */
  getColSpan?: ColumnSpanFn<T>;

  /**
   * Column keys in display order.
   */
  columnKeys: string[];

  /**
   * Data rows (for dynamic span calculation).
   */
  data?: T[];

  /**
   * Callback when spans change.
   */
  onSpansChange?: (spans: ColumnSpan[]) => void;
}

export interface UseColumnSpanReturn<T extends { id: string }> {
  /**
   * Get span info for a specific cell.
   */
  getCellSpanInfo: (rowId: string, columnKey: string) => CellSpanInfo;

  /**
   * Get span info for all cells in a row.
   */
  getRowSpanInfo: (rowId: string) => Map<string, CellSpanInfo>;

  /**
   * Check if a cell is hidden by a span.
   */
  isCellHidden: (rowId: string, columnKey: string) => boolean;

  /**
   * Get the colSpan value for a cell (for HTML rendering).
   */
  getColSpan: (rowId: string, columnKey: string) => number;

  /**
   * Add a static span definition.
   */
  addSpan: (span: Omit<ColumnSpan, "span"> & { span?: number }) => void;

  /**
   * Remove a static span definition.
   */
  removeSpan: (rowId: string, columnKey: string) => void;

  /**
   * Clear all static spans.
   */
  clearSpans: () => void;

  /**
   * Set all static spans at once.
   */
  setSpans: (spans: ColumnSpan[]) => void;

  /**
   * Get all spans for a row.
   */
  getRowSpans: (rowId: string) => ColumnSpan[];

  /**
   * Check if any spans are defined.
   */
  hasSpans: boolean;

  /**
   * Get visible column keys for a row (excluding hidden by spans).
   */
  getVisibleColumnsForRow: (rowId: string) => string[];

  /**
   * Calculate total width for a spanned cell.
   * Useful for virtualized rendering.
   */
  calculateSpannedWidth: (
    rowId: string,
    columnKey: string,
    getColumnWidth: (key: string) => number
  ) => number;

  /**
   * Export-friendly: get cell value with span info.
   * Returns the spanned column keys for merge operations.
   */
  getExportCellInfo: (
    rowId: string,
    columnKey: string
  ) => { render: boolean; mergeColumns: string[] };
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const DEFAULT_SPAN_INFO: CellSpanInfo = {
  shouldRender: true,
  colSpan: 1,
  isSpanStart: false,
  spannedColumns: [],
};

// ─── HOOK ────────────────────────────────────────────────────────────────────

/**
 * Hook for managing column spanning in data tables.
 *
 * Features:
 * - Static span definitions (predefined spans)
 * - Dynamic span calculation (per-row function)
 * - Cell visibility detection (hidden by spans)
 * - Export-friendly span info
 * - Width calculation for spanned cells
 *
 * @example
 * ```tsx
 * // Static spans
 * const { getCellSpanInfo, getColSpan } = useColumnSpan({
 *   columnKeys: ["name", "email", "phone", "address"],
 *   spans: [
 *     { rowId: "row1", columnKey: "name", span: 2 }, // name spans into email
 *     { rowId: "row2", columnKey: "phone", span: 2 }, // phone spans into address
 *   ],
 * });
 *
 * // Dynamic spans
 * const { getCellSpanInfo } = useColumnSpan({
 *   columnKeys: ["name", "email", "phone", "address"],
 *   data: rows,
 *   getColSpan: (row, columnKey) => {
 *     // Span "message" column across remaining columns for "header" rows
 *     if (row.type === "header" && columnKey === "name") {
 *       return 4; // Span all 4 columns
 *     }
 *     return undefined;
 *   },
 * });
 *
 * // In cell renderer
 * const spanInfo = getCellSpanInfo(row.id, column.key);
 * if (!spanInfo.shouldRender) return null;
 * return <td colSpan={spanInfo.colSpan}>...</td>;
 * ```
 */
export function useColumnSpan<T extends { id: string }>({
  enabled = true,
  spans: staticSpans = [],
  getColSpan: dynamicSpanFn,
  columnKeys,
  data = [],
  onSpansChange,
}: UseColumnSpanOptions<T>): UseColumnSpanReturn<T> {
  // ─── COMPUTED SPANS ─────────────────────────────────────────────────────────

  // Build a lookup map for static spans
  const staticSpanMap = useMemo(() => {
    if (!enabled) return new Map<string, number>();

    const map = new Map<string, number>();
    for (const span of staticSpans) {
      const key = `${span.rowId}:${span.columnKey}`;
      map.set(key, span.span);
    }
    return map;
  }, [enabled, staticSpans]);

  // Build a lookup for which cells are hidden by spans
  const hiddenCellsMap = useMemo(() => {
    if (!enabled) return new Map<string, string>();

    const hidden = new Map<string, string>(); // hidden cell key -> spanning cell key

    // Process static spans
    for (const span of staticSpans) {
      const startIndex = columnKeys.indexOf(span.columnKey);
      if (startIndex === -1) continue;

      for (let i = 1; i < span.span && startIndex + i < columnKeys.length; i++) {
        const hiddenKey = `${span.rowId}:${columnKeys[startIndex + i]}`;
        hidden.set(hiddenKey, span.columnKey);
      }
    }

    // Process dynamic spans
    if (dynamicSpanFn) {
      for (const row of data) {
        for (let colIndex = 0; colIndex < columnKeys.length; colIndex++) {
          const columnKey = columnKeys[colIndex];
          if (!columnKey) continue;

          const span = dynamicSpanFn(row, columnKey, colIndex, columnKeys);

          if (span && span > 1) {
            for (let i = 1; i < span && colIndex + i < columnKeys.length; i++) {
              const hiddenColumnKey = columnKeys[colIndex + i];
              if (!hiddenColumnKey) continue;
              const hiddenKey = `${row.id}:${hiddenColumnKey}`;
              hidden.set(hiddenKey, columnKey);
            }
          }
        }
      }
    }

    return hidden;
  }, [enabled, staticSpans, dynamicSpanFn, columnKeys, data]);

  // ─── GETTERS ────────────────────────────────────────────────────────────────

  const getSpanForCell = useCallback(
    (rowId: string, columnKey: string): number => {
      if (!enabled) return 1;

      // Check static spans first
      const staticKey = `${rowId}:${columnKey}`;
      const staticSpan = staticSpanMap.get(staticKey);
      if (staticSpan) return staticSpan;

      // Check dynamic span
      if (dynamicSpanFn) {
        const row = data.find((r) => r.id === rowId);
        if (row) {
          const colIndex = columnKeys.indexOf(columnKey);
          if (colIndex !== -1) {
            const dynamicSpan = dynamicSpanFn(row, columnKey, colIndex, columnKeys);
            if (dynamicSpan) return dynamicSpan;
          }
        }
      }

      return 1;
    },
    [enabled, staticSpanMap, dynamicSpanFn, data, columnKeys]
  );

  const getCellSpanInfo = useCallback(
    (rowId: string, columnKey: string): CellSpanInfo => {
      if (!enabled) return DEFAULT_SPAN_INFO;

      const cellKey = `${rowId}:${columnKey}`;

      // Check if this cell is hidden by another cell's span
      const hiddenBy = hiddenCellsMap.get(cellKey);
      if (hiddenBy) {
        return {
          shouldRender: false,
          colSpan: 1,
          isSpanStart: false,
          spannedColumns: [],
        };
      }

      // Get the span for this cell
      const span = getSpanForCell(rowId, columnKey);

      if (span > 1) {
        const startIndex = columnKeys.indexOf(columnKey);
        const spannedColumns = columnKeys.slice(
          startIndex,
          Math.min(startIndex + span, columnKeys.length)
        );

        return {
          shouldRender: true,
          colSpan: spannedColumns.length,
          isSpanStart: true,
          spannedColumns,
        };
      }

      return DEFAULT_SPAN_INFO;
    },
    [enabled, hiddenCellsMap, getSpanForCell, columnKeys]
  );

  const getRowSpanInfo = useCallback(
    (rowId: string): Map<string, CellSpanInfo> => {
      const map = new Map<string, CellSpanInfo>();

      for (const columnKey of columnKeys) {
        map.set(columnKey, getCellSpanInfo(rowId, columnKey));
      }

      return map;
    },
    [columnKeys, getCellSpanInfo]
  );

  const isCellHidden = useCallback(
    (rowId: string, columnKey: string): boolean => {
      if (!enabled) return false;
      return hiddenCellsMap.has(`${rowId}:${columnKey}`);
    },
    [enabled, hiddenCellsMap]
  );

  const getColSpan = useCallback(
    (rowId: string, columnKey: string): number => {
      if (!enabled) return 1;

      const info = getCellSpanInfo(rowId, columnKey);
      return info.colSpan;
    },
    [enabled, getCellSpanInfo]
  );

  // ─── SPAN MANAGEMENT ────────────────────────────────────────────────────────

  const addSpan = useCallback(
    (span: Omit<ColumnSpan, "span"> & { span?: number }) => {
      const fullSpan: ColumnSpan = {
        ...span,
        span: span.span ?? 2,
      };

      const newSpans = [...staticSpans.filter(
        (s) => !(s.rowId === span.rowId && s.columnKey === span.columnKey)
      ), fullSpan];

      onSpansChange?.(newSpans);
    },
    [staticSpans, onSpansChange]
  );

  const removeSpan = useCallback(
    (rowId: string, columnKey: string) => {
      const newSpans = staticSpans.filter(
        (s) => !(s.rowId === rowId && s.columnKey === columnKey)
      );
      onSpansChange?.(newSpans);
    },
    [staticSpans, onSpansChange]
  );

  const clearSpans = useCallback(() => {
    onSpansChange?.([]);
  }, [onSpansChange]);

  const setSpans = useCallback(
    (newSpans: ColumnSpan[]) => {
      onSpansChange?.(newSpans);
    },
    [onSpansChange]
  );

  const getRowSpans = useCallback(
    (rowId: string): ColumnSpan[] => {
      return staticSpans.filter((s) => s.rowId === rowId);
    },
    [staticSpans]
  );

  // ─── UTILITIES ──────────────────────────────────────────────────────────────

  const hasSpans = useMemo(() => {
    return staticSpans.length > 0 || !!dynamicSpanFn;
  }, [staticSpans, dynamicSpanFn]);

  const getVisibleColumnsForRow = useCallback(
    (rowId: string): string[] => {
      if (!enabled) return columnKeys;

      return columnKeys.filter((columnKey) => {
        const info = getCellSpanInfo(rowId, columnKey);
        return info.shouldRender;
      });
    },
    [enabled, columnKeys, getCellSpanInfo]
  );

  const calculateSpannedWidth = useCallback(
    (
      rowId: string,
      columnKey: string,
      getColumnWidth: (key: string) => number
    ): number => {
      const info = getCellSpanInfo(rowId, columnKey);

      if (info.spannedColumns.length <= 1) {
        return getColumnWidth(columnKey);
      }

      return info.spannedColumns.reduce(
        (total, key) => total + getColumnWidth(key),
        0
      );
    },
    [getCellSpanInfo]
  );

  const getExportCellInfo = useCallback(
    (
      rowId: string,
      columnKey: string
    ): { render: boolean; mergeColumns: string[] } => {
      const info = getCellSpanInfo(rowId, columnKey);

      return {
        render: info.shouldRender,
        mergeColumns: info.spannedColumns,
      };
    },
    [getCellSpanInfo]
  );

  // ─── RETURN ─────────────────────────────────────────────────────────────────

  return {
    getCellSpanInfo,
    getRowSpanInfo,
    isCellHidden,
    getColSpan,
    addSpan,
    removeSpan,
    clearSpans,
    setSpans,
    getRowSpans,
    hasSpans,
    getVisibleColumnsForRow,
    calculateSpannedWidth,
    getExportCellInfo,
  };
}

export default useColumnSpan;
