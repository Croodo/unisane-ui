"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useSidebar,
  SidebarRail,
  SidebarRailItem,
  SidebarDrawer,
  SidebarContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarNavItem,
  SidebarCollapsibleGroup,
  SidebarBackdrop,
  SidebarInset,
} from "@unisane/ui/components/sidebar";
import { TopAppBar } from "@unisane/ui/components/top-app-bar";
import { IconButton } from "@unisane/ui/components/icon-button";
import { RailUserMenu } from "@/src/components/layout/RailUserMenu";
import { useSession } from "@/src/hooks/useSession";
import { PERM } from "@/src/shared/rbac/permissions";
import type { Permission } from "@/src/shared/rbac/permissions";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string; // Material Symbols icon name
  activeIcon?: string;
  perm?: Permission;
}

interface NavCategory {
  id: string;
  label: string;
  icon: string;
  activeIcon?: string;
  href?: string;
  items?: NavItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Navigation Configuration
// ─────────────────────────────────────────────────────────────────────────────

const getNavData = (base: string): NavCategory[] => [
  {
    id: "product",
    label: "Product",
    icon: "apps",
    href: `${base}/dashboard`,
    items: [
      {
        id: "home",
        label: "Home",
        href: `${base}/dashboard`,
        icon: "home",
        activeIcon: "home",
      },
      // ADD YOUR PRODUCT FEATURES HERE:
      // {
      //   id: "projects",
      //   label: "Projects",
      //   href: `${base}/projects`,
      //   icon: "folder",
      //   activeIcon: "folder",
      // },
    ],
  },
  {
    id: "workspace",
    label: "Workspace",
    icon: "workspaces",
    items: [
      {
        id: "team",
        label: "Team",
        href: `${base}/team`,
        icon: "group",
        activeIcon: "group",
        perm: PERM.MEMBERS_READ,
      },
      {
        id: "billing",
        label: "Billing",
        href: `${base}/billing`,
        icon: "credit_card",
        activeIcon: "credit_card",
        perm: PERM.BILLING_READ,
      },
      {
        id: "settings",
        label: "Settings",
        href: `${base}/settings`,
        icon: "settings",
        activeIcon: "settings",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Get active category ID from pathname
// ─────────────────────────────────────────────────────────────────────────────

function getActiveCategoryId(
  pathname: string | null,
  navData: NavCategory[]
): string | null {
  if (!pathname) return null;

  for (const category of navData) {
    // Check category's own href
    if (category.href && pathname.startsWith(category.href)) {
      return category.id;
    }
    // Check child items
    if (category.items) {
      for (const item of category.items) {
        if (pathname.startsWith(item.href)) {
          return category.id;
        }
      }
    }
  }
  return navData[0]?.id ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// WorkspaceShell Content (uses sidebar context)
// ─────────────────────────────────────────────────────────────────────────────

interface WorkspaceShellContentProps {
  children: React.ReactNode;
  slug: string;
  tenantName: string | null;
  perms: string[];
}

function WorkspaceShellContent({
  children,
  slug,
  tenantName,
  perms: permsProp,
}: WorkspaceShellContentProps) {
  const pathname = usePathname();
  const { me } = useSession();
  const {
    activeId,
    effectiveItem,
    mobileOpen,
    toggleMobile,
    expanded,
    toggleExpanded,
  } = useSidebar();

  const base = `/w/${slug}`;
  const navData = useMemo(() => getNavData(base), [base]);

  const perms = useMemo(
    () => new Set(permsProp ?? (me?.perms as string[] | undefined) ?? []),
    [permsProp, me?.perms]
  );

  const can = (perm?: Permission): boolean => {
    if (!perm) return true;
    return perms.has(perm);
  };

  const isActive = (href: string): boolean => {
    if (!pathname) return false;
    const normalizedPath = pathname.replace(/\/+$/, "");
    const normalizedHref = href.replace(/\/+$/, "");
    if (normalizedPath === normalizedHref) return true;
    return normalizedPath.startsWith(`${normalizedHref}/`);
  };

  // Find effective item for drawer content - use our local typed data
  const currentEffectiveItem = useMemo((): NavCategory | null => {
    // Get the ID to lookup - prefer effectiveItem's ID if available, fallback to activeId
    const lookupId = effectiveItem?.id ?? activeId;
    if (!lookupId) return null;
    return navData.find((cat) => cat.id === lookupId) ?? null;
  }, [effectiveItem, activeId, navData]);

  return (
    <div className="flex w-full h-screen bg-surface isolate overflow-hidden">
      {/* Navigation Progress Bar */}
      <NavigationProgress />

      {/* Top App Bar (Mobile + Tablet) */}
      <TopAppBar
        className="fixed top-0 left-0 right-0 z-50 flex expanded:hidden"
        title={
          <span className="text-on-surface font-semibold">
            {tenantName ?? slug}
          </span>
        }
        variant="small"
        navigationIcon={
          <IconButton
            variant="standard"
            ariaLabel="Open menu"
            onClick={toggleMobile}
          >
            <span className="material-symbols-outlined">menu</span>
          </IconButton>
        }
      />

      {/* Navigation Rail (Desktop only - 840px+) */}
      <SidebarRail className="bg-surface-container-low">
        {/* Menu Toggle */}
        <div className="flex flex-col items-center pt-3 pb-2 w-full">
          <IconButton
            variant="standard"
            ariaLabel={expanded ? "Close menu" : "Open menu"}
            onClick={toggleExpanded}
            className="w-14 h-10"
          >
            <span className="material-symbols-outlined">
              {expanded ? "menu_open" : "menu"}
            </span>
          </IconButton>
        </div>

        {/* Navigation Items */}
        <div className="flex flex-col items-center gap-3 w-full flex-1 pt-2">
          {navData.map((category) => (
            <SidebarRailItem
              key={category.id}
              id={category.id}
              label={category.label}
              icon={category.icon}
              activeIcon={category.activeIcon}
              childIds={category.items?.map((item) => item.id) ?? []}
              asChild
            >
              <Link href={category.href ?? category.items?.[0]?.href ?? "#"} />
            </SidebarRailItem>
          ))}
        </div>

        {/* Footer - User Menu */}
        <div className="flex flex-col items-center gap-3 pb-4">
          <RailUserMenu user={me} variant="tenant" basePath={base} />
        </div>
      </SidebarRail>

      {/* Navigation Drawer */}
      <SidebarDrawer className="bg-surface-container-low">
        {mobileOpen ? (
          // Mobile/Tablet: Show all categories with collapsible accordion
          <SidebarContent className="pt-20 pb-24">
            <SidebarGroupLabel>{tenantName ?? slug}</SidebarGroupLabel>
            <SidebarMenu>
              {navData.map((category) => {
                const visibleItems =
                  category.items?.filter((item) => can(item.perm)) ?? [];
                if (visibleItems.length === 0 && !category.href) return null;

                const isActiveCategory = activeId === category.id;

                if (visibleItems.length > 0) {
                  return (
                    <SidebarCollapsibleGroup
                      key={category.id}
                      id={category.id}
                      label={category.label}
                      icon={category.icon}
                      childIds={visibleItems.map((item) => item.id)}
                      defaultOpen={isActiveCategory}
                    >
                      <SidebarMenu>
                        {visibleItems.map((item) => (
                          <SidebarNavItem
                            key={item.id}
                            id={item.id}
                            label={item.label}
                            icon={item.icon}
                            active={isActive(item.href)}
                            asChild
                          >
                            <Link href={item.href} />
                          </SidebarNavItem>
                        ))}
                      </SidebarMenu>
                    </SidebarCollapsibleGroup>
                  );
                }

                return (
                  <SidebarNavItem
                    key={category.id}
                    id={category.id}
                    icon={category.icon}
                    label={category.label}
                    active={category.href ? isActive(category.href) : false}
                    asChild
                  >
                    <Link href={category.href ?? "#"} />
                  </SidebarNavItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
        ) : currentEffectiveItem &&
          currentEffectiveItem.items &&
          currentEffectiveItem.items.length > 0 ? (
          // Desktop (hover or expanded): Show active category's sub-items
          <SidebarContent
            className="pt-4 pb-4 animate-content-enter"
            key={currentEffectiveItem.id}
          >
            <SidebarGroupLabel>{currentEffectiveItem.label}</SidebarGroupLabel>
            <SidebarMenu>
              {currentEffectiveItem.items
                .filter((item) => can(item.perm))
                .map((item) => (
                  <SidebarNavItem
                    key={item.id}
                    id={item.id}
                    icon={item.icon}
                    label={item.label}
                    active={isActive(item.href)}
                    asChild
                  >
                    <Link href={item.href} />
                  </SidebarNavItem>
                ))}
            </SidebarMenu>
          </SidebarContent>
        ) : (
          <SidebarContent className="pt-4 animate-content-enter">
            <p className="text-body-medium text-on-surface-variant px-4">
              Select a category to view items.
            </p>
          </SidebarContent>
        )}
      </SidebarDrawer>

      {/* Main Content */}
      <SidebarInset className="expanded:border-l expanded:border-outline-variant/50">
        {/* Page Header (reads from usePageLayout store) */}
        <PageHeader className="px-4 medium:px-6 expanded:px-8" />

        {/* Content Container */}
        <div className="px-4 py-4 medium:px-6 expanded:px-8 expanded:py-6 flex-1">
          <div className="expanded:container expanded:mx-auto">{children}</div>
        </div>
      </SidebarInset>

      {/* Backdrop */}
      <SidebarBackdrop />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WorkspaceShell (with Provider)
// ─────────────────────────────────────────────────────────────────────────────

import { SidebarProvider } from "@unisane/ui/components/sidebar";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { NavigationProgress } from "@/src/context/useNavigationProgress";

interface WorkspaceShellProps {
  children: React.ReactNode;
  slug: string;
  tenantName: string | null;
  perms: string[];
}

export function WorkspaceShell({
  children,
  slug,
  tenantName,
  perms,
}: WorkspaceShellProps) {
  const pathname = usePathname();
  const base = `/w/${slug}`;
  const navData = useMemo(() => getNavData(base), [base]);
  const defaultActiveId = getActiveCategoryId(pathname, navData);

  return (
    <SidebarProvider
      items={navData}
      defaultActiveId={defaultActiveId}
      persist={true}
      storageKey={`saaskit-workspace-${slug}`}
      railWidth={96}
      drawerWidth={220}
      mobileDrawerWidth={280}
    >
      <WorkspaceShellContent slug={slug} tenantName={tenantName} perms={perms}>
        {children}
      </WorkspaceShellContent>
    </SidebarProvider>
  );
}

export default WorkspaceShell;
