import type { ReactNode, CSSProperties } from "react";

// ─── SORT & FILTER TYPES ────────────────────────────────────────────────────

export type SortDirection = "asc" | "desc" | null;

export type FilterValue =
  | string
  | number
  | boolean
  | Date
  | string[]
  | number[]
  | (string | number)[]
  | { min?: number | string; max?: number | string }
  | { start?: Date | string; end?: Date | string }
  | null
  | undefined;

export interface FilterState {
  [key: string]: FilterValue;
}

// ─── COLUMN TYPES ───────────────────────────────────────────────────────────

export type PinPosition = "left" | "right" | null;

export type ColumnPinState = Record<string, PinPosition>;

export type FilterType = "text" | "select" | "multi-select" | "number-range" | "date-range";

/**
 * Column group for hierarchical headers
 * Groups multiple columns under a single parent header
 */
export interface ColumnGroup<T> {
  /** Display header text for the group */
  header: string;
  /** Child columns in this group */
  children: Column<T>[];
}

export interface FilterOption {
  label: string;
  value: string | number;
  count?: number;
}

export interface FilterRendererProps<V = FilterValue> {
  value: V;
  onChange: (value: V) => void;
}

export interface CellContext<T = unknown> {
  row: T;
  rowIndex: number;
  columnKey: string;
  isSelected: boolean;
  isExpanded: boolean;
}

export interface Column<T> {
  /** Unique key for the column (can use dot notation for nested values) */
  key: keyof T | string;
  /** Display header text */
  header: string;
  /** Column width (number = pixels, string = CSS value) */
  width?: number | string;
  /** Minimum width during resize */
  minWidth?: number;
  /** Maximum width during resize */
  maxWidth?: number;
  /** Text alignment */
  align?: "start" | "center" | "end";

  // ─── Per-Column Features ───
  /** Enable sorting for this column */
  sortable?: boolean;
  /** Enable filtering for this column */
  filterable?: boolean;
  /** Enable inline editing for this column */
  editable?: boolean;
  /** Input type for inline editing (defaults to "text") */
  inputType?: "text" | "number" | "email" | "tel" | "url" | "date" | "time" | "datetime-local";
  /** Allow pinning this column */
  pinnable?: boolean;
  /** Allow hiding this column */
  hideable?: boolean;
  /** Static pin position (user can override) */
  pinned?: "left" | "right";

  // ─── Rendering ───
  /** Custom cell renderer */
  render?: (row: T, ctx: CellContext<T>) => ReactNode;
  /** Custom header renderer */
  headerRender?: () => ReactNode;

  // ─── Sorting ───
  /** Custom sort function for this column (returns negative, zero, or positive) */
  sortFn?: (a: T, b: T) => number;

  // ─── Filtering ───
  /** Filter input type */
  filterType?: FilterType;
  /** Options for select/multi-select filters */
  filterOptions?: FilterOption[];
  /** Custom filter renderer */
  filterRenderer?: (props: FilterRendererProps) => ReactNode;
  /** Custom filter function for local filtering */
  filterFn?: (row: T, filterValue: FilterValue) => boolean;

  // ─── Summary Row (Future Feature) ───
  /**
   * Summary calculation for footer row
   * @future This feature is planned but not yet implemented.
   * When implemented, it will render a summary footer row with aggregated values.
   */
  summary?: "sum" | "average" | "count" | "min" | "max" | ((data: T[]) => ReactNode);
}

// ─── BULK ACTIONS ───────────────────────────────────────────────────────────

export interface BulkAction {
  /** Action label */
  label: string;
  /** Callback with selected row IDs */
  onClick: (ids: string[]) => void | Promise<void>;
  /** Optional icon */
  icon?: ReactNode;
  /** Variant for styling */
  variant?: "default" | "danger";
  /** Disable when condition not met */
  disabled?: boolean | ((ids: string[]) => boolean);
}

// ─── PAGINATION ─────────────────────────────────────────────────────────────

export interface PaginationState {
  page: number;
  pageSize: number;
}

export interface CursorPagination {
  nextCursor?: string;
  prevCursor?: string;
  limit: number;
  pageIndex?: number;
  onNext: () => void;
  onPrev: () => void;
  onLimitChange: (limit: number) => void;
}

// ─── TABLE VARIANTS ─────────────────────────────────────────────────────────

/**
 * Table display variant presets
 * - "grid": Full featured with borders, column dividers (default for data editing)
 * - "list": Row borders only, cleaner look (default for read-only lists)
 * - "minimal": No borders, compact (ideal for logs/audit trails)
 */
export type TableVariant = "grid" | "list" | "minimal";

/**
 * Row density presets
 * - "compact": Tight spacing for data-dense views
 * - "dense": Slightly more compact than standard
 * - "standard": Default spacing
 * - "comfortable": Extra spacing for touch-friendly interfaces
 */
export type Density = "compact" | "dense" | "standard" | "comfortable";

// ─── INLINE EDITING ─────────────────────────────────────────────────────────

export interface EditingCell {
  rowId: string;
  columnKey: string;
}

