"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import { Avatar } from "@unisane/ui/components/avatar";
import { Badge } from "@unisane/ui/components/badge";
import { Icon } from "@unisane/ui/primitives/icon";
import { IconButton } from "@unisane/ui/components/icon-button";
import { useTheme } from "@unisane/ui/layout/theme-provider";

type UserInfo = {
  displayName?: string | null | undefined;
  email?: string | null | undefined;
  imageUrl?: string | null | undefined;
  globalRole?: string | null | undefined;
  tenantSlug?: string | null | undefined;
};

type RailUserMenuProps = {
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
 * User menu for the sidebar rail - shows avatar icon that opens dropdown
 */
export function RailUserMenu({
  user,
  variant = "tenant",
  basePath,
  links = [],
}: RailUserMenuProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton variant="standard" ariaLabel="Account menu">
          {user?.imageUrl ? (
            <Avatar src={user.imageUrl} fallback={initials} size="sm" />
          ) : (
            <Icon>account_circle</Icon>
          )}
        </IconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-64"
        side="right"
        align="end"
        sideOffset={8}
        avoidCollisions={true}
        collisionPadding={16}
      >
        {/* User Header */}
        <div className="p-0 font-normal">
          <div className="flex items-center gap-3 px-3 py-3">
            <Avatar src={user?.imageUrl || undefined} fallback={initials} />
            <div className="grid flex-1 text-left leading-tight">
              <span className="font-semibold text-on-surface">{displayName}</span>
              <span className="text-xs text-on-surface-variant">{email}</span>
            </div>
          </div>
        </div>
        <DropdownMenuSeparator />

        {/* Navigation Links for Tenant */}
        {variant === "tenant" && basePath && (
          <>
            <DropdownMenuItem
              icon={<Icon size="sm" className="text-on-surface-variant">person</Icon>}
              href={`${basePath}/account`}
            >
              My Account
            </DropdownMenuItem>
            <DropdownMenuItem
              icon={<Icon size="sm" className="text-on-surface-variant">settings</Icon>}
              href={`${basePath}/settings`}
            >
              Workspace Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Custom Links */}
        {links.length > 0 && (
          <>
            {links.map((link) => (
              <DropdownMenuItem
                key={link.href}
                icon={link.icon ?? <Icon size="sm" className="text-on-surface-variant">star</Icon>}
                href={link.href}
              >
                {link.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Admin Quick Access for Super Admins (when in tenant mode) */}
        {variant === "tenant" && isAdmin && (
          <>
            <DropdownMenuItem
              icon={<Icon size="sm" className="text-error">admin_panel_settings</Icon>}
              trailingIcon={
                <Badge variant="outlined" className="text-[10px] h-5">
                  Super
                </Badge>
              }
              href="/admin/overview"
            >
              Admin Console
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Back to Workspace (when in admin mode) */}
        {variant === "admin" && user?.tenantSlug && (
          <>
            <DropdownMenuItem
              icon={<Icon size="sm" className="text-on-surface-variant">domain</Icon>}
              href={`/w/${user.tenantSlug}/dashboard`}
            >
              Back to Workspace
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Theme Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger
            icon={<Icon size="sm" className="text-on-surface-variant">palette</Icon>}
          >
            Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem
              icon={<Icon size="sm">light_mode</Icon>}
              onClick={() => setTheme("light")}
              selected={currentTheme === "light"}
            >
              Light
            </DropdownMenuItem>
            <DropdownMenuItem
              icon={<Icon size="sm">desktop_windows</Icon>}
              onClick={() => setTheme("system")}
              selected={currentTheme === "system"}
            >
              System
            </DropdownMenuItem>
            <DropdownMenuItem
              icon={<Icon size="sm">dark_mode</Icon>}
              onClick={() => setTheme("dark")}
              selected={currentTheme === "dark"}
            >
              Dark
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          icon={<Icon size="sm" className="text-error">logout</Icon>}
          onClick={handleSignOut}
          className="text-error"
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default RailUserMenu;
