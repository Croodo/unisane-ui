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
  /** If true, shows only icon on mobile */
  iconOnly?: boolean;
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
  /** @deprecated Use `exportHandler` instead for multi-format support */
  onExport?: () => void;
  /** Export configuration with multi-format support */
  exportHandler?: ExportHandler;
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
}
