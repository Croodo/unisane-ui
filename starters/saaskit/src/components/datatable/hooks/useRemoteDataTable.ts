"use client";

import { useMemo, useState, useCallback } from "react";
import type { FilterState, SortDirection } from "../types";

/**
 * Interface for list params hooks (from SDK)
 * This matches the return type of useAdminUsersListParams, useAdminTenantsListParams, etc.
 */
export interface ListParamsLike {
  searchValue: string;
  onSearchChange: (val: string) => void;
  filters: Record<string, unknown>;
  onFiltersChange: (next: Record<string, unknown>) => void;
  sortDescriptor: { key: string; direction: "asc" | "desc" };
  onSortChange: (key: string | null, dir: SortDirection) => void;
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
 * Interface for query results (from React Query)
 */
export interface QueryLike<T> {
  data?:
    | { items?: T[]; nextCursor?: string; prevCursor?: string }
    | T[]
    | null
    | undefined;
  isLoading: boolean;
  isFetching: boolean;
  refetch?: (() => Promise<unknown>) | undefined;
}

/**
 * Interface for stats query results
 */
export interface StatsQueryLike {
  data?: { total?: number } | undefined;
  isLoading: boolean;
}

/**
 * Options for useRemoteDataTable hook
 */
export interface UseRemoteDataTableOptions<T> {
  /** List params from SDK hook (e.g., hooks.users.admin.useListParams()) */
  params: ListParamsLike;
  /** Query result from SDK hook (e.g., hooks.users.admin.list()) */
  query: QueryLike<T>;
  /** Optional stats query for total count */
  statsQuery?: StatsQueryLike | undefined;
  /** Initial/fallback data */
  initialData?:
    | {
        items?: T[];
        nextCursor?: string | undefined;
        prevCursor?: string | undefined;
      }
    | T[]
    | undefined;
}

/**
 * Return type for useRemoteDataTable hook
 * These props can be spread directly onto DataTable
 */
export interface RemoteDataTableProps<T> {
  // Data
  data: T[];
  isLoading: boolean;
  refreshing: boolean;
  onRefresh: () => Promise<void>;

  // Mode
  mode: "remote";
  paginationMode: "cursor";

  // Search
  searchValue: string;
  onSearchChange: (val: string) => void;

  // Filters
  controlledFilters: FilterState;
  onFiltersChange: (filters: FilterState) => void;

  // Sort
  controlledSort: { key: string | null; direction: SortDirection };
  onSortChange: (key: string | number | symbol | null, direction: SortDirection) => void;

  // Pagination
  cursorPagination: {
    nextCursor?: string | undefined;
    prevCursor?: string | undefined;
    limit: number;
    pageIndex: number;
    onLimitChange: (n: number) => void;
    onNext: () => void;
    onPrev: () => void;
  };
  totalItems?: number | undefined;
}

/**
 * Hook to simplify remote DataTable setup
 *
 * @example
 * ```tsx
 * const params = hooks.users.admin.useListParams({ defaults: { limit: 25 } });
 * const query = hooks.users.admin.list(params.queryArgs);
 * const statsQuery = hooks.users.admin.stats({ filters: params.queryArgs.filters });
 *
 * const remoteProps = useRemoteDataTable({
 *   params,
 *   query,
 *   statsQuery,
 *   initialData: initial,
 * });
 *
 * // Before: 23 props
 * // After: spread + 3 required props
 * <DataTable
 *   {...remoteProps}
 *   columns={columns}
 *   title="Users"
 *   tableId="admin-users"
 * />
 * ```
 */
export function useRemoteDataTable<T extends { id: string }>({
  params,
  query,
  statsQuery,
  initialData,
}: UseRemoteDataTableOptions<T>): RemoteDataTableProps<T> {
  const [refreshing, setRefreshing] = useState(false);

  // Extract data from query result
  const data = useMemo<T[]>(() => {
    const queryData = query.data;
    const fallbackData = initialData;

    // Handle array response
    if (Array.isArray(queryData)) return queryData;
    if (Array.isArray(fallbackData)) return fallbackData;

    // Handle { items, nextCursor, prevCursor } response
    return (queryData?.items ?? fallbackData?.items ?? []) as T[];
  }, [query.data, initialData]);

  // Extract cursors from query result
  const cursors = useMemo<{ next?: string; prev?: string }>(() => {
    const queryData = query.data;
    const fallbackData = initialData;

    if (Array.isArray(queryData) || Array.isArray(fallbackData)) {
      return {};
    }

    const result: { next?: string; prev?: string } = {};
    const nextCursor = queryData?.nextCursor ?? fallbackData?.nextCursor;
    const prevCursor = queryData?.prevCursor ?? fallbackData?.prevCursor;

    if (nextCursor) result.next = nextCursor;
    if (prevCursor) result.prev = prevCursor;

    return result;
  }, [query.data, initialData]);

  // Loading states
  const isLoading = query.isLoading && !query.data;
  const isRefreshing = refreshing || query.isFetching;

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    if (refreshing || !query.refetch) return;
    setRefreshing(true);
    try {
      await query.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, query]);

  // Build cursor pagination
  const cursorPagination = useMemo(
    () => params.buildCursorPagination(cursors),
    [params, cursors]
  );

  // Normalize sort descriptor
  const controlledSort = useMemo(
    () => ({
      key: params.sortDescriptor.key ?? null,
      direction: params.sortDescriptor.direction as SortDirection,
    }),
    [params.sortDescriptor]
  );

  return {
    // Data
    data,
    isLoading,
    refreshing: isRefreshing,
    onRefresh: handleRefresh,

    // Mode
    mode: "remote",
    paginationMode: "cursor",

    // Search
    searchValue: params.searchValue,
    onSearchChange: params.onSearchChange,

    // Filters
    controlledFilters: params.filters as FilterState,
    onFiltersChange: params.onFiltersChange as (filters: FilterState) => void,

    // Sort
    controlledSort,
    onSortChange: (key: string | number | symbol | null, dir: SortDirection) => params.onSortChange(key as string | null, dir),

    // Pagination
    cursorPagination,
    ...(statsQuery?.data?.total !== undefined
      ? { totalItems: statsQuery.data.total }
      : {}),
  };
}

export default useRemoteDataTable;
