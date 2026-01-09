"use client";

import React, { useMemo, useCallback, useState } from "react";
import type { ReactNode, CSSProperties } from "react";
import type { Column, ColumnGroup } from "../types/column";
import type { BulkAction } from "../types/features";
import type { CursorPagination, FilterState, MultiSortState } from "../types/core";
import type { RowActivationEvent } from "../types/props";
import type {
  FeaturesConfig,
  VirtualizationConfig,
  PaginationConfig,
  EditingConfig,
  StylingConfig,
  CallbacksConfig,
  ControlledStateConfig,
  DataTablePreset,
} from "../types/config";
import { getPresetConfig } from "../types/config";
import { DataTableProvider } from "../context/provider";
import { DataTableInner } from "./data-table-inner";
import { FeedbackProvider } from "../feedback";
import { useInlineEditing } from "../hooks/features/use-inline-editing";

// ─── DATA TABLE PROPS ─────────────────────────────────────────────────────────

/**
 * DataTable component props with grouped configuration objects.
 */
export interface DataTableProps<T extends { id: string }> {
  // ─── Required ───
  /** Data rows to display */
  data: T[];

  /**
   * Column definitions.
   *
   * **Performance Note:** Memoize your columns array to prevent unnecessary re-renders:
   * ```tsx
   * const columns = useMemo(() => [...], []);
   * ```
   */
  columns: Array<Column<T> | ColumnGroup<T>>;

  // ─── Preset ───
  /**
   * Preset configuration for common use cases.
   * Sets sensible defaults that can be overridden.
   *
   * - `"simple"`: Basic read-only table
   * - `"interactive"`: Selection, search, sorting (default)
   * - `"editable"`: Inline editing with validation
   * - `"spreadsheet"`: Cell selection, copy/paste, grid layout
   * - `"server"`: Remote data with cursor pagination
   * - `"dashboard"`: Compact, minimal UI
   *
   * @default "interactive"
   */
  preset?: DataTablePreset;

  // ─── Grouped Configuration ───
  /**
   * Feature toggles.
   * @example
   * ```tsx
   * features={{ selection: true, search: true, export: ["csv"] }}
   * ```
   */
  features?: FeaturesConfig;

  /**
   * Virtualization settings for large datasets.
   * @example
   * ```tsx
   * virtualization={{ rows: true, rowThreshold: 100 }}
   * ```
   */
  virtualization?: VirtualizationConfig;

  /**
   * Pagination configuration.
   * @example
   * ```tsx
   * pagination={{ mode: "offset", pageSize: 25 }}
   * ```
   */
  pagination?: PaginationConfig;

  /**
   * Inline editing configuration.
   * @example
   * ```tsx
   * editing={{
   *   enabled: true,
   *   onSave: async (rowId, col, value) => api.update(rowId, { [col]: value }),
   *   onValidate: (rowId, col, value) => col === "email" && !value.includes("@") ? "Invalid" : null,
   * }}
   * ```
   */
  editing?: EditingConfig<T>;

  /**
   * Visual styling configuration.
   * @example
   * ```tsx
   * styling={{ variant: "grid", density: "compact", zebra: true }}
   * ```
   */
  styling?: StylingConfig;

  /**
   * Event callbacks.
   * @example
   * ```tsx
   * callbacks={{
   *   onRowClick: (row) => navigate(`/users/${row.id}`),
   *   onSelectionChange: (ids) => setSelected(ids),
   * }}
   * ```
   */
  callbacks?: CallbacksConfig<T>;

  /**
   * Controlled state for fully-controlled mode.
   * @example
   * ```tsx
   * controlled={{ selectedIds, sortState }}
   * callbacks={{ onSelectionChange: setSelectedIds, onSortChange: setSortState }}
   * ```
   */
  controlled?: ControlledStateConfig;

  // ─── Bulk Actions ───
  /** Bulk action definitions */
  bulkActions?: BulkAction[];

  // ─── Row Expansion ───
  /** Render expanded row content */
  renderExpandedRow?: (row: T) => ReactNode;

  /** Determine if row can expand */
  getRowCanExpand?: (row: T) => boolean;

  // ─── Row Styling ───
  /** Active/highlighted row ID */
  activeRowId?: string;

  /** Custom row class name function */
  rowClassName?: (row: T) => string;

  // ─── Container Styling ───
  /** Additional class name */
  className?: string;

