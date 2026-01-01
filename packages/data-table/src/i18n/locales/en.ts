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

  // ─── Column Resize ───
  resizeColumn: "Drag to resize column",

  // ─── Row Reorder ───
  dragRowHandle: "Drag to reorder row. Use Alt+Arrow keys to move.",
  srRowMoved: "Row moved from position {from} to position {to}",

  // ─── Context Menu ───
  viewDetails: "View details",
  edit: "Edit",
  duplicate: "Duplicate",
  select: "Select",
  copyId: "Copy ID",
  delete: "Delete",

  // ─── Errors ───
  errorTitle: "Something went wrong",
  errorMessage: "An unexpected error occurred while loading the table.",
  errorDetails: "Error details",
  retry: "Try again",

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
