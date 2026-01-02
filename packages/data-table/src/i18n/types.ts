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

  // ─── Column Sorting ───
  /** Sort column aria-label (when not sorted) */
  sortColumn: string;
  /** Sort descending aria-label (when sorted ascending) */
  sortDescending: string;
  /** Clear sort aria-label (when sorted descending) */
  clearSort: string;

  // ─── Column Resize ───
  /** Resize column tooltip */
  resizeColumn: string;

  // ─── Row Reorder ───
  /** Drag handle aria-label */
  dragRowHandle: string;
  /** Drag handle aria-label with row index. Placeholder: {index} */
  dragRowHandleLabel: string;
  /** Row moved announcement. Placeholders: {from}, {to} */
  srRowMoved: string;

  // ─── Tree Data ───
  /** Expand all tree nodes */
  expandAllNodes: string;
  /** Collapse all tree nodes */
  collapseAllNodes: string;
  /** Loading children indicator */
  loadingChildren: string;
  /** No children found message */
  noChildren: string;
  /** Tree node expanded announcement. Placeholder: {label} */
  srNodeExpanded: string;
  /** Tree node collapsed announcement. Placeholder: {label} */
  srNodeCollapsed: string;

  // ─── Infinite Scroll ───
  /** Loading more items indicator */
  loadingMore: string;
  /** No more items to load */
  endOfList: string;
  /** Load more button label */
  loadMore: string;
  /** Screen reader announcement for loaded items. Placeholder: {count} */
  srItemsLoaded: string;

  // ─── Clipboard ───
  /** Copy action */
  copy: string;
  /** Paste action */
  paste: string;
  /** Cut action */
  cut: string;
  /** Paste success message. Placeholder: {count} */
  pasteSuccess: string;
  /** Paste failed message */
  pasteFailed: string;
  /** Paste validation error. Placeholder: {count} */
  pasteValidationError: string;
  /** No data to paste message */
  pasteNoData: string;
  /** Screen reader announcement for copied cells. Placeholder: {count} */
  srCellsCopied: string;
  /** Screen reader announcement for pasted cells. Placeholder: {count} */
  srCellsPasted: string;

  // ─── Undo/Redo ───
  /** Undo action */
  undo: string;
  /** Redo action */
  redo: string;
  /** Undo cell edit. Placeholder: {column} */
  undoCellEdit: string;
  /** Redo cell edit. Placeholder: {column} */
  redoCellEdit: string;
  /** Nothing to undo message */
  nothingToUndo: string;
  /** Nothing to redo message */
  nothingToRedo: string;
  /** Screen reader announcement for undo. Placeholder: {description} */
  srUndone: string;
  /** Screen reader announcement for redo. Placeholder: {description} */
  srRedone: string;

  // ─── Filter Presets ───
  /** Presets label */
  presets: string;
  /** Save preset action */
  savePreset: string;
  /** Apply preset action */
  applyPreset: string;
  /** Delete preset action */
  deletePreset: string;
  /** Edit preset action */
  editPreset: string;
  /** Duplicate preset action */
  duplicatePreset: string;
  /** Preset name label */
  presetName: string;
  /** Preset name placeholder */
  presetNamePlaceholder: string;
  /** Quick filter label */
  quickFilter: string;
  /** Add to quick filters */
  addQuickFilter: string;
  /** Remove from quick filters */
  removeQuickFilter: string;
  /** Default preset indicator */
  defaultPreset: string;
  /** Custom preset indicator */
  customPreset: string;
  /** Import presets action */
  importPresets: string;
  /** Export presets action */
  exportPresets: string;
  /** Preset saved message. Placeholder: {name} */
  presetSaved: string;
  /** Preset deleted message. Placeholder: {name} */
  presetDeleted: string;
  /** Preset applied message. Placeholder: {name} */
  presetApplied: string;
  /** Max presets reached message. Placeholder: {max} */
  maxPresetsReached: string;
  /** Screen reader: preset applied. Placeholder: {name} */
  srPresetApplied: string;
  /** Screen reader: preset saved. Placeholder: {name} */
  srPresetSaved: string;

  // ─── Compound Filters ───
  /** Filter builder title */
  filterBuilder: string;
  /** Add condition button */
  addCondition: string;
  /** Add group button */
  addFilterGroup: string;
  /** Remove condition button */
  removeCondition: string;
  /** Remove group button */
  removeFilterGroup: string;
  /** AND operator label */
  operatorAnd: string;
  /** OR operator label */
  operatorOr: string;
  /** Equals operator */
  opEquals: string;
  /** Not equals operator */
  opNotEquals: string;
  /** Contains operator */
  opContains: string;
  /** Not contains operator */
  opNotContains: string;
  /** Starts with operator */
  opStartsWith: string;
  /** Ends with operator */
  opEndsWith: string;
  /** Greater than operator */
  opGreaterThan: string;
  /** Less than operator */
  opLessThan: string;
  /** Between operator */
  opBetween: string;
  /** Is empty operator */
  opIsEmpty: string;
  /** Is not empty operator */
  opIsNotEmpty: string;
  /** In list operator */
  opIn: string;
  /** Not in list operator */
  opNotIn: string;
  /** Filter group label. Placeholder: {operator} */
  filterGroupLabel: string;
  /** Select column placeholder */
  selectColumn: string;
  /** Select operator placeholder */
  selectOperator: string;
  /** Enter value placeholder */
  enterValue: string;

  // ─── Column Spanning ───
  /** Merge cells action */
  mergeCells: string;
  /** Unmerge cells action */
  unmergeCells: string;
  /** Span columns. Placeholder: {count} */
  spanColumns: string;
  /** Cell is merged/hidden */
  cellMerged: string;
  /** Screen reader: cell spans columns. Placeholder: {count} */
  srCellSpansColumns: string;

  // ─── Sticky Group Headers ───
  /** Sticky header indicator */
  stickyHeader: string;
  /** Pinned group header. Placeholder: {label} */
  pinnedGroupHeader: string;
  /** Screen reader: group header is sticky. Placeholder: {label} */
  srGroupHeaderSticky: string;
  /** Screen reader: showing items in group. Placeholder: {label}, {count} */
  srShowingGroupItems: string;

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

  // ─── Actions Cell ───
  /** Actions button aria-label */
  actions: string;

  // ─── Row Numbers ───
  /** Row number column header */
  rowNumberHeader: string;
  /** Screen reader: row number. Placeholder: {number} */
  srRowNumber: string;

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
