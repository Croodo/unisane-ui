// ─── GROUPED CONFIGURATION TYPES ──────────────────────────────────────────────
// Simplified configuration objects for DataTable props grouping.
// These make the API more discoverable and reduce prop sprawl.

import type { ReactNode } from "react";
import type { Density, FilterState, MultiSortState, PinPosition } from "./core";
import type { Column } from "./column";
import type { BulkAction } from "./features";

// ─── FEATURES CONFIG ──────────────────────────────────────────────────────────

/**
 * Feature toggles for DataTable - grouped for easier configuration.
 * All features default to sensible values based on the preset.
 *
 * @example
 * ```tsx
 * <DataTable
 *   features={{
 *     selection: true,
 *     search: true,
 *     columnPinning: true,
 *   }}
 * />
 * ```
 */
export interface FeaturesConfig {
  /**
   * Enable row selection with checkboxes.
   * @default false
   */
  selection?: boolean;

  /**
   * Enable search/filter bar.
   * @default true
   */
  search?: boolean;

  /**
   * Enable column resizing via drag.
   * @default true
   */
  columnResize?: boolean;

  /**
   * Enable column pinning (freeze columns left/right).
   * @default true
   */
  columnPinning?: boolean;

  /**
   * Enable column reordering via drag-and-drop.
   * @default false
   */
  columnReorder?: boolean;

  /**
   * Enable row expansion with detail view.
   * @default false (true if renderExpandedRow is provided)
   */
  rowExpansion?: boolean;

  /**
   * Enable row drag-to-reorder.
   * @default false
   */
  rowReorder?: boolean;

  /**
   * Enable cell selection (spreadsheet-like).
   * @default false
   */
  cellSelection?: boolean;

  /**
   * Enable keyboard navigation.
   * @default true
   */
  keyboard?: boolean;

  /**
   * Export formats to enable.
   * @default [] (disabled)
   */
  export?: ("csv" | "excel" | "pdf" | "json")[] | boolean;

  /**
   * Enable print functionality.
   * @default false
   */
  print?: boolean;
}

// ─── VIRTUALIZATION CONFIG ────────────────────────────────────────────────────

/**
 * Virtualization settings for large datasets.
 *
 * @example
 * ```tsx
 * <DataTable
 *   virtualization={{
 *     rows: true,
 *     rowThreshold: 100,
 *     estimatedRowHeight: 48,
 *   }}
 * />
 * ```
 */
export interface VirtualizationConfig {
  /**
   * Enable row virtualization.
   * @default true
   */
  rows?: boolean;

  /**
   * Minimum row count before row virtualization kicks in.
   * @default 50
   */
  rowThreshold?: number;

  /**
   * Enable column virtualization (for wide tables 50+ columns).
   * @default false
   */
  columns?: boolean;

  /**
   * Minimum column count before column virtualization kicks in.
   * @default 20
   */
  columnThreshold?: number;

  /**
   * Estimated row height in pixels for virtualization calculations.
   * @default auto-calculated based on density
   */
  estimatedRowHeight?: number;

  /**
   * Number of rows to render outside visible area.
   * @default 5
   */
  overscan?: number;
}

// ─── PAGINATION CONFIG ────────────────────────────────────────────────────────

/**
 * Pagination configuration.
 *
 * @example
 * ```tsx
 * <DataTable
 *   pagination={{
 *     mode: "offset",
 *     pageSize: 25,
 *     pageSizeOptions: [10, 25, 50, 100],
 *   }}
 * />
 * ```
 */
export interface PaginationConfig {
  /**
   * Pagination mode.
   * - "offset": Traditional page-based pagination
   * - "cursor": Cursor-based pagination (for infinite scroll)
   * - "none": No pagination (show all rows)
   * @default "offset"
   */
  mode?: "offset" | "cursor" | "none";

  /**
   * Default page size.
   * @default 25
   */
  pageSize?: number;

  /**
   * Available page size options.
   * @default [10, 25, 50, 100]
   */
  pageSizeOptions?: number[];

  /**
   * Show page size selector.
   * @default true
   */
  showPageSizeSelector?: boolean;

  /**
   * Show page info (e.g., "1-25 of 100").
   * @default true
   */
  showPageInfo?: boolean;
}

// ─── EDITING CONFIG ───────────────────────────────────────────────────────────

