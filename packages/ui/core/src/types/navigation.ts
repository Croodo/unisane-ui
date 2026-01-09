import { ReactNode } from "react";

/**
 * Core navigation item structure.
 * Flexible and composable for any navigation pattern.
 */
export interface NavigationItem {
  /** Unique identifier */
  id: string;

  /** Display label */
  label: string;

  /** Icon (Material Symbol name or ReactNode) */
  icon?: string | ReactNode;

  /** Badge text or count */
  badge?: string | number;

  /** Navigation target */
  href?: string;

  /** Click handler (alternative to href) */
  onClick?: () => void;

  /** Nested items for hierarchical navigation */
  items?: NavigationItem[];

  /** Group identifier for auto-grouping */
  group?: string;

  /** Render as section header instead of link */
  isHeader?: boolean;

  /** Disabled state */
  disabled?: boolean;

  /** Hidden from rendering */
  hidden?: boolean;

  /** Open in new tab */
  external?: boolean;

  /** Custom metadata for rendering */
  meta?: Record<string, any>;
}

/**
 * Navigation group structure.
 * Organizes items into collapsible sections.
 */
export interface NavigationGroup {
  /** Unique identifier */
  id: string;

  /** Group label (optional) */
  label?: string;

  /** Items in this group */
  items: NavigationItem[];

  /** Allow collapse/expand */
  collapsible?: boolean;

  /** Initial open state */
  defaultOpen?: boolean;

  /** Show divider after group */
  showDivider?: boolean;
}

/**
 * Navigation state interface.
 * Returned by useNavigationState hook.
 */
export interface NavigationState {
  /** Currently active item ID */
  active: string | null;

  /** Set active item */
  setActive: (id: string | null) => void;

  /** Sidebar collapsed state */
  collapsed: boolean;

  /** Toggle collapsed state */
  setCollapsed: (collapsed: boolean) => void;

  /** Mobile drawer open state */
  open: boolean;

  /** Toggle mobile drawer */
  setOpen: (open: boolean) => void;
}

/**
 * Navigation hover state interface.
 * Implements the rail + drawer hover system from reference.
 */
export interface NavigationHoverState {
  /** Currently hovered item ID */
  hoveredItem: string | null;

  /** Currently active item ID */
  activeItem: string | null;

  /** Drawer is visible (hover or locked) */
  isDrawerVisible: boolean;

  /** Drawer is in push mode (locked) */
  isPushMode: boolean;

  /** Effective item for drawer content */
  effectiveItem: NavigationItem | null;

  /** Handle item hover enter */
  handleItemHover: (id: string) => void;

  /** Handle item click */
  handleItemClick: (id: string) => void;

  /** Handle rail mouse leave */
  handleRailLeave: () => void;

  /** Handle drawer mouse enter */
  handleDrawerEnter: () => void;

  /** Handle drawer mouse leave */
  handleDrawerLeave: () => void;
}

/**
 * Navigation hook configuration.
 */
export interface UseNavigationStateConfig {
  /** Initial active item */
  defaultActive?: string | null;

  /** Initial collapsed state */
  defaultCollapsed?: boolean;

  /** Persist state in localStorage */
  persistState?: boolean;

  /** LocalStorage key prefix */
  storageKey?: string;

  /** Callback when active changes */
  onActiveChange?: (id: string | null) => void;

  /** Callback when collapsed changes */
  onCollapsedChange?: (collapsed: boolean) => void;
}

/**
 * Navigation hover hook configuration.
 */
export interface UseNavigationHoverConfig {
  /** Navigation items */
  items: NavigationItem[];

  /** Currently active item */
  activeItem: string | null;

  /** Hover intent delay (ms) */
  hoverDelay?: number;

  /** Exit grace period (ms) */
  exitDelay?: number;

  /** Enable hover behavior */
  enabled?: boolean;

  /** Callback when item clicked */
  onItemClick?: (id: string) => void;
}

/**
 * Breakpoint detection result.
 */
export interface NavigationBreakpoint {
  /** Mobile view (< 768px) */
  isMobile: boolean;

  /** Tablet view (768-1024px) */
  isTablet: boolean;

  /** Desktop view (> 1024px) */
  isDesktop: boolean;

  /** Current breakpoint name */
  breakpoint: 'mobile' | 'tablet' | 'desktop';
}

/**
 * Navigation item processor result.
 */
export interface ProcessedNavigationItems {
  /** Flattened list of all items */
  flatItems: NavigationItem[];

  /** Items grouped by 'group' property */
  groupedItems: Map<string, NavigationItem[]>;

  /** Active item ancestry chain */
  activeChain: string[];

  /** Find item by ID */
  findItem: (id: string) => NavigationItem | undefined;

  /** Check if item has children */
  hasChildren: (id: string) => boolean;

  /** Get children of item */
  getChildren: (id: string) => NavigationItem[];
}

/**
 * Navigation variants.
 */
export type NavigationVariant = 'default' | 'compact' | 'comfortable';

/**
 * Navigation density presets.
 */
export type NavigationDensity = 'dense' | 'standard' | 'comfortable';

/**
 * Drawer modes.
 */
export type NavigationDrawerMode = 'overlay' | 'push' | 'inline';

/**
 * Drawer side.
 */
export type NavigationDrawerSide = 'left' | 'right';

/**
 * Navigation bar variants.
 */
export type NavigationBarVariant = 'default' | 'sticky' | 'floating' | 'bottom';

/**
 * Scroll behavior for sticky nav.
 */
export type NavigationScrollBehavior = 'always' | 'up' | 'down';
