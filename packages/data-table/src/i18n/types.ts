// ─── I18N TYPE DEFINITIONS ──────────────────────────────────────────────────
// Types for the internationalization system

/**
 * All translatable strings in the DataTable
 */
export interface DataTableStrings {
  // ─── Empty States ───
  /** Shown when no results match search/filter */
  noResults: string;
  /** Help text shown below "no results" message */
  noResultsHint: string;
  /** Loading indicator text */
  loading: string;

  // ─── Empty Value Indicators ───
  /** Displayed for null/undefined values */
  empty: string;
  /** Displayed for invalid dates */
  invalidDate: string;
  /** Displayed for NaN numbers */
  invalidNumber: string;

  // ─── Boolean Values ───
  /** Boolean true display */
  booleanTrue: string;
  /** Boolean false display */
  booleanFalse: string;

  // ─── Pagination ───
  /** Page N of M format. Placeholders: {page}, {totalPages} */
  pageOfTotal: string;
  /** Range display format. Placeholders: {start}, {end}, {total} */
  rangeOfTotal: string;
  /** Per page suffix. Placeholder: {count} */
  perPage: string;
  /** Empty pagination state */
  noItems: string;
  /** Item count display. Placeholder: {count} */
  itemCount: string;
  /** All items label (when no pagination) */
  allItems: string;
  /** Cursor pagination format. Placeholders: {count}, {page} */
  cursorPagination: string;
  /** Previous page button */
  previous: string;
  /** Next page button */
  next: string;

  // ─── Selection ───
  /** Selected count. Placeholder: {count} */
  selectedCount: string;
  /** Select all checkbox label */
  selectAll: string;
  /** Deselect all label */
  deselectAll: string;

  // ─── Column Menu ───
  /** Pin column to left */
  pinLeft: string;
  /** Unpin column from left */
  unpinLeft: string;
  /** Pin column to right */
  pinRight: string;
  /** Unpin column from right */
  unpinRight: string;
  /** Hide column action */
  hideColumn: string;
  /** Filter by column. Placeholder: {column} */
  filterBy: string;
  /** Active filter indicator */
  filterActive: string;
  /** Clear filter action */
  clearFilter: string;
  /** Search column placeholder. Placeholder: {column} */
  searchColumn: string;
  /** Apply filter button */
  apply: string;
  /** Clear button */
  clear: string;
  /** Clear all action */
  clearAll: string;
  /** Filters label */
  filtersLabel: string;
  /** Search label for filter chips */
  searchLabel: string;

  // ─── Grouping ───
  /** Group by column action */
  groupByColumn: string;
  /** Remove grouping action */
  removeGrouping: string;
  /** Add to grouping. Placeholder: {level} */
  addToGrouping: string;
  /** Empty group indicator */
  groupEmpty: string;
  /** Group item count singular */
  groupItemSingular: string;
  /** Group item count plural. Placeholder: {count} */
  groupItemPlural: string;
  /** Expand group tooltip */
  expandGroup: string;
  /** Collapse group tooltip */
  collapseGroup: string;
  /** Grouped by label in toolbar */
  groupedByLabel: string;
  /** None (no grouping) */
  none: string;
  /** Select all rows in group. Placeholders: {count}, {label} */
  selectGroupRows: string;
  /** Remove grouping pill aria-label. Placeholder: {label} */
  removeGroupingLabel: string;

  // ─── Summary Row ───
  /** Summary row label */
  summary: string;
  /** Total calculation label */
  summaryTotal: string;
  /** Average calculation label */
  summaryAverage: string;
  /** Count calculation label */
  summaryCount: string;
  /** Minimum calculation label */
  summaryMin: string;
  /** Maximum calculation label */
  summaryMax: string;

  // ─── Export ───
  /** Export button label */
  export: string;
  /** CSV format label */
  exportCsv: string;
  /** CSV format description */
  exportCsvDesc: string;
  /** Excel format label */
  exportExcel: string;
  /** Excel format description */
  exportExcelDesc: string;
  /** PDF format label */
  exportPdf: string;
  /** PDF format description */
  exportPdfDesc: string;
  /** JSON format label */
  exportJson: string;
  /** JSON format description */
  exportJsonDesc: string;

