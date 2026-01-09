"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarProvider,
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
} from "@/src/components/ui/sidebar";
import { TopAppBar } from "@/src/components/ui/top-app-bar";
import { IconButton } from "@/src/components/ui/icon-button";
import { RailUserMenu } from "@/src/components/layout/RailUserMenu";
import { AdminBanner } from "@/src/components/admin";
import { useSession } from "@/src/hooks/useSession";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string; // Material Symbols icon name
  activeIcon?: string;
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

const NAV_DATA: NavCategory[] = [
  {
    id: "platform",
    label: "Platform",
    icon: "dashboard",
    href: "/admin/overview",
    items: [
      {
        id: "overview",
        label: "Overview",
        href: "/admin/overview",
        icon: "home",
        activeIcon: "home",
      },
      {
        id: "health",
        label: "Health",
        href: "/admin/health",
        icon: "monitor_heart",
        activeIcon: "monitor_heart",
      },
    ],
  },
  {
    id: "management",
    label: "Management",
    icon: "settings_applications",
    items: [
      {
        id: "tenants",
        label: "Tenants",
        href: "/admin/tenants",
        icon: "domain",
        activeIcon: "domain",
      },
      {
        id: "users",
        label: "Users",
        href: "/admin/users",
        icon: "group",
        activeIcon: "group",
      },
    ],
  },
  {
    id: "system",
    label: "System",
    icon: "tune",
    items: [
      {
        id: "flags",
        label: "Feature Flags",
        href: "/admin/flags",
        icon: "flag",
        activeIcon: "flag",
      },
      {
        id: "settings",
        label: "Settings",
        href: "/admin/settings",
        icon: "settings",
        activeIcon: "settings",
      },
      {
        id: "outbox",
        label: "Outbox",
        href: "/admin/outbox",
        icon: "outbox",
        activeIcon: "outbox",
      },
      {
        id: "audit",
        label: "Audit Log",
        href: "/admin/audit",
        icon: "history",
        activeIcon: "history",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Get active category ID from pathname
// ─────────────────────────────────────────────────────────────────────────────

function getActiveCategoryId(pathname: string | null): string | null {
  if (!pathname) return null;

  for (const category of NAV_DATA) {
    if (category.href && pathname.startsWith(category.href)) {
      return category.id;
    }
    if (category.items) {
      for (const item of category.items) {
        if (pathname.startsWith(item.href)) {
          return category.id;
        }
      }
    }
  }
  return NAV_DATA[0]?.id ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// AdminShell Content (uses sidebar context)
// ─────────────────────────────────────────────────────────────────────────────

interface AdminShellContentProps {
  children: React.ReactNode;
}

function AdminShellContent({ children }: AdminShellContentProps) {
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
    return NAV_DATA.find((cat) => cat.id === lookupId) ?? null;
  }, [effectiveItem, activeId]);

  return (
    <div className="flex w-full min-h-screen bg-surface isolate overflow-x-hidden">
      {/* Top App Bar (Mobile + Tablet) */}
      <TopAppBar
        className="fixed top-0 left-0 right-0 z-50 flex expanded:hidden"
        title={
          <span className="text-on-surface font-semibold">
            Admin Console
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
      <SidebarRail>
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
          {NAV_DATA.map((category) => (
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
          <RailUserMenu user={me} variant="admin" />
        </div>
      </SidebarRail>

      {/* Navigation Drawer */}
      <SidebarDrawer>
        {mobileOpen ? (
          // Mobile/Tablet: Show all categories with collapsible accordion
          <SidebarContent className="pt-20 pb-24">
            <SidebarGroupLabel>Admin Console</SidebarGroupLabel>
            <SidebarMenu>
              {NAV_DATA.map((category) => {
                const isActiveCategory = activeId === category.id;

                if (category.items && category.items.length > 0) {
                  return (
                    <SidebarCollapsibleGroup
                      key={category.id}
                      id={category.id}
                      label={category.label}
                      icon={category.icon}
                      childIds={category.items.map((item) => item.id)}
                      defaultOpen={isActiveCategory}
                    >
                      <SidebarMenu>
                        {category.items.map((item) => (
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
        ) : currentEffectiveItem && currentEffectiveItem.items && currentEffectiveItem.items.length > 0 ? (
          // Desktop (hover or expanded): Show active category's sub-items
          <SidebarContent className="pt-4 pb-4 animate-content-enter" key={currentEffectiveItem.id}>
            <SidebarGroupLabel>{currentEffectiveItem.label}</SidebarGroupLabel>
            <SidebarMenu>
              {currentEffectiveItem.items.map((item) => (
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
      <SidebarInset>
        {/* Admin Banner */}
        <AdminBanner />

        {/* Content Container */}
        <div className="px-4 py-4 medium:px-6 expanded:px-8 expanded:py-6 flex-1">
          {children}
        </div>
      </SidebarInset>

      {/* Backdrop */}
      <SidebarBackdrop />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AdminShell (with Provider)
// ─────────────────────────────────────────────────────────────────────────────

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const defaultActiveId = getActiveCategoryId(pathname);

  return (
    <SidebarProvider
      items={NAV_DATA}
      defaultActiveId={defaultActiveId}
      persist={true}
      storageKey="saaskit-admin-sidebar"
      railWidth={96}
      drawerWidth={220}
      mobileDrawerWidth={280}
    >
      <AdminShellContent>{children}</AdminShellContent>
    </SidebarProvider>
  );
}

export default AdminShell;
