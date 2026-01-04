"use client";

import React, { useMemo, useCallback } from "react";
import type { ReactNode, CSSProperties } from "react";
import type { Column, ColumnGroup } from "../types/column";
import type { BulkAction } from "../types/features";
import type { RowActivationEvent } from "../types/props";
import type { Density } from "../constants/index";
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
import { DataTableToolbar } from "./toolbar";
import { FeedbackProvider } from "../feedback";
import { useInlineEditing } from "../hooks/features/use-inline-editing";
import { useSelection } from "../context";

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

// ─── INTERNAL TOOLBAR WRAPPER ─────────────────────────────────────────────────

interface IntegratedToolbarProps {
  title?: string;
  searchable: boolean;
  bulkActions: BulkAction[];
  density: Density;
  onDensityChange?: (density: Density) => void;
  showColumnToggle: boolean;
  showDensityToggle: boolean;
  refreshing?: boolean;
  onRefresh?: () => void | Promise<void>;
}

function IntegratedToolbar({
  title,
  searchable,
  bulkActions,
  density,
  onDensityChange,
  showColumnToggle,
  showDensityToggle,
  refreshing,
  onRefresh,
}: IntegratedToolbarProps) {
  const { selectedRows, selectedCount, deselectAll } = useSelection();

  // Convert Set to array for toolbar
  const selectedIdsArray = useMemo(() => Array.from(selectedRows), [selectedRows]);

  return (
    <DataTableToolbar
      title={title}
      searchable={searchable}
      selectedCount={selectedCount}
      selectedIds={selectedIdsArray}
      bulkActions={bulkActions}
      onClearSelection={deselectAll}
      density={density}
      onDensityChange={onDensityChange}
      showColumnToggle={showColumnToggle}
      showDensityToggle={showDensityToggle}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
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

  // Effective density (will be used for both toolbar and table)
  const effectiveDensity = styling.density ?? "standard";

  // Build the table content
  const content = (
    <DataTableProvider
      tableId={tableId}
      columns={columns}
      mode={paginationConfig.mode === "cursor" ? "remote" : "local"}
      paginationMode={paginationConfig.mode ?? "offset"}
      variant={styling.variant ?? "list"}
      rowSelectionEnabled={effectiveRowSelectionEnabled}
      showColumnDividers={effectiveShowColumnDividers}
      zebra={styling.zebra ?? false}
      stickyHeader={styling.stickyHeader ?? true}
      stickyOffset={styling.stickyOffset}
      resizable={features.columnResize ?? true}
      pinnable={features.columnPinning ?? true}
      initialPageSize={paginationConfig.pageSize ?? 25}
      // Controlled props
      sortState={controlled?.sortState}
      onSortChange={callbacks?.onSortChange}
      controlledFilters={controlled?.filters}
      onFilterChange={callbacks?.onFilterChange}
      searchValue={controlled?.searchValue}
      onSearchChange={callbacks?.onSearchChange}
      columnPinState={controlled?.columnPinState}
      onColumnPinChange={callbacks?.onColumnPinChange}
      selectedIds={controlled?.selectedIds}
      onSelectionChange={callbacks?.onSelectionChange}
    >
      {/* Integrated toolbar - shown when search, selection+bulkActions, title, or refresh is enabled */}
      {showToolbar && (
        <IntegratedToolbar
          title={title}
          searchable={features.search ?? false}
          bulkActions={bulkActions}
          density={effectiveDensity}
          showColumnToggle={false}
          showDensityToggle={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}

      <EditingWrapper data={data} editing={editing}>
        {(inlineEditing) => (
          <DataTableInner
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
