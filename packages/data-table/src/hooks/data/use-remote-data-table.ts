"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import type { FilterState, SortDirection, CursorPagination } from "../../types";

// ─── TYPES ─────────────────────────────────────────────────────────────────

/**
 * Interface for list params hooks (compatible with various SDK patterns)
 * This matches return types from hooks like useListParams, useAdminUsersListParams, etc.
 */
export interface ListParamsLike {
  /** Current search value */
  searchValue: string;
  /** Handler for search changes */
  onSearchChange: (val: string) => void;
  /** Current filter state */
  filters: Record<string, unknown>;
  /** Handler for filter changes */
  onFiltersChange: (next: Record<string, unknown>) => void;
  /** Current sort state */
  sortDescriptor: { key: string; direction: "asc" | "desc" };
  /** Handler for sort changes */
  onSortChange: (key: string | null, dir: SortDirection) => void;
  /** Build cursor pagination from cursors */
  buildCursorPagination: (cursors: { next?: string; prev?: string }) => {
    nextCursor?: string;
    prevCursor?: string;
    limit: number;
    pageIndex: number;
    onLimitChange: (n: number) => void;
    onNext: () => void;
    onPrev: () => void;
  };
}

/**
 * Interface for query results (compatible with React Query, SWR, etc.)
 */
export interface QueryLike<T> {
  /** Query data - can be array or paginated response */
  data?:
    | { items?: T[]; nextCursor?: string; prevCursor?: string }
    | T[]
    | null
    | undefined;
  /** Whether initial load is in progress */
  isLoading: boolean;
  /** Whether any fetch is in progress (including refetch) */
  isFetching: boolean;
  /** Function to refetch data */
  refetch?: (() => Promise<unknown>) | undefined;
}

/**
 * Interface for stats/count query results
 */
export interface StatsQueryLike {
  /** Stats data with total count */
  data?: { total?: number } | undefined;
  /** Whether stats query is loading */
  isLoading: boolean;
}

/**
 * Options for useRemoteDataTable hook
 */
export interface UseRemoteDataTableOptions<T> {
  /** List params from SDK hook */
  params: ListParamsLike;
  /** Query result from data fetching hook */
  query: QueryLike<T>;
  /** Optional stats query for total count */
  statsQuery?: StatsQueryLike | undefined;
  /** Initial/fallback data */
  initialData?:
    | { items?: T[]; nextCursor?: string; prevCursor?: string }
    | T[]
    | undefined;
}

/**
 * Return type for useRemoteDataTable hook
 * These props can be spread directly onto DataTable
 */
export interface UseRemoteDataTableReturn<T> {
  // Data
  data: T[];
  isLoading: boolean;
  refreshing: boolean;
  onRefresh: () => Promise<void>;

  // Mode
  mode: "remote";
  paginationMode: "cursor";
  disableLocalProcessing: true;

  // Search
  searchValue: string;
  onSearchChange: (val: string) => void;

  // Filters
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;

  // Sort
  sortKey: string | null;
  sortDirection: SortDirection;
  onSortChange: (key: string | null, direction: SortDirection) => void;

  // Pagination
  cursorPagination: CursorPagination;
  totalCount?: number;
}

// ─── HOOK ───────────────────────────────────────────────────────────────────

/**
 * Hook to simplify remote DataTable setup with React Query, SWR, or similar
 *
 * This hook bridges your data fetching layer with DataTable, handling:
 * - Data extraction from query responses
 * - Cursor-based pagination
 * - Search, filter, and sort state management
 * - Loading and refresh states
 *
 * @example
 * ```tsx
 * // With React Query / TanStack Query
 * const params = useListParams({ defaults: { limit: 25 } });
 * const query = useQuery({
 *   queryKey: ['users', params.queryArgs],
 *   queryFn: () => fetchUsers(params.queryArgs),
 * });
 * const statsQuery = useQuery({
 *   queryKey: ['users', 'stats'],
 *   queryFn: () => fetchUserStats(),
 * });
 *
 * const remoteProps = useRemoteDataTable({
 *   params,
 *   query,
 *   statsQuery,
 * });
 *
 * // Spread all remote props onto DataTable
 * <DataTable
 *   {...remoteProps}
 *   columns={columns}
 *   tableId="users-table"
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With SDK hooks
 * const params = hooks.users.useListParams();
 * const query = hooks.users.list(params.queryArgs);
 * const statsQuery = hooks.users.stats();
 *
 * const remoteProps = useRemoteDataTable({
 *   params,
 *   query,
 *   statsQuery,
 *   initialData: serverData, // From SSR
 * });
 *
 * <DataTable {...remoteProps} columns={columns} tableId="users" />
 * ```
 */