/**
 * Inline editing configuration.
 * Simplifies the setup by auto-wiring the useInlineEditing hook.
 *
 * @example
 * ```tsx
 * <DataTable
 *   editing={{
 *     enabled: true,
 *     onSave: async (rowId, columnKey, value) => {
 *       await api.updateCell(rowId, columnKey, value);
 *     },
 *     onValidate: (rowId, columnKey, value) => {
 *       if (columnKey === "email" && !value.includes("@")) {
 *         return "Invalid email";
 *       }
 *       return null;
 *     },
 *   }}
 * />
 * ```
 */
export interface EditingConfig<T> {
  /**
   * Enable inline editing.
   * @default false
   */
  enabled?: boolean;

  /**
   * Callback when a cell value is saved.
   * Return a promise for async saving with loading state.
   */
  onSave?: (rowId: string, columnKey: string, value: unknown, row: T) => void | Promise<void>;

  /**
   * Validate cell value before saving.
   * Return error message string or null if valid.
   */
  onValidate?: (rowId: string, columnKey: string, value: unknown, row: T) => string | null;

  /**
   * Enable undo/redo history.
   * @default false
   */
  history?: boolean;

  /**
   * Maximum history entries to keep.
   * @default 50
   */
  maxHistory?: number;

  /**
   * Show feedback toasts on save/error.
   * @default true
   */
  feedback?: boolean;
}

// ─── LOADING VARIANT ──────────────────────────────────────────────────────────

/**
 * Loading display variant.
 * - "skeleton": Animated skeleton rows matching table structure (default)
 * - "spinner": Centered spinner with loading text
 * - "linear-progress": Subtle progress bar (best for refresh/background loading)
 */
export type LoadingVariant = "skeleton" | "spinner" | "linear-progress";

// ─── STYLING CONFIG ───────────────────────────────────────────────────────────

/**
 * Visual styling configuration.
 *
 * @example
 * ```tsx
 * <DataTable
 *   styling={{
 *     variant: "grid",
 *     density: "compact",
 *     zebra: true,
 *     stickyHeader: true,
 *   }}
 * />
 * ```
 */
export interface StylingConfig {
  /**
   * Display variant preset.
   * - "list": Clean list view (default)
   * - "grid": Grid with borders
   * - "minimal": Minimal styling
   * @default "list"
   */
  variant?: "list" | "grid" | "minimal";

  /**
   * Row density (affects height and padding).
   * @default "standard"
   */
  density?: Density;

  /**
   * Show column border dividers.
   * @default false (true for "grid" variant)
   */
  columnDividers?: boolean;

  /**
   * Enable zebra striping (alternating row colors).
   * @default false
   */
  zebra?: boolean;

  /**
   * Make header sticky during scroll.
   * @default true
   */
  stickyHeader?: boolean;

  /**
   * Offset for sticky positioning (for fixed navbars).
   * @default "var(--app-header-height, 0px)"
   */
  stickyOffset?: number | string;
}

// ─── CALLBACKS CONFIG ─────────────────────────────────────────────────────────

/**
 * Event callbacks grouped together.
 *
 * @example
 * ```tsx
 * <DataTable
 *   callbacks={{
 *     onRowClick: (row) => navigate(`/users/${row.id}`),
 *     onSelectionChange: (ids) => setSelectedIds(ids),
 *     onSortChange: (sort) => fetchData({ sort }),
 *   }}
 * />
 * ```
 */
export interface CallbacksConfig<T> {
  /** Called when a row is clicked or activated via keyboard */
  onRowClick?: (row: T, event: { source: "mouse" | "keyboard" }) => void;

  /** Called when row is right-clicked */
  onRowContextMenu?: (row: T, event: React.MouseEvent) => void;

  /** Called when row is hovered */
  onRowHover?: (row: T | null) => void;

  /** Called when selection changes */
  onSelectionChange?: (selectedIds: string[]) => void;

  /** Called when sort state changes */
  onSortChange?: (sortState: MultiSortState) => void;

  /** Called when filters change */
  onFilterChange?: (filters: FilterState) => void;

  /** Called when search text changes */
  onSearchChange?: (value: string) => void;

  /** Called when column pin state changes */
  onColumnPinChange?: (columnKey: string, position: PinPosition) => void;

  /** Called when column order changes */
  onColumnOrderChange?: (columnOrder: string[]) => void;

  /** Called when row order changes (drag-to-reorder) */
  onRowReorder?: (fromIndex: number, toIndex: number, newOrder: string[]) => void;
}