  /** Inline styles */
  style?: CSSProperties;

  // ─── Empty State ───
  /** Custom empty message */
  emptyMessage?: string;

  /** Custom empty icon (Material Symbol name) */
  emptyIcon?: string;

  // ─── Loading State ───
  /** Loading state */
  loading?: boolean;

  /** Refreshing state (spinner while data exists) */
  refreshing?: boolean;

  /** Total count for pagination (remote mode) */
  totalCount?: number;

  /** Callback to refresh data */
  onRefresh?: () => void | Promise<void>;

  /** Cursor pagination controls for remote data (from useRemoteDataTable) */
  cursorPagination?: CursorPagination;

  /**
   * Pagination mode override (used by useRemoteDataTable).
   * Overrides pagination.mode when specified.
   */
  paginationMode?: "offset" | "cursor" | "none";

  // ─── Remote Data Props (from useRemoteDataTable) ───
  /**
   * Controlled search value (shorthand for controlled.searchValue).
   * Used by useRemoteDataTable for server-side search.
   */
  searchValue?: string;

  /**
   * Search change handler (shorthand for callbacks.onSearchChange).
   * Used by useRemoteDataTable for server-side search.
   */
  onSearchChange?: (value: string) => void;

  /**
   * Controlled filters (shorthand for controlled.filters).
   * Used by useRemoteDataTable for server-side filtering.
   */
  filters?: Record<string, unknown>;

  /**
   * Filter change handler (shorthand for callbacks.onFilterChange).
   * Used by useRemoteDataTable for server-side filtering.
   */
  onFilterChange?: (filters: Record<string, unknown>) => void;

  /**
   * Sort key (shorthand for controlled.sortState.key).
   * Used by useRemoteDataTable for server-side sorting.
   */
  sortKey?: string | null;

  /**
   * Sort direction (shorthand for controlled.sortState.direction).
   * Used by useRemoteDataTable for server-side sorting.
   */
  sortDirection?: "asc" | "desc";

  /**
   * Sort change handler (shorthand for callbacks.onSortChange).
   * Used by useRemoteDataTable for server-side sorting.
   */
  onSortChange?: (key: string | null, direction: "asc" | "desc") => void;

  /**
   * Disable local data processing (sorting, filtering, searching).
   * Set to true when using server-side processing.
   */
  disableLocalProcessing?: boolean;

  /**
   * Data mode - 'local' for client-side, 'remote' for server-side processing.
   */
  mode?: "local" | "remote";

  // ─── Identification ───
  /** Unique ID for localStorage persistence */
  tableId?: string;

  /** Table title for toolbar */
  title?: string;

  // ─── Feedback ───
  /**
   * Enable feedback notifications (toasts and ARIA announcements).
   * @default true
   */
  enableFeedback?: boolean;

  /**
   * Disable toast notifications (keeps ARIA announcements).
   * @default false
   */
  disableToasts?: boolean;

  /**
   * Disable ARIA announcements (keeps toasts).
   * @default false
   */
  disableAnnouncements?: boolean;

  // ─── RTL Support ───
  /**
   * Text direction for RTL language support.
   * @default "ltr"
   */
  dir?: "ltr" | "rtl";
}

// ─── INTERNAL EDITING WRAPPER ─────────────────────────────────────────────────

interface EditingWrapperProps<T extends { id: string }> {
  data: T[];
  editing?: EditingConfig<T>;
  children: (inlineEditing: ReturnType<typeof useInlineEditing<T>> | undefined) => ReactNode;
}

function EditingWrapper<T extends { id: string }>({
  data,
  editing,
  children,
}: EditingWrapperProps<T>) {
  const inlineEditing = useInlineEditing<T>({
    data,
    onCellChange: editing?.onSave
      ? async (rowId, columnKey, value) => {
          const row = data.find((r) => r.id === rowId);
          if (row) {
            await editing.onSave?.(rowId, columnKey, value, row);
          }
        }
      : undefined,
    validateCell: editing?.onValidate
      ? (rowId, columnKey, value) => {
          const row = data.find((r) => r.id === rowId);
          if (row) {
            return editing.onValidate?.(rowId, columnKey, value, row) ?? null;
          }
          return null;
        }
      : undefined,
  });

  return <>{children(editing?.enabled ? inlineEditing : undefined)}</>;
}

// ─── DATA TABLE COMPONENT ─────────────────────────────────────────────────────

