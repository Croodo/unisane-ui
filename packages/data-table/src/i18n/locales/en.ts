import type { DataTableStrings } from "../types";

/**
 * English (default) translations for DataTable
 */
export const enStrings: DataTableStrings = {
  // ─── Empty States ───
  noResults: "No results found",
  noResultsHint: "Try adjusting your search or filters",
  loading: "Loading data...",

  // ─── Empty Value Indicators ───
  empty: "(Empty)",
  invalidDate: "(Invalid Date)",
  invalidNumber: "(Invalid Number)",

  // ─── Boolean Values ───
  booleanTrue: "Yes",
  booleanFalse: "No",

  // ─── Pagination ───
  pageOfTotal: "Page {page} of {totalPages}",
  rangeOfTotal: "{start}-{end} of {total}",
  perPage: "{count} per page",
  noItems: "No items",
  itemCount: "{count} items",
  allItems: "All items",
  cursorPagination: "{count} items (page {page})",
  previous: "Previous",
  next: "Next",

  // ─── Selection ───
  selectedCount: "{count} selected",
  selectAll: "Select all rows",
  deselectAll: "Deselect all",

  // ─── Column Menu ───
  pinLeft: "Pin to left",
  unpinLeft: "Unpin from left",
  pinRight: "Pin to right",
  unpinRight: "Unpin from right",
  hideColumn: "Hide column",
  filterBy: "Filter by {column}",
  filterActive: "Active",
  clearFilter: "Clear filter",
  searchColumn: "Search {column}...",
  apply: "Apply",
  clear: "Clear",
  clearAll: "Clear all",
  filtersLabel: "Filters",
  searchLabel: "Search",

  // ─── Grouping ───
  groupByColumn: "Group by this column",
  removeGrouping: "Remove grouping",
  addToGrouping: "Add to grouping (Level {level})",
  groupEmpty: "No items",
  groupItemSingular: "item",
  groupItemPlural: "{count} items",
  expandGroup: "Click to expand",
  collapseGroup: "Click to collapse",
  groupedByLabel: "Grouped by",
  none: "None",
  selectGroupRows: "Select all {count} rows in {label}",
  removeGroupingLabel: "Remove {label} grouping",
  groupApplied: "Grouped by {column}",

  // ─── Summary Row ───
  summary: "Summary",
  summaryTotal: "Total",
  summaryAverage: "Avg",
  summaryCount: "Count",
  summaryMin: "Min",
  summaryMax: "Max",

  // ─── Export ───
  export: "Export",
  exportCsv: "CSV",
  exportCsvDesc: "Comma-separated values",
  exportExcel: "Excel",
  exportExcelDesc: "Microsoft Excel (.xlsx)",
  exportPdf: "PDF",
  exportPdfDesc: "Portable Document Format",
  exportJson: "JSON",
  exportJsonDesc: "JavaScript Object Notation",
  exportHtml: "HTML",
  exportHtmlDesc: "Web page format",
  exportStarted: "Exporting to {format}...",
  exportSuccess: "Exported to {format} successfully",
  exportFailed: "Export failed",

  // ─── Search ───
  searchPlaceholder: "Search...",
  openSearch: "Open search",
  clearSearch: "Clear search",

  // ─── Row Actions ───
  expandRow: "Expand row",
  collapseRow: "Collapse row",
  selectRowLabel: "Select row {id}",

  // ─── Toolbar ───
  columns: "Columns",
  density: "Density",
  densityCompact: "Compact",
  densityDense: "Dense",
  densityStandard: "Standard",
  densityComfortable: "Comfortable",
  moreActions: "More",
  filter: "Filter",
  download: "Download",
  print: "Print",
  refresh: "Refresh",
  expandAllGroups: "Expand all groups",
  collapseAllGroups: "Collapse all groups",

  // ─── Frozen Columns ───
  frozenLeft: "{count} left",
  frozenRight: "{count} right",
  unfreezeAll: "Unfreeze all columns",

  // ─── Column Sorting ───
  sortColumn: "Sort column",
  sortDescending: "Sort descending",
  clearSort: "Clear sort",

  // ─── Column Resize ───
  resizeColumn: "Drag to resize column",

  // ─── Row Reorder ───
  dragRowHandle: "Drag to reorder row. Use Alt+Arrow keys to move.",
  dragRowHandleLabel: "Drag to reorder row {index}. Use Alt+Arrow keys to move.",
  srRowMoved: "Row moved from position {from} to position {to}",

  // ─── Tree Data ───
  expandAllNodes: "Expand all",
  collapseAllNodes: "Collapse all",
  loadingChildren: "Loading...",
  noChildren: "No items",
  srNodeExpanded: "Node {label} expanded",
  srNodeCollapsed: "Node {label} collapsed",

  // ─── Infinite Scroll ───
  loadingMore: "Loading more...",
  endOfList: "No more items",
  loadMore: "Load more",
  srItemsLoaded: "{count} items loaded",

  // ─── Clipboard ───
  copy: "Copy",
  paste: "Paste",
  cut: "Cut",
  pasteSuccess: "{count} cell(s) pasted",
  pasteFailed: "Paste failed",
  pasteValidationError: "{count} cell(s) failed validation",
  pasteNoData: "No data to paste",
  srCellsCopied: "{count} cell(s) copied to clipboard",
  srCellsPasted: "{count} cell(s) pasted",

  // ─── Undo/Redo ───
  undo: "Undo",
  redo: "Redo",
  undoCellEdit: "Undo {column} edit",
  redoCellEdit: "Redo {column} edit",
  nothingToUndo: "Nothing to undo",
  nothingToRedo: "Nothing to redo",
  srUndone: "Undone: {description}",
  srRedone: "Redone: {description}",

  // ─── Filter Presets ───
  presets: "Presets",
  savePreset: "Save as preset",
  applyPreset: "Apply preset",
  deletePreset: "Delete preset",
  editPreset: "Edit preset",
  duplicatePreset: "Duplicate preset",
  presetName: "Preset name",
  presetNamePlaceholder: "Enter preset name...",
  quickFilter: "Quick filter",
  addQuickFilter: "Add to quick filters",
  removeQuickFilter: "Remove from quick filters",
  defaultPreset: "Default",
  customPreset: "Custom",
  importPresets: "Import presets",
  exportPresets: "Export presets",
  presetSaved: "Preset \"{name}\" saved",
  presetDeleted: "Preset \"{name}\" deleted",
  presetApplied: "Preset \"{name}\" applied",
  maxPresetsReached: "Maximum {max} presets reached",
  srPresetApplied: "Filter preset {name} applied",
  srPresetSaved: "Filter preset {name} saved",

  // ─── Compound Filters ───
  filterBuilder: "Filter Builder",
  addCondition: "Add condition",
  addFilterGroup: "Add group",
  removeCondition: "Remove condition",
  removeFilterGroup: "Remove group",
  operatorAnd: "AND",
  operatorOr: "OR",
  opEquals: "equals",
  opNotEquals: "not equals",
  opContains: "contains",
  opNotContains: "not contains",
  opStartsWith: "starts with",
  opEndsWith: "ends with",
  opGreaterThan: "greater than",
  opLessThan: "less than",
  opBetween: "between",
  opIsEmpty: "is empty",
  opIsNotEmpty: "is not empty",
  opIn: "in",
  opNotIn: "not in",
  filterGroupLabel: "Filter group ({operator})",
  selectColumn: "Select column",
  selectOperator: "Select operator",
  enterValue: "Enter value",

  // ─── Column Spanning ───
  mergeCells: "Merge cells",
  unmergeCells: "Unmerge cells",
  spanColumns: "Span {count} columns",
  cellMerged: "Cell merged",
  srCellSpansColumns: "Cell spans {count} columns",

  // ─── Sticky Group Headers ───
  stickyHeader: "Sticky header",
  pinnedGroupHeader: "Pinned: {label}",
  srGroupHeaderSticky: "Group header {label} is pinned",
  srShowingGroupItems: "Showing {count} items in {label}",

  // ─── Context Menu ───
  viewDetails: "View details",
  edit: "Edit",
  duplicate: "Duplicate",
  select: "Select",
  copyId: "Copy ID",
  delete: "Delete",

  // ─── Inline Editing ───
  cellNotEditable: "This cell is not editable",
  cellUpdated: "Cell updated",
  rowDeleted: "Row deleted",

  // ─── Actions Cell ───
  actions: "Actions",

  // ─── Row Numbers ───
  rowNumberHeader: "#",
  srRowNumber: "Row {number}",

  // ─── Errors ───
  errorTitle: "Something went wrong",
  errorMessage: "An unexpected error occurred while loading the table.",
  errorDetails: "Error details",
  retry: "Try again",
  dismissError: "Dismiss",
  showErrorDetails: "Show details",
  hideErrorDetails: "Hide details",
  copyError: "Copy error",
  errorCopied: "Error copied to clipboard",

  // ─── Error Messages (User-Facing) ───
  errorDuplicateRowId: "Duplicate row ID \"{id}\" found. Each row must have a unique ID.",
  errorMissingRowId: "Row at index {index} is missing an ID.",
  errorInvalidDataFormat: "The data format is invalid. Please check the data structure.",
  errorDataFetchFailed: "Failed to load data. Please try again.",
  errorInvalidColumnKey: "Invalid column key \"{key}\". Column keys must be non-empty strings.",
  errorDuplicateColumnKey: "Duplicate column key \"{key}\" found. Each column must have a unique key.",
  errorMissingColumnAccessor: "Column \"{key}\" is missing an accessor. Add a key or render function.",
  errorInvalidConfig: "Invalid table configuration. Please check the settings.",
  errorMissingRequiredProp: "Required property \"{prop}\" is missing.",
  errorIncompatibleOptions: "Some options are incompatible. Please check the configuration.",
  errorContextNotFound: "Table context not found. Ensure this component is inside a DataTable.",
  errorProviderMissing: "DataTable provider is missing. Wrap your component with DataTableProvider.",
  errorRenderFailed: "Failed to render {component}. Using fallback display.",
  errorVirtualizationFailed: "Virtualization error. Falling back to standard rendering.",
  errorEditFailed: "Failed to save changes to column \"{column}\".",
  errorSelectionFailed: "Failed to update selection.",
  errorExportFailed: "Failed to export to {format}. Please try again.",
  errorFilterFailed: "Filter failed for column \"{column}\". Showing all results.",
  errorSortFailed: "Sort failed for column \"{column}\". Data may not be properly sorted.",
  errorSearchFailed: "Search failed. Please try again.",
  errorGeneric: "An unexpected error occurred.",

  // ─── Error Severity Labels ───
  severityWarning: "Warning",
  severityError: "Error",
  severityCritical: "Critical",
  severityFatal: "Fatal",

  // ─── Error Recovery Messages ───
  errorRecoveryAttempting: "Attempting to recover...",
  errorRecoverySuccess: "Recovered successfully",
  errorRecoveryFailed: "Recovery failed",
  errorUsingFallback: "Using default value",

  // ─── Screen Reader Announcements ───
  srStatusUpdate: "{selectedCount} row(s) selected. Showing {totalCount} results. {sortInfo}",
  srSortedAsc: "Sorted ascending by {column}",
  srSortedDesc: "Sorted descending by {column}",
  srNotSorted: "Not sorted",
  srFilterApplied: "{count} filter(s) applied",
  srFilterCleared: "All filters cleared",
  srRowSelected: "Row {id} selected",
  srRowDeselected: "Row {id} deselected",
  srAllSelected: "All {count} rows selected",
  srAllDeselected: "All rows deselected",
  srGroupExpanded: "Group {label} expanded",
  srGroupCollapsed: "Group {label} collapsed",
  srTableDescription: "Data table with {rowCount} rows and {columnCount} columns",
};