// ─── CONTROLLED STATE CONFIG ──────────────────────────────────────────────────

/**
 * Controlled state for fully-controlled mode.
 *
 * @example
 * ```tsx
 * const [selectedIds, setSelectedIds] = useState<string[]>([]);
 * const [sortState, setSortState] = useState<MultiSortState>([]);
 *
 * <DataTable
 *   controlled={{
 *     selectedIds,
 *     sortState,
 *   }}
 *   callbacks={{
 *     onSelectionChange: setSelectedIds,
 *     onSortChange: setSortState,
 *   }}
 * />
 * ```
 */
export interface ControlledStateConfig {
  /** Controlled selected row IDs */
  selectedIds?: string[];

  /** Controlled sort state */
  sortState?: MultiSortState;

  /** Controlled filters */
  filters?: FilterState;

  /** Controlled search value */
  searchValue?: string;

  /** Controlled column pin state */
  columnPinState?: Record<string, PinPosition>;

  /** Controlled column order */
  columnOrder?: string[];
}

// ─── PRESETS ──────────────────────────────────────────────────────────────────

/**
 * Preset configurations for common use cases.
 * Presets set sensible defaults that can be overridden.
 */
export type DataTablePreset =
  | "simple"       // Basic read-only table
  | "interactive"  // Selection, search, sorting
  | "editable"     // Inline editing with validation
  | "spreadsheet"  // Cell selection, copy/paste, keyboard nav
  | "server"       // Remote data with cursor pagination
  | "dashboard";   // Compact, dense, minimal UI

/**
 * Get default configuration for a preset.
 */
export function getPresetConfig(preset: DataTablePreset): {
  features: FeaturesConfig;
  styling: StylingConfig;
  pagination: PaginationConfig;
  virtualization: VirtualizationConfig;
} {
  switch (preset) {
    case "simple":
      return {
        features: {
          selection: false,
          search: false,
          columnResize: false,
          columnPinning: false,
          columnReorder: false,
          keyboard: true,
        },
        styling: {
          variant: "list",
          density: "standard",
          stickyHeader: true,
        },
        pagination: {
          mode: "offset",
          pageSize: 25,
        },
        virtualization: {
          rows: true,
          rowThreshold: 50,
        },
      };

    case "interactive":
      return {
        features: {
          selection: true,
          search: true,
          columnResize: true,
          columnPinning: true,
          columnReorder: true,
          keyboard: true,
          export: ["csv"],
        },
        styling: {
          variant: "list",
          density: "standard",
          stickyHeader: true,
        },
        pagination: {
          mode: "offset",
          pageSize: 25,
        },
        virtualization: {
          rows: true,
          rowThreshold: 50,
        },
      };

    case "editable":
      return {
        features: {
          selection: true,
          search: true,
          columnResize: true,
          columnPinning: true,
          keyboard: true,
        },
        styling: {
          variant: "list",
          density: "standard",
          stickyHeader: true,
        },
        pagination: {
          mode: "offset",
          pageSize: 25,
        },
        virtualization: {
          rows: true,
          rowThreshold: 50,
        },
      };

    case "spreadsheet":
      return {
        features: {
          selection: true,
          search: true,
          columnResize: true,
          columnPinning: true,
          columnReorder: true,
          cellSelection: true,
          keyboard: true,
          export: ["csv", "excel"],
        },
        styling: {
          variant: "grid",
          density: "compact",
          columnDividers: true,
          stickyHeader: true,
        },
        pagination: {
          mode: "offset",
          pageSize: 50,
        },
        virtualization: {
          rows: true,
          rowThreshold: 50,
          columns: true,
          columnThreshold: 20,
        },
      };

    case "server":
      return {
        features: {
          selection: true,
          search: true,
          columnResize: true,
          columnPinning: true,
          keyboard: true,
        },
        styling: {
          variant: "list",
          density: "standard",
          stickyHeader: true,
        },
        pagination: {
          mode: "cursor",
          pageSize: 25,
        },
        virtualization: {
          rows: false, // Server handles pagination
        },
      };

    case "dashboard":
      return {
        features: {
          selection: false,
          search: false,
          columnResize: false,
          columnPinning: false,
          keyboard: true,
        },
        styling: {
          variant: "minimal",
          density: "compact",
          stickyHeader: false,
        },
        pagination: {
          mode: "none",
          pageSize: 10,
        },
        virtualization: {
          rows: false,
        },
      };

    default:
      return getPresetConfig("interactive");
  }
}