export interface InlineEditingController<T> {
  editingCell: EditingCell | null;
  pendingValue: unknown;
  validationError: string | null;
  isSaving: boolean;
  startEdit: (rowId: string, columnKey: string, initialValue: unknown) => void;
  cancelEdit: () => void;
  updateValue: (value: unknown) => void;
  commitEdit: () => Promise<boolean>;
  isCellEditing: (rowId: string, columnKey: string) => boolean;
  getCellEditProps: (rowId: string, columnKey: string, value: unknown) => {
    isEditing: boolean;
    onDoubleClick: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
  };
  getInputProps: () => {
    value: string | number | readonly string[] | undefined;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onBlur: () => void;
    autoFocus: boolean;
    disabled: boolean;
    "aria-invalid": boolean;
  };
}

// ─── MAIN PROPS ─────────────────────────────────────────────────────────────

/** Header component props for custom header rendering */
export interface DataTableHeaderRenderProps<T> {
  columns: Column<T>[];
  sortKey: string | null;
  sortDirection: SortDirection;
  onSort: (key: string) => void;
  selectable: boolean;
  allSelected: boolean;
  indeterminate: boolean;
  onSelectAll: (checked: boolean) => void;
  enableExpansion: boolean;
}

/** Toolbar props for custom toolbar rendering */
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
  /** Enable virtual scrolling for large datasets */
  virtualize?: boolean;
  /** Row count threshold before virtualization kicks in */
  virtualizeThreshold?: number;

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
  /** Callback when sort changes */
  onSortChange?: (key: string | null, direction: SortDirection) => void;
  /** Callback when filters change */
  onFilterChange?: (filters: FilterState) => void;
  /** Callback when search changes */
  onSearchChange?: (value: string) => void;
  /** Callback when column pin changes */
  onColumnPinChange?: (columnKey: string, position: PinPosition) => void;

  // ─── Controlled State ───
  /** Controlled selected row IDs */
  selectedIds?: string[];
  /** Controlled sort key */
  sortKey?: string | null;
  /** Controlled sort direction */
  sortDirection?: SortDirection;
  /** Controlled filters */
  filters?: FilterState;
  /** Controlled search value */
  searchValue?: string;
  /** Controlled column pin state */
  columnPinState?: ColumnPinState;

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
  renderHeader?: ((props: DataTableHeaderRenderProps<T>) => ReactNode) | ReactNode;
  /**
   * Custom toolbar renderer to replace the default toolbar.
   * Can be a ReactNode or a function that receives default toolbar props.
   */
  renderToolbar?: ((props: DataTableToolbarRenderProps<T>) => ReactNode) | ReactNode;

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

// ─── UTILITY TYPES ──────────────────────────────────────────────────────────

export interface ColumnMeta {
  width: number;
  left?: number;
  right?: number;
}

export type ColumnMetaMap = Record<string, ColumnMeta>;

/**
 * Type guard to check if a column definition is a ColumnGroup
 */
export function isColumnGroup<T>(
  col: Column<T> | ColumnGroup<T>
): col is ColumnGroup<T> {
  return "children" in col && Array.isArray(col.children);
}

/**
 * Extract flat list of columns from a mixed array of columns and column groups
 */
export function flattenColumns<T>(
  columns: Array<Column<T> | ColumnGroup<T>>
): Column<T>[] {
  return columns.flatMap((col) =>
    isColumnGroup(col) ? col.children : [col]
  );
}

/**
 * Check if any column groups exist in the column definitions
 */
export function hasColumnGroups<T>(
  columns: Array<Column<T> | ColumnGroup<T>>
): boolean {
  return columns.some((col) => isColumnGroup(col));
}

// ─── HOOK TYPES ─────────────────────────────────────────────────────────────

export interface UseInlineEditingOptions<T extends { id: string }> {
  data: T[];
  onCellChange?: (
    rowId: string,
    columnKey: string,
    value: unknown,
    row: T
  ) => void | Promise<void>;
  onCancelEdit?: (rowId: string, columnKey: string) => void;
  onStartEdit?: (rowId: string, columnKey: string) => void;
  validateCell?: (
    rowId: string,
    columnKey: string,
    value: unknown
  ) => string | null | undefined;
  enabled?: boolean;
}

export interface UseRemoteDataTableOptions<T> {
  /** List params from SDK hook */
  params: {
    searchValue: string;
    onSearchChange: (val: string) => void;
    filters: Record<string, unknown>;
    onFiltersChange: (next: Record<string, unknown>) => void;
    sortDescriptor: { key: string; direction: "asc" | "desc" };
    onSortChange: (key: string | null, dir: SortDirection) => void;
    buildCursorPagination: (cursors: { next?: string; prev?: string }) => CursorPagination;
  };
  /** Query result from React Query */
  query: {
    data?: { items?: T[]; nextCursor?: string; prevCursor?: string } | T[] | null;
    isLoading: boolean;
    isFetching: boolean;
    refetch?: () => Promise<unknown>;
  };
  /** Optional stats query for total count */
  statsQuery?: {
    data?: { total?: number };
    isLoading: boolean;
  };
  /** Initial/fallback data */
  initialData?: {
    items?: T[];
    nextCursor?: string;
    prevCursor?: string;
  } | T[];
}

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
