// ─── COMPONENT PROP TYPES ────────────────────────────────────────────────────
// Props for the main DataTable component and its render prop callbacks.

import type { ReactNode, CSSProperties } from "react";
import type {
  SortDirection,
  MultiSortState,
  FilterState,
  FilterValue,
  TableVariant,
  Density,
  PinPosition,
  ColumnPinState,
  CursorPagination,
} from "./core";
import type { Column, ColumnGroup } from "./column";
import type { BulkAction, InlineEditingController } from "./features";

// ─── RENDER PROP TYPES ───────────────────────────────────────────────────────

/**
 * Props passed to custom header render function
 */
export interface DataTableHeaderRenderProps<T> {
  columns: Column<T>[];
  /** @deprecated Use sortState instead */
  sortKey: string | null;
  /** @deprecated Use sortState instead */
  sortDirection: SortDirection;
  /** Multi-sort state - array of sort items in priority order */
  sortState: MultiSortState;
  onSort: (key: string, addToMultiSort?: boolean) => void;
  selectable: boolean;
  allSelected: boolean;
  indeterminate: boolean;
  onSelectAll: (checked: boolean) => void;
  enableExpansion: boolean;
}

/**
 * Props passed to custom toolbar render function
 */
export interface DataTableToolbarRenderProps<T> {
  columns: Column<T>[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: FilterState;
  onFilterChange: (key: string, value: FilterValue) => void;
  onClearFilters: () => void;
  selectedCount: number;
  totalCount: number;
  visibleColumns: Column<T>[];
  onColumnVisibilityChange: (key: string) => void;
  onShowAllColumns: () => void;
}

// ─── MAIN PROPS ──────────────────────────────────────────────────────────────

/**
 * Main DataTable component props
 */
export interface DataTableProps<T extends { id: string }> {
  // ─── Required ───
  /** Data rows to display */
  data: T[];
  /** Column definitions (supports flat columns or grouped columns) */
  columns: Array<Column<T> | ColumnGroup<T>>;

  // ─── Identification ───
  /** Unique ID for localStorage persistence */
  tableId?: string;
  /** Table title for toolbar */
  title?: string;

  // ─── Visual Variants ───
  /** Display variant preset */
  variant?: TableVariant;
  /** Enable row selection checkboxes */
  selectable?: boolean;
  /** Show column border dividers */
  columnBorders?: boolean;
  /** Enable zebra striping */
  zebra?: boolean;
  /** Make header sticky */
  stickyHeader?: boolean;
  /** Row density */
  density?: Density;

  // ─── Feature Toggles ───
  /** Enable search bar */
  searchable?: boolean;
  /** Enable column resizing */
  resizable?: boolean;
  /** Enable column pinning */
  pinnable?: boolean;
  /** Enable column drag-to-reorder */
  reorderable?: boolean;
  /** Enable virtual scrolling for large datasets */
  virtualize?: boolean;
  /** Row count threshold before virtualization kicks in */
  virtualizeThreshold?: number;
  /** Show summary/footer row with aggregated values (requires columns to have `summary` defined) */
  showSummary?: boolean;
  /** Custom label for the summary row (defaults to "Summary") */
  summaryLabel?: string;

  // ─── Pagination ───
  /** Pagination mode */
  pagination?: "offset" | "cursor" | "none";
  /** Default page size */
  pageSize?: number;
  /** Page size options */
  pageSizeOptions?: number[];

  // ─── Remote Data ───
  /** Data source mode */
  mode?: "local" | "remote";
  /** Loading state */
  loading?: boolean;
  /** Refreshing state (for showing spinner while data exists) */
  refreshing?: boolean;
  /** Total items (for pagination info) */
  totalCount?: number;
  /** Callback to refresh data */
  onRefresh?: () => void | Promise<void>;

  // ─── Cursor Pagination (remote) ───
  /** Cursor pagination config */
  cursorPagination?: CursorPagination;

  // ─── Bulk Actions ───
  /** Bulk action definitions */
  bulkActions?: BulkAction[];