// ─── COLUMN HELPERS ───────────────────────────────────────────────────────────

/**
 * Column definition with smart defaults.
 * Use with defineColumns() for cleaner column definitions.
 */
export interface SimpleColumn<T> {
  /** Unique key for the column (supports dot notation for nested values) */
  key: keyof T | string;

  /** Display header text */
  header: string;

  /** Column width (number = pixels, string = CSS value) */
  width?: number | string;

  /** Text alignment */
  align?: "start" | "center" | "end";

  /** Custom cell renderer */
  render?: (row: T) => ReactNode;

  /**
   * Disable all interactive features for this column.
   * Useful for action columns.
   */
  static?: boolean;

  /**
   * Override specific feature defaults.
   * By default, sortable/filterable are true for data columns.
   */
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  pinnable?: boolean;
  hideable?: boolean;
  reorderable?: boolean;

  /** Input type for inline editing */
  inputType?: "text" | "number" | "email" | "date" | "select";

  /** Options for select input type */
  selectOptions?: { label: string; value: string }[];

  /** Summary calculation for footer row */
  summary?: "sum" | "average" | "count" | "min" | "max" | ((data: T[]) => ReactNode);
}

/**
 * Define columns with smart defaults.
 * Features are enabled by default for better DX.
 *
 * @example
 * ```tsx
 * const columns = defineColumns<User>([
 *   { key: "name", header: "Name" },  // sortable, filterable by default
 *   { key: "email", header: "Email" },
 *   { key: "status", header: "Status", render: row => <Badge>{row.status}</Badge> },
 *   { key: "actions", header: "", static: true, render: row => <ActionsMenu row={row} /> },
 * ]);
 * ```
 */
export function defineColumns<T>(columns: SimpleColumn<T>[]): Column<T>[] {
  return columns.map((col) => {
    const isStatic = col.static === true;

    return {
      key: col.key,
      header: col.header,
      width: col.width,
      align: col.align,
      render: col.render ? (row: T) => col.render!(row) : undefined,

      // Smart defaults: enabled unless static or explicitly disabled
      sortable: isStatic ? false : (col.sortable ?? true),
      filterable: isStatic ? false : (col.filterable ?? true),
      editable: isStatic ? false : (col.editable ?? false), // Editing is opt-in
      pinnable: isStatic ? false : (col.pinnable ?? true),
      hideable: isStatic ? false : (col.hideable ?? true),
      reorderable: isStatic ? false : (col.reorderable ?? true),

      // Editing
      inputType: col.inputType,
      filterOptions: col.selectOptions?.map((opt) => ({
        label: opt.label,
        value: opt.value,
      })),

      // Summary
      summary: col.summary,
    } as Column<T>;
  });
}

// ─── BULK ACTIONS HELPER ──────────────────────────────────────────────────────

/**
 * Simple bulk action definition.
 */
export interface SimpleBulkAction {
  /** Action label */
  label: string;

  /** Material icon name */
  icon?: string;

  /** Action handler - receives selected row IDs */
  onClick: (selectedIds: string[]) => void | Promise<void>;

  /** Action variant for styling */
  variant?: "default" | "danger";

  /** Disable the action */
  disabled?: boolean;

  /** Show confirmation dialog before executing */
  confirm?: {
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
  };
}

/**
 * Define bulk actions with simpler syntax.
 *
 * @example
 * ```tsx
 * const bulkActions = defineBulkActions([
 *   {
 *     label: "Delete",
 *     icon: "delete",
 *     variant: "destructive",
 *     onClick: async (ids) => {
 *       await api.deleteMany(ids);
 *     },
 *     confirm: {
 *       title: "Delete items?",
 *       description: "This action cannot be undone.",
 *     },
 *   },
 *   {
 *     label: "Export",
 *     icon: "download",
 *     onClick: (ids) => exportSelected(ids),
 *   },
 * ]);
 * ```
 */
export function defineBulkActions(actions: SimpleBulkAction[]): BulkAction[] {
  return actions.map((action) => ({
    label: action.label,
    icon: action.icon,
    onClick: action.onClick,
    variant: action.variant,
    disabled: action.disabled,
    // Note: confirm dialog handling would be done in the component
  }));
}
