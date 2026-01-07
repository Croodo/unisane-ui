"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Home,
  Users,
  Server,
  Building2,
  Inbox,
  Flag,
  Activity,
  SlidersHorizontal,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import { SidebarUserMenu } from "@/src/components/layout/SidebarUserMenu";
import { useSession } from "@/src/hooks/useSession";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  tooltip: string;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Navigation Configuration (data-driven)
// ─────────────────────────────────────────────────────────────────────────────

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Platform",
    items: [
      {
        label: "Overview",
        href: "/admin/overview",
        icon: Home,
        tooltip: "Overview",
      },
      {
        label: "Health",
        href: "/admin/health",
        icon: Server,
        tooltip: "Health",
      },
    ],
  },
  {
    label: "Management",
    items: [
      {
        label: "Tenants",
        href: "/admin/tenants",
        icon: Building2,
        tooltip: "Tenants",
      },
      { label: "Users", href: "/admin/users", icon: Users, tooltip: "Users" },
    ],
  },
  {
    label: "System",
    items: [
      {
        label: "Feature Flags",
        href: "/admin/flags",
        icon: Flag,
        tooltip: "Feature Flags",
      },
      {
        label: "Settings",
        href: "/admin/settings",
        icon: SlidersHorizontal,
        tooltip: "Platform Settings",
      },
      {
        label: "Outbox",
        href: "/admin/outbox",
        icon: Inbox,
        tooltip: "Outbox",
      },
      {
        label: "Audit Log",
        href: "/admin/audit",
        icon: ScrollText,
        tooltip: "Audit Log",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminSidebar() {
  const pathname = usePathname();
  const { me } = useSession();

  const isActive = useMemo(() => {
    return (href: string, exact?: boolean): boolean => {
      if (!pathname) return false;
      const normalizedPath = pathname.replace(/\/+$/, "");
      const normalizedHref = href.replace(/\/+$/, "");
      if (normalizedPath === normalizedHref) return true;
      if (exact) return false;
      return normalizedPath.startsWith(`${normalizedHref}/`);
    };
  }, [pathname]);

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="w-[--sidebar-width] min-w-[--sidebar-width]"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Activity className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Admin Console</span>
                <span className="truncate text-xs">Platform Management</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV_SECTIONS.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
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
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarUserMenu user={me} variant="admin" />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
