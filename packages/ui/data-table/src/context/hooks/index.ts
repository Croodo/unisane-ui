// ─── SPECIALIZED HOOKS ──────────────────────────────────────────────────────
// These hooks provide focused APIs for specific DataTable functionality.
// They all depend on useDataTableContext from the provider.

export { useSelection } from "./use-selection";
export { useSorting } from "./use-sorting";
export { useFiltering } from "./use-filtering";
export { usePagination } from "./use-pagination";
export { useColumns } from "./use-columns";
export { useGrouping } from "./use-grouping";
export { useTableUI } from "./use-table-ui";

// ─── UTILITY HOOKS ──────────────────────────────────────────────────────────
// These hooks provide reusable patterns for state management.

export {
  useControlledState,
  useControlledSet,
  type UseControlledStateOptions,
  type UseControlledStateReturn,
  type UseControlledSetOptions,
  type UseControlledSetReturn,
} from "./use-controlled-state";