/**
 * DataTable - Feature-rich, highly scalable data table component.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <DataTable
 *   data={users}
 *   columns={columns}
 * />
 *
 * // With features
 * <DataTable
 *   data={users}
 *   columns={columns}
 *   preset="interactive"
 *   features={{ selection: true, search: true }}
 *   callbacks={{ onRowClick: (row) => navigate(`/users/${row.id}`) }}
 * />
 *
 * // With inline editing
 * <DataTable
 *   data={users}
 *   columns={columns}
 *   editing={{
 *     enabled: true,
 *     onSave: async (rowId, col, value) => api.update(rowId, { [col]: value }),
 *   }}
 * />
 * ```
 */
export function DataTable<T extends { id: string }>({
  // Required
  data,
  columns,

  // Preset
  preset = "interactive",

  // Grouped configs
  features: featuresOverride,
  virtualization: virtualizationOverride,
  pagination: paginationOverride,
  editing,
  styling: stylingOverride,
  callbacks,
  controlled,

  // Bulk actions
  bulkActions = [],

  // Row expansion
  renderExpandedRow,
  getRowCanExpand,

  // Row styling
  activeRowId,

  // Container styling
  className,
  style,

  // Empty state
  emptyMessage,
  emptyIcon,

  // Loading
  loading = false,
  refreshing = false,
  totalCount,
  onRefresh,
  cursorPagination,
  paginationMode: paginationModeOverride,

  // Remote data props (from useRemoteDataTable)
  searchValue: searchValueProp,
  onSearchChange: onSearchChangeProp,
  filters: filtersProp,
  onFilterChange: onFilterChangeProp,
  sortKey: sortKeyProp,
  sortDirection: sortDirectionProp,
  onSortChange: onSortChangeProp,
  mode,
  disableLocalProcessing = false,

  // Identification
  tableId,
  title,

  // Feedback
  enableFeedback = true,
  disableToasts = false,
  disableAnnouncements = false,
}: DataTableProps<T>) {
  // Get preset defaults
  const presetConfig = useMemo(() => getPresetConfig(preset), [preset]);

  // Merge configs with preset defaults
  const features = useMemo(
    () => ({ ...presetConfig.features, ...featuresOverride }),
    [presetConfig.features, featuresOverride]
  );

  const virtualization = useMemo(
    () => ({ ...presetConfig.virtualization, ...virtualizationOverride }),
    [presetConfig.virtualization, virtualizationOverride]
  );

  const paginationConfig = useMemo(
    () => ({ ...presetConfig.pagination, ...paginationOverride }),
    [presetConfig.pagination, paginationOverride]
  );

  const styling = useMemo(
    () => ({ ...presetConfig.styling, ...stylingOverride }),
    [presetConfig.styling, stylingOverride]
  );

  // Determine effective settings
  const effectiveRowSelectionEnabled = features.selection ?? false;
  const effectiveShowColumnDividers = styling.columnDividers ?? styling.variant === "grid";
  const enableExpansion = features.rowExpansion ?? !!renderExpandedRow;

  // Map callbacks to internal handlers
  const handleRowClick = useCallback(
    (row: T, activation: RowActivationEvent) => {
      callbacks?.onRowClick?.(row, { source: activation.source });
    },
    [callbacks]
  );

  const handleRowContextMenu = useCallback(
    (row: T, event: React.MouseEvent) => {
      callbacks?.onRowContextMenu?.(row, event);
    },
    [callbacks]
  );

  // Determine if toolbar should be shown
  const showToolbar = !!(
    title ||
    features.search ||
    (effectiveRowSelectionEnabled && bulkActions.length > 0) ||
    onRefresh
  );

  // Internal density state - allows user to change density via toolbar
  const initialDensity = styling.density ?? "standard";
  const [internalDensity, setInternalDensity] = useState(initialDensity);

  // Effective density (will be used for both toolbar and table)
  const effectiveDensity = internalDensity;

  // Effective pagination mode - top-level override takes precedence over pagination.mode
  const effectivePaginationMode = paginationModeOverride ?? paginationConfig.mode ?? "offset";

  // Effective mode - use explicit mode prop or derive from pagination
  const effectiveMode = mode ?? (effectivePaginationMode === "cursor" ? "remote" : "local");

  // Merge top-level props with controlled/callbacks (top-level takes precedence for useRemoteDataTable compatibility)
  const effectiveSearchValue = searchValueProp ?? controlled?.searchValue;
  const effectiveOnSearchChange = onSearchChangeProp ?? callbacks?.onSearchChange;
  const effectiveFilters = (filtersProp ?? controlled?.filters) as FilterState | undefined;
  const effectiveOnFilterChange = onFilterChangeProp
    ? (filters: FilterState) => onFilterChangeProp(filters)
    : callbacks?.onFilterChange;

  // Convert single sort (from useRemoteDataTable) to MultiSortState array
  const effectiveSortState = sortKeyProp !== undefined && sortKeyProp !== null
    ? [{ key: sortKeyProp, direction: sortDirectionProp ?? "asc" as const }]
    : controlled?.sortState;

  // Wrap single-sort callback to work with MultiSortState
  const effectiveOnSortChange = onSortChangeProp
    ? (sortState: MultiSortState) => {
        const first = sortState[0];
        onSortChangeProp(first?.key ?? null, first?.direction ?? "asc");
      }
    : callbacks?.onSortChange;

  // Build the table content
  const content = (
    <DataTableProvider
      tableId={tableId}
      columns={columns}
      mode={effectiveMode}
      paginationMode={effectivePaginationMode}
      variant={styling.variant ?? "list"}
      rowSelectionEnabled={effectiveRowSelectionEnabled}
      showColumnDividers={effectiveShowColumnDividers}
      zebra={styling.zebra ?? false}
      stickyHeader={styling.stickyHeader ?? true}
      stickyOffset={styling.stickyOffset}
      resizable={features.columnResize ?? true}
      pinnable={features.columnPinning ?? true}
      initialPageSize={paginationConfig.pageSize ?? 25}
      // Controlled props - merged with top-level props
      sortState={effectiveSortState}
      onSortChange={effectiveOnSortChange}
      controlledFilters={effectiveFilters}
      onFilterChange={effectiveOnFilterChange}
      searchValue={effectiveSearchValue}
      onSearchChange={effectiveOnSearchChange}
      columnPinState={controlled?.columnPinState}
      onColumnPinChange={callbacks?.onColumnPinChange}
      selectedIds={controlled?.selectedIds}
      onSelectionChange={callbacks?.onSelectionChange}
    >
      <EditingWrapper data={data} editing={editing}>
        {(inlineEditing) => (
          <DataTableInner
            // Pass toolbar props to DataTableInner so it can render inside StickyZone
            toolbarProps={showToolbar ? {
              title,
              searchable: features.search ?? false,
              bulkActions,
              density: effectiveDensity,
              onDensityChange: setInternalDensity,
              showColumnToggle: true,
              showDensityToggle: true,
              refreshing,
              onRefresh,
            } : undefined}
            data={data}
            isLoading={loading}
            bulkActions={bulkActions}
            renderExpandedRow={enableExpansion ? renderExpandedRow : undefined}
            getRowCanExpand={getRowCanExpand}
            className={className}
            style={style}
            totalItems={totalCount}
            onRowClick={callbacks?.onRowClick ? handleRowClick : undefined}
            onRowContextMenu={callbacks?.onRowContextMenu ? handleRowContextMenu : undefined}
            activeRowId={activeRowId}
            density={effectiveDensity}
            virtualize={virtualization.rows ?? true}
            virtualizeThreshold={virtualization.rowThreshold ?? 50}
            virtualizeColumns={virtualization.columns ?? false}
            virtualizeColumnsThreshold={virtualization.columnThreshold ?? 20}
            emptyMessage={emptyMessage}
            emptyIcon={emptyIcon}
            estimateRowHeight={virtualization.estimatedRowHeight}
            reorderableRows={features.rowReorder ?? false}
            onRowReorder={callbacks?.onRowReorder}
            inlineEditing={inlineEditing}
            cursorPagination={cursorPagination}
            disableLocalProcessing={disableLocalProcessing}
          />
        )}
      </EditingWrapper>
    </DataTableProvider>
  );

  // Wrap with FeedbackProvider if enabled
  if (enableFeedback) {
    return (
      <FeedbackProvider
        disabled={!enableFeedback}
        disableToasts={disableToasts}
        disableAnnouncements={disableAnnouncements}
      >
        {content}
      </FeedbackProvider>
    );
  }

  return content;
}

// ─── DISPLAY NAME ─────────────────────────────────────────────────────────────

DataTable.displayName = "DataTable";

export default DataTable;