export function useRemoteDataTable<T extends { id: string }>({
  params,
  query,
  statsQuery,
  initialData,
}: UseRemoteDataTableOptions<T>): UseRemoteDataTableReturn<T> {
  const [refreshing, setRefreshing] = useState(false);

  // ─── TRACK LAST VALID DATA ────────────────────────────────────────────────
  // Store the last valid data to prevent falling back to initialData during loading.
  // This ensures that when query key changes (e.g., search), we don't show stale SSR data.
  const lastValidDataRef = useRef<T[] | null>(null);
  const lastValidCursorsRef = useRef<{ next?: string; prev?: string } | null>(null);

  // ─── EXTRACT DATA ──────────────────────────────────────────────────────────
  // Priority order:
  // 1. Current query.data (if available)
  // 2. Last valid data from previous queries (if we've loaded data before)
  // 3. initialData (only for first SSR render before any query completes)

  const data = useMemo<T[]>(() => {
    const queryData = query.data;

    // If query has data, use it and store as last valid
    if (queryData !== undefined && queryData !== null) {
      const extracted = Array.isArray(queryData)
        ? queryData
        : (queryData.items ?? []) as T[];
      // Store for future reference (outside useMemo to avoid stale closure)
      lastValidDataRef.current = extracted;
      return extracted;
    }

    // If we have previously loaded data, use it (prevents fallback to SSR data during loading)
    if (lastValidDataRef.current !== null) {
      return lastValidDataRef.current;
    }

    // First render only: use initialData for SSR hydration
    if (initialData !== undefined) {
      const extracted = Array.isArray(initialData)
        ? initialData
        : (initialData.items ?? []) as T[];
      return extracted;
    }

    return [];
  }, [query.data, initialData]);

  // ─── EXTRACT CURSORS ───────────────────────────────────────────────────────

  const cursors = useMemo<{ next?: string; prev?: string }>(() => {
    const queryData = query.data;

    // If query has data, use its cursors
    if (queryData !== undefined && queryData !== null && !Array.isArray(queryData)) {
      const extracted = {
        ...(queryData.nextCursor ? { next: queryData.nextCursor } : {}),
        ...(queryData.prevCursor ? { prev: queryData.prevCursor } : {}),
      };
      lastValidCursorsRef.current = extracted;
      return extracted;
    }

    // If we have previously loaded cursors, use them
    if (lastValidCursorsRef.current !== null) {
      return lastValidCursorsRef.current;
    }

    // Fallback to initialData cursors for SSR
    if (initialData !== undefined && !Array.isArray(initialData)) {
      return {
        ...(initialData.nextCursor ? { next: initialData.nextCursor } : {}),
        ...(initialData.prevCursor ? { prev: initialData.prevCursor } : {}),
      };
    }

    return {};
  }, [query.data, initialData]);

  // ─── LOADING STATES ────────────────────────────────────────────────────────

  const isLoading = query.isLoading && !query.data;
  const isRefreshing = refreshing || query.isFetching;

  // ─── REFRESH HANDLER ───────────────────────────────────────────────────────

  const handleRefresh = useCallback(async () => {
    if (refreshing || !query.refetch) return;
    setRefreshing(true);
    try {
      await query.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, query]);

  // ─── BUILD PAGINATION ──────────────────────────────────────────────────────

  const cursorPagination = useMemo<CursorPagination>(
    () => params.buildCursorPagination(cursors),
    [params, cursors]
  );

  // ─── RETURN PROPS ──────────────────────────────────────────────────────────

  return {
    // Data
    data,
    isLoading,
    refreshing: isRefreshing,
    onRefresh: handleRefresh,

    // Mode
    mode: "remote",
    paginationMode: "cursor",
    disableLocalProcessing: true,

    // Search
    searchValue: params.searchValue,
    onSearchChange: params.onSearchChange,

    // Filters
    filters: params.filters as FilterState,
    onFilterChange: params.onFiltersChange as (filters: FilterState) => void,

    // Sort
    sortKey: params.sortDescriptor.key ?? null,
    sortDirection: params.sortDescriptor.direction as SortDirection,
    onSortChange: params.onSortChange,

    // Pagination
    cursorPagination,
    ...(statsQuery?.data?.total !== undefined
      ? { totalCount: statsQuery.data.total }
      : {}),
  };
}

export default useRemoteDataTable;
