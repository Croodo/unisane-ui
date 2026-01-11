"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { usePageLayout } from "./usePageLayout";

// ============================================================================
// Types
// ============================================================================

export type UseTabNavigationOptions = {
  /**
   * The default tab ID when no tab is specified in URL
   * @default "overview"
   */
  defaultTab?: string;

  /**
   * The URL search parameter name for the tab
   * @default "tab"
   */
  paramName?: string;

  /**
   * Whether to sync the active tab with usePageLayout store
   * @default true
   */
  syncWithStore?: boolean;

  /**
   * Whether to remove the param from URL when on default tab
   * This keeps URLs clean (e.g., /billing instead of /billing?tab=overview)
   * @default true
   */
  cleanDefaultUrl?: boolean;
};

export type UseTabNavigationReturn = {
  /** Current active tab ID */
  currentTab: string;

  /**
   * Navigate to a specific tab
   * Updates URL and optionally syncs with store
   */
  navigate: (tabId: string) => void;

  /**
   * Check if a specific tab is active
   */
  isActive: (tabId: string) => boolean;

  /**
   * Get the URL for a specific tab (useful for Link components)
   */
  getTabUrl: (tabId: string) => string;
};

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for URL-synchronized tab navigation.
 *
 * This hook manages tab state via URL search parameters, ensuring:
 * - Tabs are bookmarkable and shareable
 * - Browser back/forward navigation works
 * - Tab state persists on page refresh
 * - Clean URLs when on default tab
 *
 * @example
 * ```tsx
 * function BillingPage() {
 *   const { currentTab, navigate } = useTabNavigation({ defaultTab: 'overview' });
 *
 *   return (
 *     <Tabs value={currentTab} onValueChange={navigate}>
 *       <TabsContent value="overview">...</TabsContent>
 *       <TabsContent value="invoices">...</TabsContent>
 *     </Tabs>
 *   );
 * }
 * ```
 */
export function useTabNavigation(
  options: UseTabNavigationOptions = {}
): UseTabNavigationReturn {
  const {
    defaultTab = "overview",
    paramName = "tab",
    syncWithStore = true,
    cleanDefaultUrl = true,
  } = options;

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const setActiveTab = usePageLayout((s) => s.setActiveTab);

  // Get current tab from URL or use default
  const currentTab = useMemo(() => {
    return searchParams.get(paramName) ?? defaultTab;
  }, [searchParams, paramName, defaultTab]);

  // Sync with store when tab changes
  useEffect(() => {
    if (syncWithStore) {
      setActiveTab(currentTab);
    }
  }, [currentTab, syncWithStore, setActiveTab]);

  // Clear active tab on unmount
  useEffect(() => {
    return () => {
      if (syncWithStore) {
        setActiveTab(null);
      }
    };
  }, [syncWithStore, setActiveTab]);

  /**
   * Navigate to a specific tab
   */
  const navigate = useCallback(
    (tabId: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (cleanDefaultUrl && tabId === defaultTab) {
        // Remove param for clean URL when on default tab
        params.delete(paramName);
      } else {
        params.set(paramName, tabId);
      }

      const query = params.toString();
      const newUrl = `${pathname}${query ? `?${query}` : ""}`;

      // Use replace to avoid adding to history stack for tab changes
      router.replace(newUrl, { scroll: false });

      // Immediately sync with store for optimistic UI
      if (syncWithStore) {
        setActiveTab(tabId);
      }
    },
    [searchParams, pathname, router, defaultTab, paramName, cleanDefaultUrl, syncWithStore, setActiveTab]
  );

  /**
   * Check if a specific tab is active
   */
  const isActive = useCallback(
    (tabId: string) => currentTab === tabId,
    [currentTab]
  );

  /**
   * Get the URL for a specific tab
   */
  const getTabUrl = useCallback(
    (tabId: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (cleanDefaultUrl && tabId === defaultTab) {
        params.delete(paramName);
      } else {
        params.set(paramName, tabId);
      }

      const query = params.toString();
      return `${pathname}${query ? `?${query}` : ""}`;
    },
    [searchParams, pathname, defaultTab, paramName, cleanDefaultUrl]
  );

  return {
    currentTab,
    navigate,
    isActive,
    getTabUrl,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse tab ID from URL search params
 * Useful for server components that can't use hooks
 */
export function getTabFromSearchParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>,
  options: { paramName?: string; defaultTab?: string } = {}
): string {
  const { paramName = "tab", defaultTab = "overview" } = options;

  if (searchParams instanceof URLSearchParams) {
    return searchParams.get(paramName) ?? defaultTab;
  }

  const value = searchParams[paramName];
  if (Array.isArray(value)) {
    return value[0] ?? defaultTab;
  }
  return value ?? defaultTab;
}

/**
 * Create a tab URL string
 * Useful for server components or Link components
 */
export function createTabUrl(
  pathname: string,
  tabId: string,
  options: {
    paramName?: string;
    defaultTab?: string;
    cleanDefaultUrl?: boolean;
    existingParams?: URLSearchParams | Record<string, string>;
  } = {}
): string {
  const {
    paramName = "tab",
    defaultTab = "overview",
    cleanDefaultUrl = true,
    existingParams,
  } = options;

  const params = existingParams instanceof URLSearchParams
    ? new URLSearchParams(existingParams.toString())
    : new URLSearchParams(existingParams);

  if (cleanDefaultUrl && tabId === defaultTab) {
    params.delete(paramName);
  } else {
    params.set(paramName, tabId);
  }

  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ""}`;
}
