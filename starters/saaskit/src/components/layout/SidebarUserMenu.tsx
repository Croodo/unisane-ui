"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@unisane/ui/components/sidebar";
import { Avatar } from "@unisane/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@unisane/ui/components/dropdown-menu";
import { Badge } from "@unisane/ui/components/badge";
import { Icon } from "@unisane/ui/primitives/icon";
import { cn } from "@unisane/ui/lib/utils";

type UserInfo = {
  displayName?: string | null | undefined;
  email?: string | null | undefined;
  imageUrl?: string | null | undefined;
  globalRole?: string | null | undefined;
  tenantSlug?: string | null | undefined;
};

type SidebarUserMenuProps = {
  user: UserInfo | null | undefined;
  variant?: "tenant" | "admin";
  /** Base path for account link (e.g., "/w/my-workspace") */
  basePath?: string;
  /** Custom links to show in the dropdown */
  links?: Array<{
    href: string;
    label: string;
    icon?: React.ReactNode;
  }>;
};

/**
 * Polished sidebar footer with theme toggle and user dropdown
 */
export function SidebarUserMenu({
  user,
  variant = "tenant",
  basePath,
  links = [],
}: SidebarUserMenuProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { expanded } = useSidebar();
  const isCollapsed = !expanded;
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const initials = React.useMemo(() => {
    const name = user?.displayName ?? user?.email ?? "U";
    return name.slice(0, 2).toUpperCase();
  }, [user]);

  const displayName = user?.displayName ?? "Account";
  const email = user?.email ?? "";
  const isAdmin = user?.globalRole === "super_admin";

  async function handleSignOut() {
    try {
      const { createApi } = await import("@/src/sdk");
      const api = await createApi();
      await api.auth.signOut();
    } catch {}
    try {
      localStorage.removeItem("tenantId");
      localStorage.removeItem("tenantSlug");
    } catch {}
    router.replace("/login");
    router.refresh();
  }

  const currentTheme = mounted ? theme : "system";

  return (
    <SidebarMenu>
      {/* Theme Toggle Row - Only visible when not collapsed */}
      {!isCollapsed && (
        <SidebarMenuItem>
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-label-small font-medium text-on-surface-variant">
              Theme
            </span>
            <div className="flex items-center gap-0.5 rounded-lg border border-outline-variant bg-surface-container-low p-0.5">
              <ThemeButton
                theme="light"
                currentTheme={currentTheme}
                onClick={() => setTheme("light")}
                icon={<Icon symbol="light_mode" size="xs" />}
              />
              <ThemeButton
                theme="system"
                currentTheme={currentTheme}
                onClick={() => setTheme("system")}
                icon={<Icon symbol="desktop_windows" size="xs" />}
              />
              <ThemeButton
                theme="dark"
                currentTheme={currentTheme}
                onClick={() => setTheme("dark")}
                icon={<Icon symbol="dark_mode" size="xs" />}
              />
            </div>
          </div>
        </SidebarMenuItem>
      )}

      {/* User Menu */}
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="bg-surface-container-low hover:bg-surface-container data-[state=open]:bg-surface-container-high data-[state=open]:text-on-surface"
            >
              <Avatar
                src={user?.imageUrl || undefined}
                alt={displayName}
                fallback={initials}
                className="h-8 w-8 rounded-full ring-2 ring-surface"
              />
              <div className="grid flex-1 text-left leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-body-medium font-semibold">{displayName}</span>
                  {isAdmin && (
                    <Badge
                      variant="tonal"
                      className="h-4 px-1 text-[10px] font-medium"
                    >
                      <Icon symbol="shield" size="xs" className="mr-0.5" />
                      Admin
                    </Badge>
                  )}
                </div>
                <span className="truncate text-label-small text-on-surface-variant">
                  {email}
                </span>
              </div>
              <Icon symbol="unfold_more" size="sm" className="ml-auto text-on-surface-variant" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-xl"
            align="end"
          >
            {/* User Header */}
            <div className="p-0 font-normal">
              <div className="flex items-center gap-3 px-3 py-3">
                <Avatar
                  src={user?.imageUrl || undefined}
                  alt={displayName}
                  fallback={initials}
                  className="h-10 w-10 rounded-full ring-2 ring-outline-variant"
                />
                <div className="grid flex-1 text-left leading-tight">
                  <span className="text-body-medium font-semibold">{displayName}</span>
                  <span className="text-label-small text-on-surface-variant">{email}</span>
                </div>
              </div>
            </div>
            <DropdownMenuSeparator />

            {/* Navigation Links */}
            {variant === "tenant" && basePath && (
              <>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link
                    href={`${basePath}/account`}
                    className="flex items-center gap-2"
                  >
                    <Icon symbol="person" size="sm" className="text-on-surface-variant" />
                    <span>My Account</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link
                    href={`${basePath}/settings`}
                    className="flex items-center gap-2"
                  >
                    <Icon symbol="settings" size="sm" className="text-on-surface-variant" />
                    <span>Workspace Settings</span>
                  </Link>
                </DropdownMenuItem>
              </>
            )}

            {/* Custom Links */}
            {links.map((link) => (
              <DropdownMenuItem
                key={link.href}
                asChild
                className="cursor-pointer"
              >
                <Link href={link.href} className="flex items-center gap-2">
                  {link.icon ?? (
                    <Icon symbol="star" size="sm" className="text-on-surface-variant" />
                  )}
                  <span>{link.label}</span>
                </Link>
              </DropdownMenuItem>
            ))}

            {/* Admin Quick Access for Super Admins */}
            {variant === "tenant" && isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link
                    href="/admin/overview"
                    className="flex items-center gap-2"
                  >
                    <Icon symbol="shield" size="sm" className="text-tertiary" />
                    <span>Admin Console</span>
                    <Badge variant="outlined" className="ml-auto text-[10px]">
                      Super
                    </Badge>
                  </Link>
                </DropdownMenuItem>
              </>
            )}

            {/* Workspace Switcher for Admin */}
            {variant === "admin" && user?.tenantSlug && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link
                    href={`/w/${user.tenantSlug}/dashboard`}
                    className="flex items-center gap-2"
                  >
                    <Icon symbol="apartment" size="sm" className="text-on-surface-variant" />
                    <span>Back to Workspace</span>
                  </Link>
                </DropdownMenuItem>
              </>
            )}

            {/* Theme Submenu (for collapsed sidebar or mobile) */}
            {isCollapsed && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center gap-2">
                    <Icon symbol="palette" size="sm" className="text-on-surface-variant" />
                    <span>Theme</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onClick={() => setTheme("light")}
                      className={cn("gap-2", currentTheme === "light" && "bg-surface-container")}
                    >
                      <Icon symbol="light_mode" size="sm" />
                      Light
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setTheme("system")}
                      className={cn("gap-2", currentTheme === "system" && "bg-surface-container")}
                    >
                      <Icon symbol="desktop_windows" size="sm" />
                      System
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setTheme("dark")}
                      className={cn("gap-2", currentTheme === "dark" && "bg-surface-container")}
                    >
                      <Icon symbol="dark_mode" size="sm" />
                      Dark
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer text-error focus:text-error"
            >
              <Icon symbol="logout" size="sm" className="mr-2" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/**
 * Theme toggle button for the segmented control
 */
function ThemeButton({
  theme,
  currentTheme,
  onClick,
  icon,
}: {
  theme: string;
  currentTheme: string | undefined;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  const isActive = currentTheme === theme;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-md transition-all",
        isActive
          ? "bg-surface text-on-surface shadow-sm"
          : "text-on-surface-variant hover:text-on-surface"
      )}
      title={theme.charAt(0).toUpperCase() + theme.slice(1)}
    >
      {icon}
    </button>
  );
}

export default SidebarUserMenu;
