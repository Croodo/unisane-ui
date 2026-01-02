export type {
  DataTableState,
  DataTableAction,
  DataTableContextValue,
  DataTableProviderProps,
  DataTableConfig,
  // State slices for optimized re-renders
  SelectionSlice,
  SortSlice,
  FilterSlice,
  PaginationSlice,
  ColumnSlice,
  GroupingSlice,
  StateSlices,
  DataTableCallbacks,
  // Callback event types
  ScrollEventInfo,
  DataTableError,
} from "./types";

export { dataTableReducer, createInitialState } from "./reducer";

export {
  DataTableProvider,
  useDataTableContext,
  useSelection,
  useSorting,
  useFiltering,
  usePagination,
  useColumns,
  useGrouping,
  useTableUI,
} from "./provider";
