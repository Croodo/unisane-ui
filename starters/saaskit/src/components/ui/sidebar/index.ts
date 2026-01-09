export { SidebarProvider, useSidebar } from "./sidebar-context";
export type { SidebarState, SidebarProviderProps } from "./sidebar-context";

export {
  Sidebar,
  SidebarRail,
  SidebarRailItem,
  SidebarDrawer,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarNavItem,
  SidebarTrigger,
  SidebarBackdrop,
  SidebarInset,
  SidebarCollapsibleGroup,
} from "./sidebar";

export type {
  SidebarProps,
  SidebarRailProps,
  SidebarRailItemProps,
  SidebarDrawerProps,
  SidebarHeaderProps,
  SidebarFooterProps,
  SidebarContentProps,
  SidebarGroupProps,
  SidebarGroupLabelProps,
  SidebarMenuProps,
  SidebarMenuItemProps,
  SidebarMenuButtonProps,
  SidebarNavItemProps,
  SidebarTriggerProps,
  SidebarBackdropProps,
  SidebarInsetProps,
  SidebarCollapsibleGroupProps,
} from "./sidebar";

// Compatibility exports for shadcn-style sidebar API
export const SIDEBAR_WIDTH = "280px";
export const SIDEBAR_WIDTH_ICON = "72px";

// SidebarGroupContent is an alias for SidebarContent (shadcn pattern)
import { SidebarContent as _SidebarContent } from "./sidebar";
export { _SidebarContent as SidebarGroupContent };
