import type { ReactNode } from "react";
import type { BulkAction, Density } from "../../types";
import type { ExportFormat } from "../../utils/export";

/** Export handler configuration */
export interface ExportHandler {
  /** Callback when export is triggered */
  onExport: (format: ExportFormat) => void;
  /** Available formats (defaults to all: csv, excel, pdf, json) */
  formats?: ExportFormat[];
  /** Currently exporting format (shows loading state) */
  exporting?: ExportFormat | null;
}

/** Print handler configuration */
export interface PrintHandler {
  /** Callback to print all rows */
  onPrint: () => void;
  /** Callback to print selected rows only (optional) */
  onPrintSelected?: () => void;
  /** Whether printing is in progress */
  isPrinting?: boolean;
}

/** Action button displayed in the toolbar */
export interface ToolbarAction {
  /** Unique key for React */
  key: string;
  /** Button label */
  label: string;
  /** Material Symbols icon name */
  icon?: string;
  /** Click handler */
  onClick: () => void;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Button variant - primary shows filled, others show outlined */
  variant?: "primary" | "secondary" | "danger";
  /** If true, shows only icon on mobile, label on larger screens */
  iconOnly?: boolean;
  /** Badge count to show on the button (e.g., for issues count) */
  badge?: number;
}

/** Dropdown option for toolbar dropdowns */
export interface ToolbarDropdownOption {
  /** Unique value */
  value: string;
  /** Display label */
  label: string;
  /** Material Symbols icon name */
  icon?: string;
}

/** Dropdown menu displayed in the toolbar */
export interface ToolbarDropdown {
  /** Unique key for React */
  key: string;
  /** Dropdown label prefix (e.g., "Columns:") */
  label?: string;
  /** Current selected value to display */
  value: string;
  /** Available options */
  options: ToolbarDropdownOption[];
  /** Change handler */
  onChange: (value: string) => void;
  /** Material Symbols icon name */
  icon?: string;
}

/** Icon-only button in toolbar */
export interface ToolbarIconAction {
  /** Unique key for React */
  key: string;
  /** Material Symbols icon name */
  icon: string;
  /** Tooltip/aria label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Whether active state */
  active?: boolean;
  /** Whether disabled */
  disabled?: boolean;
}

/** Toolbar props */
export interface DataTableToolbarProps<T> {
  title?: string;
  searchable?: boolean;
  selectedCount?: number;
  selectedIds?: string[];
  bulkActions?: BulkAction[];
  onClearSelection?: () => void;
  /** Export configuration with multi-format support */
  exportHandler?: ExportHandler;
  /** Print configuration */
  printHandler?: PrintHandler;
  onRefresh?: () => void;
  refreshing?: boolean;
  density?: Density;
  onDensityChange?: (density: Density) => void;
  startItem?: number;
  endItem?: number;
  totalItems?: number;
  /** Primary action buttons (left side) */
  actions?: ToolbarAction[];
  /** "More" dropdown actions for overflow */
  moreActions?: ToolbarAction[];
  /** Dropdown menus (right side, before icons) */
  dropdowns?: ToolbarDropdown[];
  /** Additional icon buttons (right side) */
  iconActions?: ToolbarIconAction[];
  /** Custom content to render in the left section */
  leftContent?: ReactNode;
  /** Custom content to render in the right section */
  rightContent?: ReactNode;
  /** Whether to show column visibility toggle */
  showColumnToggle?: boolean;
  /** Whether to show density toggle */
  showDensityToggle?: boolean;
  /** Whether to show filter button */
  showFilter?: boolean;
  /** Filter click handler */
  onFilterClick?: () => void;
  /** Whether filters are active */
  filtersActive?: boolean;
  /** Use segmented button style for toolbar controls (Columns, Density, etc.) */
  segmentedControls?: boolean;
  /** Whether row grouping is currently active */
  isGrouped?: boolean;
  /** Whether all groups are currently expanded */
  allGroupsExpanded?: boolean;
  /** Callback to toggle expand/collapse all groups */
  onToggleAllGroups?: () => void;
  /** Whether to show the grouping pills bar when grouping is active */
  showGroupingPills?: boolean;
  /** Number of columns frozen on the left */
  frozenLeftCount?: number;
  /** Number of columns frozen on the right */
  frozenRightCount?: number;
  /** Callback to unfreeze all columns */
  onUnfreezeAll?: () => void;
}
