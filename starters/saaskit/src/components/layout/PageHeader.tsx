"use client";

import React, { useMemo, useRef, useLayoutEffect, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@unisane/ui/lib/utils";
import { Button } from "@unisane/ui/components/button";
import { Icon } from "@unisane/ui/primitives/icon";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@unisane/ui/components/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@unisane/ui/components/dropdown-menu";
import { IconButton } from "@unisane/ui/components/icon-button";
import {
  usePageLayout,
  type Breadcrumb,
  type TabConfig,
  type ActionConfig,
} from "@/src/context/usePageLayout";
import {
  useNavigationProgressStore,
} from "@/src/context/useNavigationProgress";

// ============================================================================
// URL Utilities
// ============================================================================

/** Page icon mapping based on route segments */
const PAGE_ICONS: Record<string, string> = {
  // Dashboard & Home
  dashboard: "space_dashboard",
  home: "home",
  overview: "dashboard",

  // Billing & Finance
  billing: "credit_card",
  invoices: "receipt_long",
  payments: "payments",
  credits: "toll",
  subscriptions: "subscriptions",

  // Settings & Config
  settings: "settings",
  preferences: "tune",

  // Team & Users
  team: "group",
  members: "group",
  users: "person",
  roles: "badge",
  permissions: "lock",

  // Developer Tools
  apikeys: "key",
  webhooks: "webhook",
  audit: "history",
  logs: "article",
  outbox: "outbox",

  // Admin
  admin: "admin_panel_settings",
  tenants: "business",
  flags: "flag",
  health: "monitor_heart",

  // User Account
  profile: "account_circle",
  account: "manage_accounts",
  security: "security",
  notifications: "notifications",

  // Integrations & Apps
  integrations: "integration_instructions",
  apps: "apps",
  plugins: "extension",

  // Analytics & Reports
  analytics: "analytics",
  reports: "assessment",
  insights: "insights",
  metrics: "monitoring",

  // Content & Files
  projects: "folder",
  files: "folder_open",
  docs: "description",
  documents: "article",
  media: "perm_media",

  // Support
  help: "help",
  support: "support_agent",
  feedback: "feedback",
};

/**
 * Get icon for a page segment
 */
function getIconForSegment(segment: string): string {
  return PAGE_ICONS[segment.toLowerCase()] ?? "article";
}

/**
 * Extract page title from URL path segment
 */
function slugToTitle(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Auto-generate breadcrumbs from pathname
 */
function generateBreadcrumbsFromPath(pathname: string): Breadcrumb[] {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: Breadcrumb[] = [];

  // Handle workspace routes: /w/[slug]/...
  if (segments[0] === "w" && segments.length >= 2) {
    const slug = segments[1];
    breadcrumbs.push({
      label: "Workspace",
      href: `/w/${slug}`,
      icon: "workspaces",
    });

    for (let i = 2; i < segments.length; i++) {
      const segment = segments[i] as string;
      const href = "/" + segments.slice(0, i + 1).join("/");
      const isLast = i === segments.length - 1;

      const crumb: Breadcrumb = {
        label: slugToTitle(segment),
        icon: getIconForSegment(segment),
      };
      if (!isLast) {
        crumb.href = href;
      }
      breadcrumbs.push(crumb);
    }
  }
  // Handle admin routes: /admin/...
  else if (segments[0] === "admin" && segments.length >= 1) {
    breadcrumbs.push({
      label: "Admin",
      href: "/admin",
      icon: "admin_panel_settings",
    });

    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i] as string;
      const href = "/" + segments.slice(0, i + 1).join("/");
      const isLast = i === segments.length - 1;

      const crumb: Breadcrumb = {
        label: slugToTitle(segment),
        icon: getIconForSegment(segment),
      };
      if (!isLast) {
        crumb.href = href;
      }
      breadcrumbs.push(crumb);
    }
  }

  return breadcrumbs;
}

/**
 * Extract page title from pathname
 */
function getTitleFromPath(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  if (!lastSegment || lastSegment.startsWith("[")) return null;
  return slugToTitle(lastSegment);
}

/**
 * Get page icon from pathname
 */
function getIconFromPath(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  if (!lastSegment || lastSegment.startsWith("[")) return null;
  return getIconForSegment(lastSegment);
}

// ============================================================================
// Types
// ============================================================================

