"use client";

import { create } from "zustand";
import React from "react";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Breadcrumb item for navigation hierarchy
 */
export type Breadcrumb = {
  /** Display label */
  label: string;
  /** Optional link href - last item typically has no href */
  href?: string;
  /** Optional Material Symbol icon name */
  icon?: string;
};

/**
 * Tab configuration for page navigation
 */
export type TabConfig = {
  /** Unique identifier for the tab */
  id: string;
  /** Display label */
  label: string;
  /** Optional Material Symbol icon name */
  icon?: string;
  /** Optional badge content (e.g., count) */
  badge?: string | number;
  /** Whether the tab is disabled */
  disabled?: boolean;
  /** Optional description shown on hover */
  description?: string;
  /** Optional href for navigation tabs (uses Next.js Link) */
  href?: string;
};

/**
 * Action button configuration
 */
export type ActionConfig = {
  /** Unique identifier */
  id: string;
  /** Button label */
  label: string;
  /** Optional Material Symbol icon name */
  icon?: string;
  /** Click handler */
  onClick: () => void;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Button variant */
  variant?: "filled" | "tonal" | "outlined" | "text";
  /** Position: leading icon or trailing icon */
  iconPosition?: "leading" | "trailing";
};

/**
 * Back navigation configuration
 */
export type BackNavigation = {
  /** Whether to show back button */
  show: boolean;
  /** Optional href for back link */
  href?: string;
  /** Optional custom back handler */
  onBack?: () => void;
  /** Optional label (defaults to "Back") */
  label?: string;
};

/**
 * Search configuration
 */
export type SearchConfig = {
  /** Whether search is enabled */
  enabled: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Current search value */
  value: string;
  /** Search handler - called on input change or submit */
  onSearch?: (query: string) => void;
  /** Whether to debounce search input */
  debounce?: boolean;
  /** Debounce delay in ms */
  debounceDelay?: number;
};

/**
 * Complete page layout state
 */
export type PageLayoutState = {
  // ---- Header Content ----
  /** Page title */
  title: React.ReactNode | null;
  /** Page subtitle */
  subtitle: React.ReactNode | null;
  /** Extended description (optional) */
  description: React.ReactNode | null;
  /** Page icon (Material Symbol name) */
  icon: string | null;
  /** Leading element (e.g., custom icon, avatar) - overrides icon */
  leading: React.ReactNode | null;

  // ---- Breadcrumbs ----
  /** Breadcrumb trail */
  breadcrumbs: Breadcrumb[];

  // ---- Back Navigation ----
  /** Back navigation config */
  backNavigation: BackNavigation;

  // ---- Tabs ----
  /** Tab configuration array */
  tabs: TabConfig[];
  /** Currently active tab ID */
  activeTab: string | null;
  /** Tab change handler */
  onTabChange: ((tabId: string) => void) | null;

  // ---- Search ----
  /** Search configuration */
  search: SearchConfig;

  // ---- Actions ----
  /** Primary action button */
  primaryAction: ActionConfig | null;
  /** Secondary action buttons */
  secondaryActions: ActionConfig[];
  /** Raw actions node (for backwards compatibility) */
  actions: React.ReactNode | null;

  // ---- Meta ----
  /** Page loading state */
  loading: boolean;

  // ---- Setters ----
  setTitle: (title: React.ReactNode | null) => void;
  setSubtitle: (subtitle: React.ReactNode | null) => void;
  setDescription: (description: React.ReactNode | null) => void;
  setIcon: (icon: string | null) => void;
  setLeading: (leading: React.ReactNode | null) => void;
  setBreadcrumbs: (breadcrumbs: Breadcrumb[]) => void;
  setBackNavigation: (config: Partial<BackNavigation>) => void;
  setTabs: (tabs: TabConfig[]) => void;
  setActiveTab: (tabId: string | null) => void;
  setOnTabChange: (handler: ((tabId: string) => void) | null) => void;
  setSearch: (config: Partial<SearchConfig>) => void;
  setSearchValue: (value: string) => void;
  setPrimaryAction: (action: ActionConfig | null) => void;
  setSecondaryActions: (actions: ActionConfig[]) => void;
  setActions: (actions: React.ReactNode | null) => void;
  setLoading: (loading: boolean) => void;

  // ---- Batch Update ----
  /** Update multiple values at once */
  update: (partial: Partial<PageLayoutStateValues>) => void;

  // ---- Reset ----
  /** Reset all values to defaults */
  reset: () => void;
};

/**
 * Values-only type (without methods) for batch updates
 */
type PageLayoutStateValues = Omit<
  PageLayoutState,
  | "setTitle"
  | "setSubtitle"
  | "setDescription"
  | "setIcon"
  | "setLeading"
  | "setBreadcrumbs"
  | "setBackNavigation"
  | "setTabs"
  | "setActiveTab"
  | "setOnTabChange"
  | "setSearch"
  | "setSearchValue"
  | "setPrimaryAction"
  | "setSecondaryActions"
  | "setActions"
  | "setLoading"
  | "update"
  | "reset"
