"use client";

import {
  useMemo,
  useCallback,
  useTransition,
  useState,
  useEffect,
  useRef,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CursorPagination } from "@unisane/data-table";

/** Sort direction type for DataTable */
type SortDirection = "asc" | "desc";

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

const DEFAULT_SEARCH_DEBOUNCE_MS = 300;

// ─── TYPES ──────────────────────────────────────────────────────────────────

/**
 * Options passed from server component to useServerTable hook
 */
export interface UseServerTableOptions {
  /** Current sort value from URL (e.g., "-createdAt" or "email") */
  currentSort: string;
  /** Current search query from URL */
  currentSearch: string;
  /** Current items per page from URL */
  currentLimit: number;
  /** Current page number from URL (1-indexed) */
  currentPage: number;
  /** Next cursor from API response (if more pages exist) */
  nextCursor?: string | undefined;
  /** Previous cursor from API response (if previous pages exist) */
  prevCursor?: string | undefined;
  /** Debounce delay for search input (default: 300ms) */
  searchDebounceMs?: number | undefined;
}

/**
 * Props that can be spread directly onto DataTable component
 */
export interface DataTableCompatProps {
  /** Remote mode - disables local data processing */
  mode: "remote";
  /** Cursor-based pagination mode */
  paginationMode: "cursor";
  /** Disable local filtering/sorting/pagination */
  disableLocalProcessing: true;
  /** Current search value for the search input */
  searchValue: string;
  /** Handler for search input changes */
  onSearchChange: (value: string) => void;
  /** Current sort column key */
  sortKey: string;
  /** Current sort direction */
  sortDirection: SortDirection;
  /** Handler for sort changes */
  onSortChange: (key: string | null, direction: SortDirection) => void;
  /** Cursor pagination configuration */
  cursorPagination: CursorPagination;
  /** Whether a navigation is pending */
  refreshing: boolean;
}

/**
 * Return type for useServerTable hook
 */
export interface UseServerTableReturn {
  /** Parsed sort key (without direction prefix) */
  sortKey: string;
  /** Parsed sort direction */
  sortDirection: SortDirection;
  /** Current search value (local state for immediate UI feedback) */
  searchValue: string;
  /** Current page limit */
  limit: number;
  /** Current page number */
  page: number;
  /** Whether there's a next page */
  hasNextPage: boolean;
  /** Whether there's a previous page */
  hasPrevPage: boolean;
  /** Handler for sort changes */
  onSortChange: (key: string | null, direction: SortDirection) => void;
  /** Handler for search input changes */
  onSearchChange: (value: string) => void;
  /** Handler for limit changes */
  onLimitChange: (limit: number) => void;
  /** Handler for navigating to next page */
  onNextPage: () => void;
  /** Handler for navigating to previous page */
  onPrevPage: () => void;
  /** Whether a navigation is pending */
  isPending: boolean;
  /** Cursor pagination object for DataTable */
  cursorPagination: CursorPagination;
  /** Props ready to spread on DataTable */
  dataTableProps: DataTableCompatProps;
}

// ─── HOOK ───────────────────────────────────────────────────────────────────

/**
 * Hook for managing table state in server-first pattern.
 *
 * This hook handles URL state management for tables where:
 * - Data is fetched server-side (in a Server Component)
 * - Client component only manages UI interactions
 * - URL is the single source of truth for table state
 *
 * @example
 * ```tsx
 * // In page.tsx (Server Component)
 * export default async function UsersPage({ searchParams }) {
 *   const params = await searchParams;
 *   const data = await api.users.list({ query: { sort: params.sort, ... } });
 *   return (
 *     <UsersClient
 *       data={data.items}
 *       nextCursor={data.nextCursor}
 *       prevCursor={data.prevCursor}
 *       currentSort={params.sort || "-createdAt"}
 *       currentSearch={params.q || ""}
 *       currentLimit={Number(params.limit) || 25}
 *       currentPage={Number(params.page) || 1}
 *     />
 *   );
 * }
 *
 * // In UsersClient.tsx (Client Component)
 * export function UsersClient(props) {
 *   const { dataTableProps } = useServerTable({
 *     currentSort: props.currentSort,
 *     currentSearch: props.currentSearch,
 *     currentLimit: props.currentLimit,
 *     currentPage: props.currentPage,
 *     nextCursor: props.nextCursor,
 *     prevCursor: props.prevCursor,
 *   });
 *
 *   return (
 *     <DataTable
 *       data={props.data}
 *       columns={columns}
 *       {...dataTableProps}
 *     />
 *   );
 * }
 * ```
 */