export type PageHeaderProps = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: string;
  leading?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: Breadcrumb[];
  showBreadcrumbs?: boolean;
  tabs?: TabConfig[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  showBackButton?: boolean;
  backHref?: string;
  onBack?: () => void;
  sticky?: boolean;
  className?: string;
  useStore?: boolean;
  autoFromUrl?: boolean;
  /** On mobile, collapse title row when scrolling down, show tabs only. Default: true */
  collapseOnMobileScroll?: boolean;
};

// ============================================================================
// Component
// ============================================================================

export function PageHeader({
  title: titleProp,
  subtitle: subtitleProp,
  icon: iconProp,
  leading: leadingProp,
  actions: actionsProp,
  breadcrumbs: breadcrumbsProp,
  showBreadcrumbs = true,
  tabs: tabsProp,
  activeTab: activeTabProp,
  onTabChange,
  showBackButton: showBackButtonProp,
  backHref: backHrefProp,
  onBack: onBackProp,
  sticky = true,
  className,
  useStore = true,
  autoFromUrl = true,
  collapseOnMobileScroll = true,
}: PageHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const store = usePageLayout();

  // Refs for scroll-based collapse and header measurement
  const headerRef = useRef<HTMLElement>(null);
  const titleRowRef = useRef<HTMLDivElement>(null);

  // Auto-generated values
  const autoTitle = useMemo(
    () => (autoFromUrl ? getTitleFromPath(pathname) : null),
    [pathname, autoFromUrl]
  );
  const autoIcon = useMemo(
    () => (autoFromUrl ? getIconFromPath(pathname) : null),
    [pathname, autoFromUrl]
  );
  const autoBreadcrumbs = useMemo(
    () => (autoFromUrl ? generateBreadcrumbsFromPath(pathname) : []),
    [pathname, autoFromUrl]
  );

  // Resolve values (props > store > auto)
  const title = titleProp ?? (useStore ? store.title : null) ?? autoTitle;
  const subtitle = subtitleProp ?? (useStore ? store.subtitle : null);
  const icon = iconProp ?? (useStore ? store.icon : null) ?? autoIcon;
  const leading = leadingProp ?? (useStore ? store.leading : null);
  const actions = actionsProp ?? (useStore ? store.actions : null);
  const breadcrumbs =
    breadcrumbsProp ??
    (useStore && store.breadcrumbs.length > 0 ? store.breadcrumbs : null) ??
    autoBreadcrumbs;
  const tabs = tabsProp ?? (useStore ? store.tabs : []);
  const activeTab = activeTabProp ?? (useStore ? store.activeTab : null);
  const showBackButton =
    showBackButtonProp ?? (useStore ? store.backNavigation.show : false);
  const backHref =
    backHrefProp ?? (useStore ? store.backNavigation.href : undefined);
  const onBack =
    onBackProp ?? (useStore ? store.backNavigation.onBack : undefined);
  const primaryAction = useStore ? store.primaryAction : null;
  const secondaryActions = useStore ? store.secondaryActions : [];

  const handleBack = () => {
    if (onBack) onBack();
    else if (backHref) router.push(backHref);
    else router.back();
  };

  const handleTabChange = (tabId: string) => {
    // Find the tab to check for href
    const tab = tabs.find((t) => t.id === tabId);

    // If tab has href, navigate to it
    if (tab?.href) {
      router.push(tab.href);
      return;
    }

    // Otherwise use callback (prop > store) or just update store
    if (onTabChange) {
      onTabChange(tabId);
    } else if (useStore && store.onTabChange) {
      store.onTabChange(tabId);
    } else if (useStore) {
      store.setActiveTab(tabId);
    }
  };

  const renderActionButton = (action: ActionConfig) => (
    <Button
      key={action.id}
      variant={action.variant ?? "filled"}
      size="sm"
      disabled={action.disabled ?? false}
      loading={action.loading ?? false}
      icon={
        action.iconPosition !== "trailing" && action.icon ? (
          <Icon symbol={action.icon} size="sm" />
        ) : undefined
      }
      trailingIcon={
        action.iconPosition === "trailing" && action.icon ? (
          <Icon symbol={action.icon} size="sm" />
        ) : undefined
      }
      onClick={action.onClick}
    >
      {action.label}
    </Button>
  );

  const hasBreadcrumbs = showBreadcrumbs && breadcrumbs.length > 1;
  const hasTabs = tabs.length > 0;
  const hasActions = actions || primaryAction || secondaryActions.length > 0;
  const hasContent = title || hasBreadcrumbs || hasTabs || showBackButton;

  // Should enable mobile collapse? Only when we have tabs to show
  const shouldCollapse = collapseOnMobileScroll && hasTabs;

  // Scroll-based collapse for mobile - uses direct DOM manipulation to avoid React re-renders
  // Simple approach: collapse when scrolled past threshold, expand when near top
  useEffect(() => {
    if (!shouldCollapse || !sticky) return;

    const scrollContainer = headerRef.current?.parentElement;
    const titleRow = titleRowRef.current;
    if (!scrollContainer || !titleRow) return;

    // Check if we're on mobile (< 640px = sm breakpoint)
    const mobileQuery = window.matchMedia("(max-width: 639px)");

    // Configuration
    const COLLAPSE_THRESHOLD = 60; // Collapse after scrolling this far
    const EXPAND_THRESHOLD = 40; // Expand when scrolling back to within this distance from top

    let ticking = false;

    const updateCollapsedState = () => {
      const titleRowEl = titleRowRef.current;
      if (!titleRowEl) return;

      if (!mobileQuery.matches) {
        // Desktop: always expanded
        titleRowEl.dataset.collapsed = "false";
        ticking = false;
        return;
      }

      const currentScrollY = scrollContainer.scrollTop;
      const currentlyCollapsed = titleRowEl.dataset.collapsed === "true";

      // Use different thresholds for collapse vs expand (hysteresis)
      // This prevents flickering: need to scroll past 60px to collapse,
      // but need to scroll back above 40px to expand
      if (!currentlyCollapsed && currentScrollY > COLLAPSE_THRESHOLD) {
        // Not collapsed and scrolled past threshold -> collapse
        titleRowEl.dataset.collapsed = "true";
      } else if (currentlyCollapsed && currentScrollY < EXPAND_THRESHOLD) {
        // Collapsed and scrolled back near top -> expand
        titleRowEl.dataset.collapsed = "false";
      }

      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateCollapsedState);
      }
    };

    // Initialize state
    updateCollapsedState();

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });

    // Handle mobile/desktop switch
    const handleMediaChange = () => {
      updateCollapsedState();
    };
    mobileQuery.addEventListener("change", handleMediaChange);

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      mobileQuery.removeEventListener("change", handleMediaChange);
    };
  }, [shouldCollapse, sticky]);

  // Measure header height and set CSS variable for nested sticky elements (e.g., DataTable)
  // DataTable uses --app-header-height by default for sticky offset
  useLayoutEffect(() => {
    if (!headerRef.current || !sticky) return;

    const updateHeight = () => {
      const height = headerRef.current?.offsetHeight ?? 0;
      // Set CSS variable on the scroll container (parent = SidebarInset)
      const scrollContainer = headerRef.current?.parentElement;
      if (scrollContainer) {
        scrollContainer.style.setProperty("--app-header-height", `${height}px`);
      }
    };

    updateHeight();

    // Update on resize (e.g., tabs appear/disappear, collapse state changes)
    const observer = new ResizeObserver(updateHeight);
    observer.observe(headerRef.current);

    return () => observer.disconnect();
  }, [sticky, hasTabs]); // Re-measure when tabs appear/disappear

  if (!hasContent) return null;

  return (
    <header
      ref={headerRef}
      className={cn(
        "relative",
        sticky && "sticky top-0 z-10 bg-surface",
        // Only show border when no tabs (tabs have their own border)
        !hasTabs && "border-b border-outline-variant/50"
      )}
    >
      {/* Content wrapper - applies horizontal padding */}
      <div className={cn(className)}>
        {/* Main header row - collapses on mobile when scrolling down (if tabs exist) */}
        {/* Uses data-collapsed attribute for CSS-driven animation (no React re-renders = no flicker) */}
        <div
          ref={titleRowRef}
          data-collapsed="false"
          className={cn(
            "flex items-center gap-3 pt-3 pb-2",
            // Mobile collapse styles - GPU-accelerated with transform and will-change
            shouldCollapse && [
              // Base transition setup
              "will-change-[transform,opacity,max-height,padding]",
              "transition-[transform,opacity,max-height,padding] duration-200 ease-out",
              // Collapsed state (data-collapsed="true") - only on mobile
              "data-[collapsed=true]:max-h-0 data-[collapsed=true]:opacity-0",
              "data-[collapsed=true]:overflow-hidden data-[collapsed=true]:pt-0 data-[collapsed=true]:pb-0",
              "data-[collapsed=true]:pointer-events-none data-[collapsed=true]:-translate-y-1",
              // Expanded state
              "data-[collapsed=false]:max-h-24 data-[collapsed=false]:opacity-100",
              "data-[collapsed=false]:translate-y-0",
              // Desktop override - always visible regardless of data-collapsed
              "sm:max-h-none! sm:opacity-100! sm:overflow-visible! sm:pt-3! sm:pb-2!",
              "sm:pointer-events-auto! sm:translate-y-0!",
            ]
          )}
        >
        {/* Left side: Back / Icon / Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Back button */}
          {showBackButton && (
            <button
              onClick={handleBack}
              aria-label="Go back"
              className="shrink-0 p-1.5 -ml-1.5 rounded-full hover:bg-surface-container-high transition-colors"
            >
              <Icon symbol="arrow_back" size="sm" className="text-on-surface-variant" />
            </button>
          )}

          {/* Page icon */}
          {icon && !leading && (
            <div className="shrink-0 size-9 rounded-md bg-primary-container flex items-center justify-center">
              <Icon symbol={icon} size={20} className="text-on-primary-container" />
            </div>
          )}

          {/* Custom leading */}
          {leading && <div className="shrink-0">{leading}</div>}

          {/* Title & breadcrumb area */}
          <div className="min-w-0 flex-1">
            {/* Breadcrumb trail */}
            {hasBreadcrumbs && (
              <nav
                aria-label="Breadcrumb"
                className="flex items-center gap-1 text-xs text-on-surface-variant mb-0.5"
              >
                {breadcrumbs.slice(0, -1).map((crumb, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span className="text-outline">/</span>}
                    {crumb.href ? (
                      <Link
                        href={crumb.href}
                        className="hover:text-on-surface transition-colors truncate max-w-[120px]"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="truncate max-w-[120px]">{crumb.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            )}

            {/* Title + subtitle */}
            <div className="flex items-baseline gap-2">
              <h1 className="text-base font-semibold text-on-surface truncate">
                {title}
              </h1>
              {subtitle && (
                <span className="text-sm text-on-surface-variant truncate hidden sm:inline">
                  {subtitle}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side: Actions */}
        {hasActions && (
          <div className="shrink-0 flex items-center gap-1.5">
            {/* Desktop: Show all actions */}
            <div className="hidden sm:flex items-center gap-1.5">
              {secondaryActions.map(renderActionButton)}
              {primaryAction && renderActionButton(primaryAction)}
            </div>

            {/* Mobile: Show primary action + overflow menu for secondary */}
            <div className="flex sm:hidden items-center gap-1">
              {primaryAction && renderActionButton(primaryAction)}
              {secondaryActions.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <IconButton
                      variant="standard"
                      ariaLabel="More actions"
                    >
                      <Icon symbol="more_vert" size="sm" />
                    </IconButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {secondaryActions.map((action) => (
                      <DropdownMenuItem
                        key={action.id}
                        onSelect={action.onClick}
                        disabled={action.disabled ?? false}
                      >
                        {action.icon && (
                          <Icon symbol={action.icon} size="sm" className="mr-2" />
                        )}
                        {action.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Custom actions (always shown) */}
            {actions}
          </div>
        )}
        </div>
      </div>

      {/* Tabs row - no padding on mobile (full width), padding on medium+ screens */}
      {hasTabs && (
        <div className="medium:px-6 expanded:px-8 overflow-hidden">
          <Tabs
            value={activeTab ?? tabs[0]?.id ?? ""}
            onValueChange={handleTabChange}
          >
            <TabsList className="no-scrollbar">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  disabled={tab.disabled}
                  icon={tab.icon ? <Icon symbol={tab.icon} size="sm" /> : undefined}
                >
                  {tab.label}
                  {tab.badge !== undefined && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium">
                      {tab.badge}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Navigation Progress Bar - rendered at bottom of header */}
      <NavigationProgressBar />
    </header>
  );
}

/**
 * Progress bar that shows during navigation, positioned at the bottom of the header
 */
function NavigationProgressBar() {
  const { isNavigating, progress } = useNavigationProgressStore();

  if (!isNavigating && progress === 0) {
    return null;
  }

  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-1 bg-transparent pointer-events-none overflow-hidden"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page loading"
    >
      <div
        className="h-full bg-primary transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: isNavigating ? 1 : 0,
        }}
      />
      {/* Glow effect at the leading edge */}
      {isNavigating && progress > 0 && (
        <div
          className="absolute top-0 h-full w-20 bg-linear-to-r from-transparent to-primary/40 blur-sm"
          style={{
            left: `calc(${progress}% - 5rem)`,
          }}
        />
      )}
    </div>
  );
}

export default PageHeader;
