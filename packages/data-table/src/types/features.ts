// ─── FEATURE TYPES ───────────────────────────────────────────────────────────
// Types for advanced data-table features: row grouping, cell selection,
// inline editing, context menus, and bulk actions.

import type { ReactNode } from "react";

// ─── ROW GROUPING ────────────────────────────────────────────────────────────

/**
 * Aggregation function for group summaries
 */
export type GroupAggregation<T> =
  | "sum"
  | "average"
  | "count"
  | "min"
  | "max"
  | "first"
  | "last"
  | ((rows: T[]) => unknown);

/**
 * Configuration for row grouping feature
 */
export interface RowGroupingConfig<T> {
  /** Column key(s) to group by - single column or array for multi-level grouping */
  groupBy: keyof T | string | (keyof T | string)[];
  /** Whether groups are expanded by default */
  defaultExpanded?: boolean;
  /** Custom group header renderer */
  renderGroupHeader?: (props: GroupHeaderProps<T>) => ReactNode;
  /** Custom aggregation function for group summary */
  aggregations?: Record<string, GroupAggregation<T>>;
  /** Sort groups (default: ascending by group value) */
  sortGroups?: "asc" | "desc" | ((a: string, b: string) => number);
}

/**
 * Props passed to custom group header renderer
 */
export interface GroupHeaderProps<T> {
  /** The group key/value */
  groupValue: string | number | boolean | null;
  /** Display label for the group */
  groupLabel: string;
  /** Number of rows in this group */
  rowCount: number;
  /** Whether the group is expanded */
  isExpanded: boolean;
  /** Toggle expand/collapse */
  onToggle: () => void;
  /** All rows in this group */
  rows: T[];
  /** Aggregated values (if aggregations configured) */
  aggregations?: Record<string, unknown>;
  /** Depth level for nested grouping (0 = top level) */
  depth: number;
}

/**
 * A grouped row structure containing group info and child rows
 * Supports nested grouping when multiple groupBy columns are specified
 */
export interface RowGroup<T> {
  /** Type discriminator */
  type: "group";
  /** Unique group identifier (compound key for nested groups) */
  groupId: string;
  /** The value of the groupBy column at this level */
  groupValue: string | number | boolean | null;
  /** Display label for the group */
  groupLabel: string;
  /** Child rows in this group (only populated at the deepest level) */
  rows: T[];
  /** Whether the group is expanded */
  isExpanded: boolean;
  /** Aggregated values */
  aggregations: Record<string, unknown>;
  /** Depth level for nested grouping (0 = top level) */
  depth: number;
  /** The column key this group is grouped by */
  groupByKey: string;
  /** Child groups (for nested multi-level grouping) */
  childGroups?: RowGroup<T>[];
  /** Parent group ID (null for top-level groups) */
  parentGroupId?: string | null;
}

/**
 * Union type for grouped data - either a group header or a data row
 */
export type GroupedRow<T> =
  | RowGroup<T>
  | { type: "row"; data: T; groupId: string };

/**
 * State for row grouping
 */
export interface RowGroupingState {
  /** Column key(s) currently grouped by (null = no grouping, array for multi-level) */
  groupBy: string | string[] | null;
  /** Set of expanded group IDs */
  expandedGroups: Set<string>;
}

// ─── CELL SELECTION ──────────────────────────────────────────────────────────

/**
 * Represents a single cell position in the table
 */
export interface CellPosition {
  rowId: string;
  columnKey: string;
}

/**
 * Represents a cell range for selection (like Excel)
 */
export interface CellRange {
  /** Starting cell of the range (anchor point) */
  start: CellPosition;
  /** Ending cell of the range */
  end: CellPosition;
}

/**
 * State for cell selection feature
 */
export interface CellSelectionState {
  /** Currently selected cells */
  selectedCells: Set<string>; // Format: "rowId:columnKey"
  /** The active cell (has focus, receives keyboard input) */
  activeCell: CellPosition | null;
  /** Selection range anchor (for Shift+Click range selection) */
  rangeAnchor: CellPosition | null;
  /** Whether a range selection is in progress */
  isSelecting: boolean;
}

/**
 * Props for cell selection render context
 */
export interface CellSelectionContext {
  /** Whether this cell is selected */
  isSelected: boolean;
  /** Whether this cell is the active (focused) cell */
  isActive: boolean;
  /** Whether this cell is part of the current range selection */
  isInRange: boolean;
  /** Whether this cell is at a range boundary */
  isRangeEdge: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
}

// ─── INLINE EDITING ──────────────────────────────────────────────────────────

/**
 * Currently editing cell position
 */
export interface EditingCell {
  rowId: string;
  columnKey: string;
}

/**
 * Controller returned by useInlineEditing hook
 */