export function useServerTable({
  currentSort,
  currentSearch,
  currentLimit,
  currentPage,
  nextCursor,
  prevCursor,
  searchDebounceMs = DEFAULT_SEARCH_DEBOUNCE_MS,
}: UseServerTableOptions): UseServerTableReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // ─── DEBOUNCED SEARCH ──────────────────────────────────────────────────────
  // Local state for immediate UI feedback, debounced for server requests
  const [localSearch, setLocalSearch] = useState(currentSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track the pending search value to detect our own updates vs external ones
  const pendingSearchRef = useRef<string | null>(null);

  // Sync local search with URL when it changes externally (e.g., browser back)
  // Skip sync if the incoming value matches what we sent to the server
  useEffect(() => {
    // If we have a pending search and server responded with matching value, clear it
    if (
      pendingSearchRef.current !== null &&
      pendingSearchRef.current === currentSearch
    ) {
      pendingSearchRef.current = null;
      return;
    }
    // If we have a pending search but server returned different value, it's stale - ignore
    if (pendingSearchRef.current !== null) {
      return;
    }
    // External change (browser back/forward or initial load) - sync it
    setLocalSearch(currentSearch);
  }, [currentSearch]);

  // Clean URL when we're on page 1 but cursor/page is still in URL
  // This happens when navigating back to page 1 via prevCursor
  useEffect(() => {
    const hasCursorInUrl = searchParams.has("cursor");
    const hasPageInUrl = searchParams.has("page");
    const isOnPage1 = !prevCursor;

    if (isOnPage1 && (hasCursorInUrl || hasPageInUrl)) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("cursor");
      params.delete("page");
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [prevCursor, searchParams, router]);

  // ─── URL UPDATE HELPER ─────────────────────────────────────────────────────
  const updateUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      // Always reset cursor and page when changing search/sort/limit
      if ("q" in updates || "sort" in updates || "limit" in updates) {
        params.delete("cursor");
        params.delete("page");
      }

      startTransition(() => {
        router.push(`?${params.toString()}`, { scroll: false });
      });
    },
    [router, searchParams]
  );

  // ─── EVENT HANDLERS ────────────────────────────────────────────────────────
  const handleSearchChange = useCallback(
    (value: string) => {
      // Update local state immediately for responsive UI
      setLocalSearch(value);

      // Clear existing debounce timer
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Debounce the actual URL update (triggers server fetch)
      debounceRef.current = setTimeout(() => {
        // Track what we're sending so we can ignore stale responses
        pendingSearchRef.current = value;
        updateUrl({ q: value || null });
      }, searchDebounceMs);
    },
    [updateUrl, searchDebounceMs]
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleSortChange = useCallback(
    (key: string | null, direction: SortDirection) => {
      if (!key) {
        // Clear sort - remove from URL
        updateUrl({ sort: null });
        return;
      }
      const sortValue = direction === "desc" ? `-${key}` : key;
      updateUrl({ sort: sortValue });
    },
    [updateUrl]
  );

  const handleLimitChange = useCallback(
    (limit: number) => {
      updateUrl({ limit: String(limit) });
    },
    [updateUrl]
  );

  const handleNextPage = useCallback(() => {
    if (nextCursor) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("cursor", nextCursor);
      params.set("page", String(currentPage + 1));
      startTransition(() => {
        router.push(`?${params.toString()}`, { scroll: false });
      });
    }
  }, [nextCursor, router, searchParams, currentPage]);

  const handlePrevPage = useCallback(() => {
    if (prevCursor) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("cursor", prevCursor);
      const prevPage = currentPage - 1;
      if (prevPage <= 1) {
        params.delete("page");
      } else {
        params.set("page", String(prevPage));
      }
      startTransition(() => {
        router.push(`?${params.toString()}`, { scroll: false });
      });
    }
  }, [prevCursor, router, searchParams, currentPage]);

  // ─── DERIVED STATE ─────────────────────────────────────────────────────────
  const sortDescriptor = useMemo(() => {
    const isDesc = currentSort.startsWith("-");
    return {
      key: isDesc ? currentSort.slice(1) : currentSort,
      direction: (isDesc ? "desc" : "asc") as SortDirection,
    };
  }, [currentSort]);

  const cursorPagination: CursorPagination = useMemo(
    () => ({
      ...(nextCursor ? { nextCursor } : {}),
      ...(prevCursor ? { prevCursor } : {}),
      limit: currentLimit,
      pageIndex: currentPage,
      onLimitChange: handleLimitChange,
      onNext: handleNextPage,
      onPrev: handlePrevPage,
    }),
    [
      nextCursor,
      prevCursor,
      currentLimit,
      currentPage,
      handleLimitChange,
      handleNextPage,
      handlePrevPage,
    ]
  );

  const dataTableProps: DataTableCompatProps = useMemo(
    () => ({
      mode: "remote" as const,
      paginationMode: "cursor" as const,
      disableLocalProcessing: true as const,
      searchValue: localSearch,
      onSearchChange: handleSearchChange,
      sortKey: sortDescriptor.key,
      sortDirection: sortDescriptor.direction,
      onSortChange: handleSortChange,
      cursorPagination,
      refreshing: isPending,
    }),
    [
      localSearch,
      handleSearchChange,
      sortDescriptor.key,
      sortDescriptor.direction,
      handleSortChange,
      cursorPagination,
      isPending,
    ]
  );

  return {
    // Parsed state
    sortKey: sortDescriptor.key,
    sortDirection: sortDescriptor.direction,
    searchValue: localSearch,
    limit: currentLimit,
    page: currentPage,
    hasNextPage: !!nextCursor,
    hasPrevPage: !!prevCursor,

    // Handlers
    onSortChange: handleSortChange,
    onSearchChange: handleSearchChange,
    onLimitChange: handleLimitChange,
    onNextPage: handleNextPage,
    onPrevPage: handlePrevPage,

    // Loading state
    isPending,

    // Convenience objects
    cursorPagination,
    dataTableProps,
  };
}

export default useServerTable;
