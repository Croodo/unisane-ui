export { Nav } from "./nav";
export type { NavProps } from "./nav";

export { NavItem } from "./nav-item";
export type { NavItemProps } from "./nav-item";

export { NavGroup } from "./nav-group";
export type { NavGroupProps } from "./nav-group";

export { useNavigationState } from "@/src/hooks/use-navigation-state";
export { useNavigationHover } from "@/src/hooks/use-navigation-hover";
export { useNavigationItems } from "@/src/hooks/use-navigation-items";
export { useNavigationBreakpoint } from "@/src/hooks/use-navigation-breakpoint";

export type {
  NavigationItem,
  NavigationGroup,
  NavigationState,
  NavigationHoverState,
  UseNavigationStateConfig,
  UseNavigationHoverConfig,
  ProcessedNavigationItems,
  NavigationBreakpoint,
  NavigationVariant,
  NavigationDensity,
  NavigationDrawerMode,
  NavigationDrawerSide,
  NavigationBarVariant,
  NavigationScrollBehavior,
} from "@/src/types/navigation";
