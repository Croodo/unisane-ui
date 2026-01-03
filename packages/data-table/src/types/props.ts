// ─── COMPONENT PROP TYPES ────────────────────────────────────────────────────
// Props for the main DataTable component and its render prop callbacks.

import type { ReactNode, CSSProperties, MouseEvent, KeyboardEvent } from "react";
import type {
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
import type { BulkAction, InlineEditingController, SparseSelectionController } from "./features";

// ─── ROW ACTIVATION EVENT ────────────────────────────────────────────────────

/**
 * Event passed to onRowClick callback.
 * Can be either a mouse click or keyboard activation (Enter/Space).
 * Use `source` to distinguish between the two.
 */
export type RowActivationEvent =
  | { source: "mouse"; event: MouseEvent }
  | { source: "keyboard"; event: KeyboardEvent };

// ─── RENDER PROP TYPES ───────────────────────────────────────────────────────

/**
 * Props passed to custom header render function
 */
export interface DataTableHeaderRenderProps<T> {
  columns: Column<T>[];
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
  /**
   * Column definitions (supports flat columns or grouped columns).
   *
   * ⚠️ **Performance Note: Reference Stability**
   *
   * For optimal performance, memoize your columns array to prevent unnecessary
   * re-renders and data reprocessing:
   *
   * ```tsx
   * // ✅ Good - stable reference
   * const columns = useMemo(() => [
   *   { key: 'name', header: 'Name' },
   *   { key: 'email', header: 'Email' },
   * ], []);
   *
   * // ❌ Bad - new array on every render (causes full re-render)
   * <DataTable columns={[{ key: 'name', header: 'Name' }]} />
   * ```
   */
  columns: Array<Column<T> | ColumnGroup<T>>;

  // ─── Identification ───
  /** Unique ID for localStorage persistence */
  tableId?: string;
  /** Table title for toolbar */
  title?: string;

  // ─── Visual Variants ───
  /** Display variant preset */
  variant?: TableVariant;
  /**
   * Enable row selection checkboxes.
   * @default false
   */
  rowSelectionEnabled?: boolean;
  /**
   * Show column border dividers.
   * When undefined, defaults based on variant (true for "grid", false otherwise).
   */
  showColumnDividers?: boolean;
  /** Enable zebra striping */
  zebra?: boolean;
  /** Make header sticky */
  stickyHeader?: boolean;
  /**
   * Row density - controls row height and padding.
   * @default "standard"
   */
  rowDensity?: Density;

  // ─── Feature Toggles ───
  /** Enable search bar */
  searchable?: boolean;
  /** Enable column resizing */
  resizable?: boolean;
  /** Enable column pinning */
  pinnable?: boolean;
  /** Enable column drag-to-reorder */
  reorderable?: boolean;
  /** Enable virtual scrolling for large datasets (row virtualization) */
  virtualize?: boolean;
  /** Row count threshold before row virtualization kicks in */
  virtualizeThreshold?: number;
  /**
   * Enable column virtualization for wide tables (50+ columns).
   * Only renders visible columns plus overscan buffer.
   * @default false
   */
  virtualizeColumns?: boolean;
  /**
   * Column count threshold before column virtualization kicks in.
   * @default 20
   */
  virtualizeColumnsThreshold?: number;
  /** Show summary/footer row with aggregated values (requires columns to have `summary` defined) */
  showSummary?: boolean;
  /** Custom label for the summary row (defaults to "Summary") */
  summaryLabel?: string;
  /**
   * Show row numbers as the first column.
   * Numbers continue across pages (e.g., page 2 starts at 11 if pageSize=10).
   * @default false
   */
  showRowNumbers?: boolean;
  /**
   * Custom header text for the row number column.
   * @default "#"
   */
  rowNumberHeader?: string;
  /**
   * Width of the row number column in pixels.
   * @default 50
   */
  rowNumberWidth?: number;

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

  // ─── Row Reordering ───
  /** Enable row drag-to-reorder */
  reorderableRows?: boolean;
  /** Callback when row order changes (returns new order of row IDs) */
  onRowReorder?: (fromIndex: number, toIndex: number, newOrder: string[]) => void;

  // ─── Events ───
  /**
   * Callback when row is activated (clicked or keyboard Enter/Space).
   * The `activation` parameter is a discriminated union indicating the source.
   * @example
   * onRowClick={(row, activation) => {
   *   if (activation.source === "mouse") {
   *     // Handle mouse click
   *   } else {
   *     // Handle keyboard activation
   *   }
   * }}
   */
  onRowClick?: (row: T, activation: RowActivationEvent) => void;
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
  /** Callback when sort state changes */
  onSortChange?: (sortState: MultiSortState) => void;
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
  /** Controlled sort state - array of sort items for multi-sort support */
  sortState?: MultiSortState;
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

  // ─── Sparse Selection ───
  /**
   * Sparse selection controller from useSparseSelection hook.
   * Enables O(1) select-all operations for large datasets (100K+ rows).
   *
   * When provided:
   * - Select-all is O(1) instead of O(n)
   * - Memory usage is constant regardless of selection size
   * - Compatible with server-side selection across pages
   *
   * @example
   * ```tsx
   * const sparseSelection = useSparseSelection({
   *   totalCount: 100000,
   *   onSelectionChange: handleChange,
   * });
   *
   * <DataTable
   *   data={data}
   *   columns={columns}
   *   sparseSelection={sparseSelection}
   * />
   * ```
   */
  sparseSelection?: SparseSelectionController;

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
   * Estimated row height in pixels for virtualization calculations.
   * Only used when virtualize is enabled. If not provided, uses density-based height.
   */
  estimateRowHeight?: number;

  // ─── RTL Support ───
  /**
   * Text direction for RTL language support.
   * When set to "rtl":
   * - Pinned columns are flipped (left becomes right, right becomes left)
   * - Keyboard navigation (arrow keys) is adjusted
   * - Scroll positions are normalized across browsers
   * @default "ltr"
   */
  dir?: "ltr" | "rtl";

  // ─── Feedback ───
  /**
   * Enable feedback notifications (toasts and ARIA announcements).
   * Requires <Toaster /> to be mounted in the app for toast display.
   * @default true
   */
  enableFeedback?: boolean;
  /**
   * Disable toast notifications (keeps ARIA announcements).
   * @default false
   */
  disableToasts?: boolean;
  /**
   * Disable ARIA announcements for screen readers (keeps toasts).
   * @default false
   */
  disableAnnouncements?: boolean;
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
  sortState: MultiSortState;
  onSortChange: (sortState: MultiSortState) => void;
  cursorPagination: CursorPagination;
  totalCount?: number;
}