export interface InlineEditingController<T> {
  editingCell: EditingCell | null;
  pendingValue: unknown;
  validationError: string | null;
  isSaving: boolean;
  startEdit: (rowId: string, columnKey: string, initialValue: unknown) => void;
  cancelEdit: () => void;
  updateValue: (value: unknown) => void;
  commitEdit: () => Promise<boolean>;
  /** Clear the current validation error without canceling edit */
  clearError: () => void;
  /** Retry the last failed save operation */
  retryEdit: () => Promise<boolean>;
  isCellEditing: (rowId: string, columnKey: string) => boolean;
  getCellEditProps: (
    rowId: string,
    columnKey: string,
    value: unknown
  ) => {
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

// ─── CONTEXT MENU ────────────────────────────────────────────────────────────

/**
 * Single action item in the row context menu
 */
export interface RowContextMenuItem<T> {
  /** Unique key for the item */
  key: string;
  /** Display label */
  label: string;
  /** Optional icon (Material Symbol name or ReactNode) */
  icon?: string | ReactNode;
  /** Variant for styling */
  variant?: "default" | "danger";
  /** Callback when item is clicked */
  onClick: (row: T, event: React.MouseEvent) => void | Promise<void>;
  /** Whether the item is disabled */
  disabled?: boolean | ((row: T) => boolean);
  /** Whether to show this item */
  visible?: boolean | ((row: T) => boolean);
}

/**
 * Separator between menu item groups
 */
export interface RowContextMenuSeparator {
  type: "separator";
  /** Optional key for the separator */
  key?: string;
}

/**
 * Context menu item - either an action or separator
 */
export type RowContextMenuItemOrSeparator<T> =
  | RowContextMenuItem<T>
  | RowContextMenuSeparator;

/**
 * Props for custom context menu renderer
 */
export interface RowContextMenuRenderProps<T> {
  /** The row data */
  row: T;
  /** Mouse position */
  position: { x: number; y: number };
  /** Close the context menu */
  onClose: () => void;
  /** Selected row IDs (if any) */
  selectedIds: string[];
  /** Whether this row is selected */
  isSelected: boolean;
}

// ─── BULK ACTIONS ────────────────────────────────────────────────────────────

/**
 * Bulk action definition for operating on multiple selected rows
 */
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

// ─── TREE DATA ──────────────────────────────────────────────────────────────

/**
 * Configuration for tree data (hierarchical rows)
 */
export interface TreeDataConfig<T> {
  /**
   * Function to extract child rows from a parent row.
   * Return an array of child rows, or undefined/empty array for leaf nodes.
   */
  getSubRows?: (row: T) => T[] | undefined;

  /**
   * Field name containing child rows (alternative to getSubRows).
   * If both are provided, getSubRows takes precedence.
   */
  childrenField?: keyof T;

  /**
   * Whether tree nodes are expanded by default.
   * @default false
   */
  defaultExpanded?: boolean;

  /**
   * Maximum depth level to auto-expand.
   * Only applies when defaultExpanded is true.
   * @default Infinity
   */
  autoExpandDepth?: number;

  /**
   * Whether to show expand/collapse indicators for leaf nodes.
   * @default false
   */
  showLeafIndicator?: boolean;

  /**
   * Callback for lazy loading children when a node is expanded.
   * If provided, nodes will show loading state while fetching.
   */
  onLoadChildren?: (row: T) => Promise<T[]>;

  /**
   * Callback when a tree node is expanded.
   */
  onNodeExpand?: (row: T, path: string[]) => void;

  /**
   * Callback when a tree node is collapsed.
   */
  onNodeCollapse?: (row: T, path: string[]) => void;

  /**
   * Indent size per level in pixels.
   * @default 24
   */
  indentSize?: number;

  /**
   * Custom renderer for tree expander button.
   */
  renderExpander?: (props: TreeExpanderProps<T>) => ReactNode;
}

/**
 * Props passed to custom tree expander renderer
 */
export interface TreeExpanderProps<T> {
  /** The row data */
  row: T;
  /** Whether the node is expanded */
  isExpanded: boolean;
  /** Whether the node has children (can be expanded) */
  hasChildren: boolean;
  /** Whether children are currently loading */
  isLoading: boolean;
  /** Depth level (0 = root) */
  level: number;
  /** Toggle expand/collapse */
  onToggle: () => void;
}

/**
 * Flattened tree row for rendering (includes hierarchy metadata)
 */
export interface FlattenedTreeRow<T> {
  /** Type discriminator */
  type: "tree-row";
  /** The original row data */
  data: T;
  /** Unique ID for this tree node */
  nodeId: string;
  /** Parent node ID (null for root nodes) */
  parentId: string | null;
  /** Depth level (0 = root) */
  level: number;
  /** Path of ancestor IDs from root to this node */
  path: string[];
  /** Whether this node has children */
  hasChildren: boolean;
  /** Whether this node is expanded */
  isExpanded: boolean;
  /** Whether children are currently loading (for lazy load) */
  isLoading: boolean;
  /** Whether this is the last child among its siblings */
  isLastChild: boolean;
  /** Indices of ancestors that are last children (for tree line rendering) */
  lastChildIndices: number[];
}

/**
 * State for tree data feature
 */
export interface TreeDataState {
  /** Set of expanded tree node IDs */
  expandedNodes: Set<string>;
  /** Set of node IDs currently loading children */
  loadingNodes: Set<string>;
  /** Map of lazy-loaded children by parent node ID */
  loadedChildren: Map<string, unknown[]>;
}

/**
 * Tree selection mode for parent-child relationships
 */
export type TreeSelectionMode =
  | "independent"      // Selection doesn't affect parent/children
  | "cascade-down"     // Selecting parent selects all descendants
  | "cascade-up"       // Selecting all children selects parent
  | "cascade-both";    // Both cascading behaviors

/**
 * Context for tree row rendering
 */
export interface TreeRowContext<T> {
  /** Current row's flattened tree data */
  node: FlattenedTreeRow<T>;
  /** Function to expand this node */
  expand: () => void;
  /** Function to collapse this node */
  collapse: () => void;
  /** Function to toggle this node */
  toggle: () => void;
  /** Function to expand all descendants */
  expandAll: () => void;
  /** Function to collapse all descendants */
  collapseAll: () => void;
}