>;

// ============================================================================
// Default Values
// ============================================================================

const defaultBackNavigation: BackNavigation = {
  show: false,
  label: "Back",
};

const defaultSearch: SearchConfig = {
  enabled: false,
  placeholder: "Search...",
  value: "",
  debounce: true,
  debounceDelay: 300,
};

const defaultState: PageLayoutStateValues = {
  title: null,
  subtitle: null,
  description: null,
  icon: null,
  leading: null,
  breadcrumbs: [],
  backNavigation: defaultBackNavigation,
  tabs: [],
  activeTab: null,
  onTabChange: null,
  search: defaultSearch,
  primaryAction: null,
  secondaryActions: [],
  actions: null,
  loading: false,
};

// ============================================================================
// Zustand Store
// ============================================================================

export const usePageLayout = create<PageLayoutState>((set, get) => ({
  // Initial state
  ...defaultState,

  // Setters
  setTitle: (title) => set({ title }),
  setSubtitle: (subtitle) => set({ subtitle }),
  setDescription: (description) => set({ description }),
  setIcon: (icon) => set({ icon }),
  setLeading: (leading) => set({ leading }),
  setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
  setBackNavigation: (config) =>
    set((state) => ({
      backNavigation: { ...state.backNavigation, ...config },
    })),
  setTabs: (tabs) => set({ tabs }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setOnTabChange: (onTabChange) => set({ onTabChange }),
  setSearch: (config) =>
    set((state) => ({
      search: { ...state.search, ...config },
    })),
  setSearchValue: (value) =>
    set((state) => ({
      search: { ...state.search, value },
    })),
  setPrimaryAction: (primaryAction) => set({ primaryAction }),
  setSecondaryActions: (secondaryActions) => set({ secondaryActions }),
  setActions: (actions) => set({ actions }),
  setLoading: (loading) => set({ loading }),

  // Batch update
  update: (partial) => set((state) => ({ ...state, ...partial })),

  // Reset
  reset: () => set(defaultState),
}));

// ============================================================================
// Declarative PageLayout Component
// ============================================================================

export type PageLayoutProps = {
  /** Page title */
  title?: React.ReactNode | null;
  /** Page subtitle */
  subtitle?: React.ReactNode | null;
  /** Extended description */
  description?: React.ReactNode | null;
  /** Page icon (Material Symbol name) */
  icon?: string | null;
  /** Leading element (custom icon, avatar) - overrides icon */
  leading?: React.ReactNode | null;
  /** Breadcrumb trail */
  breadcrumbs?: Breadcrumb[];
  /** Show back button */
  showBackButton?: boolean;
  /** Back button href */
  backHref?: string;
  /** Back button handler */
  onBack?: () => void;
  /** Back button label */
  backLabel?: string;
  /** Tab configuration */
  tabs?: TabConfig[];
  /** Tab change handler */
  onTabChange?: (tabId: string) => void;
  /** Enable search */
  searchEnabled?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Search handler */
  onSearch?: (query: string) => void;
  /** Primary action config */
  primaryAction?: ActionConfig | null;
  /** Secondary actions config */
  secondaryActions?: ActionConfig[];
  /** Raw actions node (backwards compatible) */
  actions?: React.ReactNode | null;
  /** Loading state */
  loading?: boolean;
};

/**
 * Declarative component to set page layout from any page/client component.
 *
 * @example
 * ```tsx
 * <PageLayout
 *   title="Billing"
 *   subtitle="Manage your plan and credits"
 *   breadcrumbs={[
 *     { label: 'Workspace', href: `/w/${slug}` },
 *     { label: 'Billing' },
 *   ]}
 *   tabs={[
 *     { id: 'overview', label: 'Overview', icon: 'credit_card' },
 *     { id: 'invoices', label: 'Invoices', icon: 'receipt' },
 *   ]}
 *   primaryAction={{
 *     id: 'view-plans',
 *     label: 'View Plans',
 *     icon: 'north_east',
 *     onClick: () => router.push('/pricing'),
 *   }}
 * />
 * ```
 */
export function PageLayout({
  title,
  subtitle,
  description,
  icon,
  leading,
  breadcrumbs,
  showBackButton,
  backHref,
  onBack,
  backLabel,
  tabs,
  onTabChange,
  searchEnabled,
  searchPlaceholder,
  onSearch,
  primaryAction,
  secondaryActions,
  actions,
  loading,
}: PageLayoutProps) {
  // Extract individual setters to avoid infinite re-render loops
  const setTitle = usePageLayout((s) => s.setTitle);
  const setSubtitle = usePageLayout((s) => s.setSubtitle);
  const setDescription = usePageLayout((s) => s.setDescription);
  const setIcon = usePageLayout((s) => s.setIcon);
  const setLeading = usePageLayout((s) => s.setLeading);
  const setBreadcrumbs = usePageLayout((s) => s.setBreadcrumbs);
  const setTabs = usePageLayout((s) => s.setTabs);
  const setOnTabChange = usePageLayout((s) => s.setOnTabChange);
  const setPrimaryAction = usePageLayout((s) => s.setPrimaryAction);
  const setSecondaryActions = usePageLayout((s) => s.setSecondaryActions);
  const setActions = usePageLayout((s) => s.setActions);
  const setLoading = usePageLayout((s) => s.setLoading);
  const setBackNavigation = usePageLayout((s) => s.setBackNavigation);
  const setSearch = usePageLayout((s) => s.setSearch);
  const reset = usePageLayout((s) => s.reset);

  React.useEffect(() => {
    // Set all provided values
    if (title !== undefined) setTitle(title);
    if (subtitle !== undefined) setSubtitle(subtitle);
    if (description !== undefined) setDescription(description);
    if (icon !== undefined) setIcon(icon);
    if (leading !== undefined) setLeading(leading);
    if (breadcrumbs !== undefined) setBreadcrumbs(breadcrumbs);
    if (tabs !== undefined) setTabs(tabs);
    if (onTabChange !== undefined) setOnTabChange(onTabChange);
    if (primaryAction !== undefined) setPrimaryAction(primaryAction);
    if (secondaryActions !== undefined) setSecondaryActions(secondaryActions);
    if (actions !== undefined) setActions(actions);
    if (loading !== undefined) setLoading(loading);

    // Handle back navigation
    if (showBackButton !== undefined || backHref !== undefined || onBack !== undefined) {
      const backNav: Partial<BackNavigation> = {
        show: showBackButton ?? false,
      };
      if (backHref !== undefined) backNav.href = backHref;
      if (onBack !== undefined) backNav.onBack = onBack;
      if (backLabel !== undefined) backNav.label = backLabel;
      setBackNavigation(backNav);
    }

    // Handle search
    if (searchEnabled !== undefined || searchPlaceholder !== undefined || onSearch !== undefined) {
      const searchConf: Partial<SearchConfig> = {
        enabled: searchEnabled ?? false,
      };
      if (searchPlaceholder !== undefined) searchConf.placeholder = searchPlaceholder;
      if (onSearch !== undefined) searchConf.onSearch = onSearch;
      setSearch(searchConf);
    }

    // Cleanup on unmount
    return () => {
      reset();
    };
  }, [
    title,
    subtitle,
    description,
    icon,
    leading,
    breadcrumbs,
    showBackButton,
    backHref,
    onBack,
    backLabel,
    tabs,
    searchEnabled,
    searchPlaceholder,
    onSearch,
    primaryAction,
    secondaryActions,
    actions,
    loading,
    setTitle,
    setSubtitle,
    setDescription,
    setIcon,
    setLeading,
    setBreadcrumbs,
    setTabs,
    setPrimaryAction,
    setSecondaryActions,
    setActions,
    setLoading,
    setBackNavigation,
    setSearch,
    reset,
  ]);

  // This component renders nothing - it just syncs state
  return null;
}

// ============================================================================
// Selector Hooks (for optimized re-renders)
// ============================================================================

/** Get page title */
export const usePageTitle = () => usePageLayout((s) => s.title);

/** Get page subtitle */
export const usePageSubtitle = () => usePageLayout((s) => s.subtitle);

/** Get page icon */
export const usePageIcon = () => usePageLayout((s) => s.icon);

/** Get breadcrumbs */
export const useBreadcrumbs = () => usePageLayout((s) => s.breadcrumbs);

/** Get back navigation config */
export const useBackNavigation = () => usePageLayout((s) => s.backNavigation);

/** Get tabs config */
export const usePageTabs = () => usePageLayout((s) => s.tabs);

/** Get active tab */
export const useActiveTab = () => usePageLayout((s) => s.activeTab);

/** Get search config */
export const usePageSearch = () => usePageLayout((s) => s.search);

/** Get primary action */
export const usePrimaryAction = () => usePageLayout((s) => s.primaryAction);

/** Get secondary actions */
export const useSecondaryActions = () => usePageLayout((s) => s.secondaryActions);

/** Get raw actions node */
export const usePageActions = () => usePageLayout((s) => s.actions);

/** Get loading state */
export const usePageLoading = () => usePageLayout((s) => s.loading);

/** Get all header-related values */
export const usePageHeaderValues = () =>
  usePageLayout((s) => ({
    title: s.title,
    subtitle: s.subtitle,
    description: s.description,
    icon: s.icon,
    leading: s.leading,
    breadcrumbs: s.breadcrumbs,
    backNavigation: s.backNavigation,
    tabs: s.tabs,
    activeTab: s.activeTab,
    search: s.search,
    primaryAction: s.primaryAction,
    secondaryActions: s.secondaryActions,
    actions: s.actions,
    loading: s.loading,
  }));
