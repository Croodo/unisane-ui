"use client";

import { useCallback, useRef } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { browserApi } from "@/src/sdk/clients/generated/browser";
import { keys } from "@/src/sdk/hooks/generated/keys";

/**
 * Prefetch configuration options
 */
interface PrefetchOptions {
  /** Delay before prefetching (ms) - helps avoid prefetching on quick hover-through */
  delay?: number;
  /** How long the data should be considered fresh (ms) */
  staleTime?: number;
}

const DEFAULT_OPTIONS: Required<PrefetchOptions> = {
  delay: 100,
  staleTime: 60_000, // 1 minute
};

/**
 * Extract entity ID from common URL patterns
 */
function extractIdFromPath(path: string, pattern: RegExp): string | null {
  const match = path.match(pattern);
  return match?.[1] ?? null;
}

/**
 * Prefetch user detail when navigating to user pages
 */
async function prefetchUserDetail(qc: QueryClient, id: string, staleTime: number) {
  const queryKey = keys.users.adminRead({ params: { id } });
  const api = await browserApi();
  await qc.prefetchQuery({
    queryKey,
    queryFn: () => api.admin.users.read(id),
    staleTime,
  });
}

/**
 * Prefetch tenant detail when navigating to tenant pages
 */
async function prefetchTenantDetail(qc: QueryClient, id: string, staleTime: number) {
  const queryKey = keys.tenants.adminRead({ params: { id } });
  const api = await browserApi();
  await qc.prefetchQuery({
    queryKey,
    queryFn: () => api.admin.tenants.read(id),
    staleTime,
  });
}

/**
 * Hook for prefetching data on navigation hover/focus
 *
 * Returns event handlers to attach to links/buttons that trigger prefetching
 * when the user hovers or focuses on them.
 *
 * @example
 * ```tsx
 * const { onHoverStart, onHoverEnd, onFocus } = usePrefetch();
 *
 * <Link
 *   href={`/admin/users/${userId}`}
 *   onMouseEnter={() => onHoverStart(`/admin/users/${userId}`)}
 *   onMouseLeave={onHoverEnd}
 *   onFocus={() => onFocus(`/admin/users/${userId}`)}
 * >
 *   View User
 * </Link>
 * ```
 */
export function usePrefetch(options: PrefetchOptions = {}) {
  const queryClient = useQueryClient();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { delay, staleTime } = { ...DEFAULT_OPTIONS, ...options };

  const prefetchForPath = useCallback(
    async (href: string) => {
      try {
        // Admin user detail: /admin/users/:id
        const userId = extractIdFromPath(href, /\/admin\/users\/([^/]+)$/);
        if (userId) {
          await prefetchUserDetail(queryClient, userId, staleTime);
          return;
        }

        // Admin tenant detail: /admin/tenants/:id
        const tenantId = extractIdFromPath(href, /\/admin\/tenants\/([^/]+)$/);
        if (tenantId) {
          await prefetchTenantDetail(queryClient, tenantId, staleTime);
          return;
        }
      } catch (error) {
        // Silently fail - prefetch is an optimization, not critical
        console.debug("[prefetch] Failed to prefetch:", href, error);
      }
    },
    [queryClient, staleTime]
  );

  const onHoverStart = useCallback(
    (href: string) => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Delay prefetch to avoid unnecessary fetches on quick hover-through
      timeoutRef.current = setTimeout(() => {
        void prefetchForPath(href);
      }, delay);
    },
    [prefetchForPath, delay]
  );

  const onHoverEnd = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const onFocus = useCallback(
    (href: string) => {
      // Immediate prefetch on focus (keyboard navigation)
      void prefetchForPath(href);
    },
    [prefetchForPath]
  );

  return {
    onHoverStart,
    onHoverEnd,
    onFocus,
    /** Manually trigger prefetch for a path */
    prefetch: prefetchForPath,
  };
}

/**
 * Hook to prefetch the next page of a paginated list
 *
 * @example
 * ```tsx
 * const { prefetchNextPage } = usePrefetchPagination();
 *
 * // When user hovers near pagination or scrolls near bottom
 * prefetchNextPage("users", "adminList", { query: { cursor: nextCursor, limit: 20 } });
 * ```
 */
export function usePrefetchPagination(options: PrefetchOptions = {}) {
  const queryClient = useQueryClient();
  const { staleTime } = { ...DEFAULT_OPTIONS, ...options };

  const prefetchNextPage = useCallback(
    async (
      domain: string,
      operation: string,
      args: { query?: { cursor?: string; limit?: number } }
    ) => {
      if (!args.query?.cursor) return;

      try {
        // Get the key function from the keys object
        const domainKeys = keys[domain as keyof typeof keys];
        if (!domainKeys) return;

        const keyFn = (domainKeys as Record<string, (a: unknown) => readonly unknown[]>)[operation];
        if (!keyFn) return;

        const queryKey = keyFn(args);
        const api = await browserApi();

        // Get the API function dynamically - handle both regular and admin APIs
        type ApiFn = (a: unknown) => Promise<unknown>;
        type ApiRecord = Record<string, Record<string, ApiFn>>;
        type AdminApiRecord = { admin?: ApiRecord };

        let apiFn: ApiFn | undefined;

        if (operation.startsWith("admin")) {
          const adminApi = (api as unknown as AdminApiRecord).admin;
          apiFn = adminApi?.[domain]?.[operation];
        } else {
          const regularApi = api as unknown as ApiRecord;
          apiFn = regularApi[domain]?.[operation];
        }

        if (!apiFn) return;

        await queryClient.prefetchQuery({
          queryKey,
          queryFn: () => apiFn!(args.query),
          staleTime,
        });
      } catch (error) {
        console.debug("[prefetch] Failed to prefetch next page:", error);
      }
    },
    [queryClient, staleTime]
  );

  return { prefetchNextPage };
}

/**
 * Create props to spread onto a link element for automatic prefetching
 *
 * @example
 * ```tsx
 * <Link {...createPrefetchLinkProps(prefetch, `/admin/users/${userId}`)}>
 *   View User
 * </Link>
 * ```
 */
export function createPrefetchLinkProps(
  prefetch: ReturnType<typeof usePrefetch>,
  href: string
) {
  return {
    onMouseEnter: () => prefetch.onHoverStart(href),
    onMouseLeave: prefetch.onHoverEnd,
    onFocus: () => prefetch.onFocus(href),
  };
}