  // ─── Search ───
  /** Search input placeholder */
  searchPlaceholder: string;
  /** Open search button label */
  openSearch: string;
  /** Clear search button label */
  clearSearch: string;

  // ─── Row Actions ───
  /** Expand row label */
  expandRow: string;
  /** Collapse row label */
  collapseRow: string;
  /** Select row aria-label. Placeholder: {id} */
  selectRowLabel: string;

  // ─── Toolbar ───
  /** Columns visibility dropdown label */
  columns: string;
  /** Density dropdown label */
  density: string;
  /** Compact density option */
  densityCompact: string;
  /** Dense density option */
  densityDense: string;
  /** Standard density option */
  densityStandard: string;
  /** Comfortable density option */
  densityComfortable: string;
  /** More actions dropdown label */
  moreActions: string;
  /** Filter button label */
  filter: string;
  /** Download button label */
  download: string;
  /** Print button label */
  print: string;
  /** Refresh button label */
  refresh: string;
  /** Expand all groups button label */
  expandAllGroups: string;
  /** Collapse all groups button label */
  collapseAllGroups: string;

  // ─── Frozen Columns ───
  /** Frozen left indicator. Placeholder: {count} */
  frozenLeft: string;
  /** Frozen right indicator. Placeholder: {count} */
  frozenRight: string;
  /** Unfreeze all columns button label */
  unfreezeAll: string;

  // ─── Column Resize ───
  /** Resize column tooltip */
  resizeColumn: string;

  // ─── Row Reorder ───
  /** Drag handle aria-label */
  dragRowHandle: string;
  /** Row moved announcement. Placeholders: {from}, {to} */
  srRowMoved: string;

  // ─── Context Menu ───
  /** View details menu item */
  viewDetails: string;
  /** Edit menu item */
  edit: string;
  /** Duplicate menu item */
  duplicate: string;
  /** Select menu item */
  select: string;
  /** Copy ID menu item */
  copyId: string;
  /** Delete menu item */
  delete: string;

  // ─── Errors ───
  /** Error boundary title */
  errorTitle: string;
  /** Error boundary message */
  errorMessage: string;
  /** Error details label */
  errorDetails: string;
  /** Retry button label */
  retry: string;

  // ─── Screen Reader Announcements ───
  /** Status update for screen readers. Placeholders: {selectedCount}, {totalCount}, {sortInfo} */
  srStatusUpdate: string;
  /** Sort ascending announcement. Placeholder: {column} */
  srSortedAsc: string;
  /** Sort descending announcement. Placeholder: {column} */
  srSortedDesc: string;
  /** Not sorted announcement */
  srNotSorted: string;
  /** Filter applied announcement. Placeholder: {count} */
  srFilterApplied: string;
  /** Filter cleared announcement */
  srFilterCleared: string;
  /** Row selected announcement. Placeholder: {id} */
  srRowSelected: string;
  /** Row deselected announcement. Placeholder: {id} */
  srRowDeselected: string;
  /** All rows selected announcement. Placeholder: {count} */
  srAllSelected: string;
  /** All rows deselected announcement */
  srAllDeselected: string;
  /** Group expanded announcement. Placeholder: {label} */
  srGroupExpanded: string;
  /** Group collapsed announcement. Placeholder: {label} */
  srGroupCollapsed: string;
  /** Table description for screen readers. Placeholders: {rowCount}, {columnCount} */
  srTableDescription: string;
}

/**
 * Locale configuration for DataTable
 */
export interface DataTableLocale {
  /** Locale identifier (e.g., "en-US", "fr-FR") */
  locale: string;
  /** Translation strings */
  strings: DataTableStrings;
  /** Number formatting options */
  numberFormat?: Intl.NumberFormatOptions;
  /** Date formatting options */
  dateFormat?: Intl.DateTimeFormatOptions;
}

/**
 * Partial locale for overriding specific strings
 */
export type PartialDataTableLocale = {
  locale?: string;
  strings?: Partial<DataTableStrings>;
  numberFormat?: Intl.NumberFormatOptions;
  dateFormat?: Intl.DateTimeFormatOptions;
};
