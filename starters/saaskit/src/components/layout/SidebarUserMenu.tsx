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
} from "@/src/components/ui/sidebar";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/src/components/ui/dropdown-menu";
import { Badge } from "@/src/components/ui/badge";
import {
  ChevronsUpDown,
  LogOut,
  User,
  Settings,
  Moon,
  Sun,
  Monitor,
  Palette,
  Shield,
  Building2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/src/lib/utils";

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
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
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
            <span className="text-xs font-medium text-muted-foreground">
              Theme
            </span>
            <div className="flex items-center gap-0.5 rounded-md border bg-muted/50 p-0.5">
              <ThemeButton
                theme="light"
                currentTheme={currentTheme}
                onClick={() => setTheme("light")}
                icon={<Sun className="h-3 w-3" />}
              />
              <ThemeButton
                theme="system"
                currentTheme={currentTheme}
                onClick={() => setTheme("system")}
                icon={<Monitor className="h-3 w-3" />}
              />
              <ThemeButton
                theme="dark"
                currentTheme={currentTheme}
                onClick={() => setTheme("dark")}
                icon={<Moon className="h-3 w-3" />}
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
              className="bg-muted hover:bg-muted/80 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-full ring-2 ring-background">
                {user?.imageUrl && <AvatarImage src={user.imageUrl} />}
                <AvatarFallback className="rounded-full bg-gradient-to-br from-primary/80 to-primary text-primary-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-semibold">{displayName}</span>
                  {isAdmin && (
                    <Badge
                      variant="secondary"
                      className="h-4 px-1 text-[10px] font-medium"
                    >
                      <Shield className="mr-0.5 h-2.5 w-2.5" />
                      Admin
                    </Badge>
                  )}
                </div>
                <span className="truncate text-xs text-muted-foreground">
                  {email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-xl"
            side="top"
            align="end"
            sideOffset={8}
          >
            {/* User Header */}
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-3 py-3">
                <Avatar className="h-10 w-10 rounded-full ring-2 ring-muted">
                  {user?.imageUrl && <AvatarImage src={user.imageUrl} />}
                  <AvatarFallback className="rounded-full bg-gradient-to-br from-primary/80 to-primary text-primary-foreground font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="font-semibold">{displayName}</span>
                  <span className="text-xs text-muted-foreground">{email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Navigation Links */}
            {variant === "tenant" && basePath && (
              <>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link
                    href={`${basePath}/account`}
                    className="flex items-center gap-2"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>My Account</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link
                    href={`${basePath}/settings`}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
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
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
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
                    <Shield className="h-4 w-4 text-orange-500" />
                    <span>Admin Console</span>
                    <Badge variant="outline" className="ml-auto text-[10px]">
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
                    <Building2 className="h-4 w-4 text-muted-foreground" />
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
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <span>Theme</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={currentTheme ?? "system"}
                      onValueChange={setTheme}
                    >
                      <DropdownMenuRadioItem value="light" className="gap-2">
                        <Sun className="h-4 w-4" />
                        Light
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="system" className="gap-2">
                        <Monitor className="h-4 w-4" />
                        System
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="dark" className="gap-2">
                        <Moon className="h-4 w-4" />
                        Dark
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
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
        "flex h-6 w-6 items-center justify-center rounded-sm transition-all",
        isActive
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
      title={theme.charAt(0).toUpperCase() + theme.slice(1)}
    >
      {icon}
    </button>
  );
}

export default SidebarUserMenu;