  // ─── Row Expansion ───
  /** Render expanded row content */
  renderExpandedRow?: (row: T) => ReactNode;
  /** Determine if row can expand */
  getRowCanExpand?: (row: T) => boolean;

  // ─── Events ───
  /** Callback when row is clicked */
  onRowClick?: (row: T, event: React.MouseEvent) => void;
  /** Callback when row is right-clicked (context menu) */
  onRowContextMenu?: (row: T, event: React.MouseEvent) => void;
  /** Callback when row is hovered (null when mouse leaves) */
  onRowHover?: (row: T | null) => void;
  /** Callback when selection changes */
  onSelectionChange?: (selectedIds: string[]) => void;
  /**
   * Async callback to select all rows across the filtered dataset (server-backed).
   * When provided, the "Select all" checkbox will trigger this for full dataset selection.
   * Return array of row IDs to mark selected.
   */
  onSelectAllFiltered?: () => Promise<string[]>;
  /** Callback when sort changes (single-sort mode, for backward compatibility) */
  onSortChange?: (key: string | null, direction: SortDirection) => void;
  /** Callback when multi-sort state changes */
  onMultiSortChange?: (sortState: MultiSortState) => void;
  /** Callback when filters change */
  onFilterChange?: (filters: FilterState) => void;
  /** Callback when search changes */
  onSearchChange?: (value: string) => void;
  /** Callback when column pin changes */
  onColumnPinChange?: (columnKey: string, position: PinPosition) => void;
  /** Callback when column order changes */
  onColumnOrderChange?: (columnOrder: string[]) => void;

  // ─── Controlled State ───
  /** Controlled selected row IDs */
  selectedIds?: string[];
  /** Controlled sort key (single-sort mode, for backward compatibility) */
  sortKey?: string | null;
  /** Controlled sort direction (single-sort mode) */
  sortDirection?: SortDirection;
  /** Controlled multi-sort state */
  sortState?: MultiSortState;
  /** Enable multi-column sorting (Shift+Click to add columns) */
  multiSort?: boolean;
  /** Maximum number of sort columns (default: 3) */
  maxSortColumns?: number;
  /** Controlled filters */
  filters?: FilterState;
  /** Controlled search value */
  searchValue?: string;
  /** Controlled column pin state */
  columnPinState?: ColumnPinState;
  /** Controlled column order (array of column keys) */
  columnOrder?: string[];

  // ─── Inline Editing ───
  /** Inline editing controller from useInlineEditing hook */
  inlineEditing?: InlineEditingController<T>;

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

  // ─── Custom Rendering ───
  /**
   * Custom header renderer to replace the default table header.
   * Can be a ReactNode or a function that receives default header props.
   */
  renderHeader?:
    | ((props: DataTableHeaderRenderProps<T>) => ReactNode)
    | ReactNode;
  /**
   * Custom toolbar renderer to replace the default toolbar.
   * Can be a ReactNode or a function that receives default toolbar props.
   */
  renderToolbar?:
    | ((props: DataTableToolbarRenderProps<T>) => ReactNode)
    | ReactNode;

  // ─── Layout ───
  /**
   * Tailwind class for sticky header offset (e.g., "top-16" when there's a navbar).
   * Applied to the table header for proper sticky positioning.
   */
  headerOffsetClassName?: string;
  /**
   * Estimated row height in pixels for virtualization calculations.
   * Only used when virtualize is enabled. If not provided, uses density-based height.
   */
  estimateRowHeight?: number;
}

// ─── REMOTE DATA PROPS ───────────────────────────────────────────────────────

/**
 * Props generated by useRemoteDataTable hook for DataTable
 */
export interface RemoteDataTableProps<T> {
  data: T[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  mode: "remote";
  pagination: "cursor";
  searchValue: string;
  onSearchChange: (val: string) => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  sortKey: string | null;
  sortDirection: SortDirection;
  onSortChange: (key: string | null, direction: SortDirection) => void;
  cursorPagination: CursorPagination;
  totalCount?: number;
}
