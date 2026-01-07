"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/src/hooks/useSession";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter,
} from "@/src/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Home,
  Users,
  CreditCard,
  Settings,
  ChevronsUpDown,
  Plus,
  Command,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SidebarUserMenu } from "@/src/components/layout/SidebarUserMenu";
import { PERM } from "@/src/shared/rbac/permissions";
import type { Permission } from "@/src/shared/rbac/permissions";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  tooltip: string;
  perm?: Permission; // Optional permission check
};

type NavSection = {
  label: string;
  items: NavItem[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Navigation Configuration (data-driven)
// ─────────────────────────────────────────────────────────────────────────────

const getNavSections = (base: string): NavSection[] => [
  {
    label: "Product",
    items: [
      { label: "Home", href: `${base}/dashboard`, icon: Home, tooltip: "Home" },
      // ADD YOUR PRODUCT FEATURES HERE:
      // { label: "Projects", href: `${base}/projects`, icon: FolderKanban, tooltip: "Projects" },
    ],
  },
  {
    label: "Workspace",
    items: [
      {
        label: "Team",
        href: `${base}/team`,
        icon: Users,
        tooltip: "Team",
        perm: PERM.MEMBERS_READ,
      },
      {
        label: "Billing",
        href: `${base}/billing`,
        icon: CreditCard,
        tooltip: "Billing",
        perm: PERM.BILLING_READ,
      },
      {
        label: "Settings",
        href: `${base}/settings`,
        icon: Settings,
        tooltip: "Settings",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function TenantSidebar({
  slug,
  perms: permsProp,
}: {
  slug: string;
  perms?: string[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { me } = useSession();

  const perms = useMemo(
    () => new Set(permsProp ?? (me?.perms as string[] | undefined) ?? []),
    [permsProp, me?.perms]
  );

  const [wsOpen, setWsOpen] = useState(false);
  const base = `/w/${slug}`;

  const navSections = useMemo(() => getNavSections(base), [base]);

  const isActive = (href: string, exact?: boolean): boolean => {
    if (!pathname) return false;
    const normalizedPath = pathname.replace(/\/+$/, "");
    const normalizedHref = href.replace(/\/+$/, "");
    if (normalizedPath === normalizedHref) return true;
    if (exact) return false;
    return normalizedPath.startsWith(`${normalizedHref}/`);
  };

  const can = (perm?: Permission): boolean => {
    if (!perm) return true;
    return perms.has(perm);
  };

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="w-[--sidebar-width] min-w-[--sidebar-width]"
    >
      {/* Workspace Switcher Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu open={wsOpen} onOpenChange={setWsOpen}>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Command className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {me?.tenantName ?? me?.tenantSlug ?? "Workspace"}
                    </span>
                    <span className="truncate text-xs">
                      {me?.plan
                        ? me.plan.charAt(0).toUpperCase() + me.plan.slice(1)
                        : "Free"}{" "}
                      Plan
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                align="start"
                side="bottom"
                sideOffset={4}
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Workspaces
                </DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={`${base}/dashboard`} className="gap-2 p-2">
                    <div className="flex size-6 items-center justify-center rounded-sm border">
                      <Command className="size-4 shrink-0" />
                    </div>
                    {me?.tenantName ?? me?.tenantSlug ?? "Workspace"}
                    <DropdownMenuShortcut>⌘1</DropdownMenuShortcut>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/workspaces" className="gap-2 p-2">
                    <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                      <Plus className="size-4" />
                    </div>
                    <div className="font-medium text-muted-foreground">
                      Add workspace
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) =>
                  can(item.perm) ? (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.href)}
                        tooltip={item.tooltip}
                      >
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ) : null
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarUserMenu user={me} variant="tenant" basePath={base} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export default TenantSidebar;
