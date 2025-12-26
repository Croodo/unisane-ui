"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import type { NavigationItem } from "../../types/navigation";

// ============================================================================
// Types
// ============================================================================

export interface SidebarState {
  /** Currently active item ID */
  activeId: string | null;
  /** Set active item */
  setActiveId: (id: string | null) => void;
  /** Sidebar is expanded (drawer locked open) */
  expanded: boolean;
  /** Set expanded state */
  setExpanded: (expanded: boolean) => void;
  /** Toggle expanded state */
  toggleExpanded: () => void;
  /** Mobile menu is open */
  mobileOpen: boolean;
  /** Set mobile menu open state */
  setMobileOpen: (open: boolean) => void;
  /** Toggle mobile menu */
  toggleMobile: () => void;
  /** Currently hovered item ID */
  hoveredId: string | null;
  /** Drawer is visible (via hover or expanded) */
  isDrawerVisible: boolean;
  /** Effective item for drawer content */
  effectiveItem: NavigationItem | null;
  /** Handle item hover */
  handleHover: (id: string) => void;
  /** Handle item click */
  handleClick: (id: string) => void;
  /** Handle rail mouse leave */
  handleRailLeave: () => void;
  /** Handle drawer mouse enter */
  handleDrawerEnter: () => void;
  /** Handle drawer mouse leave */
  handleDrawerLeave: () => void;
  /** Navigation items */
  items: NavigationItem[];
  /** Current breakpoint */
  isMobile: boolean;
  isDesktop: boolean;
  /** Rail width in pixels */
  railWidth: number;
  /** Drawer width in pixels */
  drawerWidth: number;
  /** Content margin based on state */
  contentMargin: number;
}

export interface SidebarProviderProps {
  children: React.ReactNode;
  /** Navigation items */
  items?: NavigationItem[];
  /** Initial active item */
  defaultActiveId?: string | null;
  /** Initial expanded state */
  defaultExpanded?: boolean;
  /** Persist state to localStorage */
  persist?: boolean;
  /** Storage key for persistence */
  storageKey?: string;
  /** Hover delay in ms */
  hoverDelay?: number;
  /** Exit delay in ms */
  exitDelay?: number;
  /** Rail width in pixels (default: 96) */
  railWidth?: number;
  /** Drawer width in pixels (default: 220) */
  drawerWidth?: number;
  /** Callback when active changes */
  onActiveChange?: (id: string | null) => void;
  /** Callback when expanded changes */
  onExpandedChange?: (expanded: boolean) => void;
}

// ============================================================================
// Context
// ============================================================================

const SidebarContext = createContext<SidebarState | null>(null);

export function useSidebar(): SidebarState {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

// ============================================================================
// Provider
// ============================================================================

export function SidebarProvider({
  children,
  items = [],
  defaultActiveId = null,
  defaultExpanded = false,
  persist = false,
  storageKey = "unisane-sidebar",
  hoverDelay = 150,
  exitDelay = 300,
  railWidth = 96,
  drawerWidth = 220,
  onActiveChange,
  onExpandedChange,
}: SidebarProviderProps) {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  const [activeId, setActiveIdState] = useState<string | null>(defaultActiveId);
  const [expanded, setExpandedState] = useState<boolean>(defaultExpanded);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [lastContentId, setLastContentId] = useState<string | null>(defaultActiveId);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage after mount (to avoid SSR mismatch)
  useEffect(() => {
    if (!persist) {
      setIsHydrated(true);
      return;
    }

    try {
      const storedActive = localStorage.getItem(`${storageKey}-active`);
      const storedExpanded = localStorage.getItem(`${storageKey}-expanded`);

      if (storedActive) {
        const parsedActive = JSON.parse(storedActive);
        setActiveIdState(parsedActive);
        setLastContentId(parsedActive);
      }
      if (storedExpanded) {
        setExpandedState(JSON.parse(storedExpanded));
      }
    } catch {}

    setIsHydrated(true);
  }, [persist, storageKey]);

  // Breakpoint detection
  const [isMobile, setIsMobile] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  // Hover timers
  const entryTimeoutRef = useRef<number | null>(null);
  const exitTimeoutRef = useRef<number | null>(null);

  // -------------------------------------------------------------------------
  // Effects
  // -------------------------------------------------------------------------

  // Sync activeId when defaultActiveId prop changes (e.g., route changes)
  useEffect(() => {
    if (defaultActiveId && defaultActiveId !== activeId) {
      setActiveIdState(defaultActiveId);
      setLastContentId(defaultActiveId);
      // Expand if the new active item has children
      const item = items.find((i) => i.id === defaultActiveId);
      if (item?.items && item.items.length > 0) {
        setExpandedState(true);
      }
    }
  }, [defaultActiveId, items]);

  // Breakpoint detection
  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsDesktop(width >= 768);
    };
    updateBreakpoint();
    window.addEventListener("resize", updateBreakpoint);
    return () => window.removeEventListener("resize", updateBreakpoint);
  }, []);

  // Persist state
  useEffect(() => {
    if (!persist || typeof window === "undefined") return;
    try {
      localStorage.setItem(`${storageKey}-active`, JSON.stringify(activeId));
    } catch {}
  }, [activeId, persist, storageKey]);

  useEffect(() => {
    if (!persist || typeof window === "undefined") return;
    try {
      localStorage.setItem(`${storageKey}-expanded`, JSON.stringify(expanded));
    } catch {}
  }, [expanded, persist, storageKey]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (entryTimeoutRef.current) clearTimeout(entryTimeoutRef.current);
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    };
  }, []);

  // -------------------------------------------------------------------------
  // Callbacks
  // -------------------------------------------------------------------------

  const setActiveId = useCallback(
    (id: string | null) => {
      setActiveIdState(id);
      onActiveChange?.(id);
    },
    [onActiveChange]
  );

  const setExpanded = useCallback(
    (value: boolean) => {
      setExpandedState(value);
      onExpandedChange?.(value);
    },
    [onExpandedChange]
  );

  const toggleExpanded = useCallback(() => {
    setExpanded(!expanded);
  }, [expanded, setExpanded]);

  const toggleMobile = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const handleClick = useCallback(
    (id: string) => {
      // Clear timers
      if (entryTimeoutRef.current) {
        clearTimeout(entryTimeoutRef.current);
        entryTimeoutRef.current = null;
      }
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }

      const item = items.find((i) => i.id === id);
      const hasChildren = item?.items && item.items.length > 0;

      // Check if drawer is currently visible (via expanded OR hover)
      const wasDrawerVisible = expanded || !!hoveredId;

      // Clear hover state
      setHoveredId(null);

      if (activeId === id) {
        // Clicking same item - toggle expanded if it has children
        if (hasChildren) {
          setExpanded(!expanded);
        } else {
          setExpanded(false);
        }
      } else {
        // Switching to a different item
        setActiveId(id);

        if (hasChildren) {
          // Update lastContentId immediately to prevent content flash
          setLastContentId(id);

          // If drawer was visible (via expanded or hover), lock it open
          // This prevents the close/open flicker when switching items
          if (wasDrawerVisible) {
            // Ensure expanded is true so drawer stays visible after hover clears
            if (!expanded) {
              setExpanded(true);
            }
            // If already expanded, it stays expanded - no state change needed
          } else {
            // Drawer wasn't visible, expand it
            setExpanded(true);
          }
        } else {
          // New item has no children, collapse
          setExpanded(false);
        }
      }
    },
    [items, activeId, expanded, hoveredId, setActiveId, setExpanded]
  );

  const handleHover = useCallback(
    (id: string) => {
      if (isMobile) return;

      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }

      if (entryTimeoutRef.current) {
        clearTimeout(entryTimeoutRef.current);
        entryTimeoutRef.current = null;
      }

      entryTimeoutRef.current = window.setTimeout(() => {
        setHoveredId(id);
      }, hoverDelay);
    },
    [isMobile, hoverDelay]
  );

  const handleRailLeave = useCallback(() => {
    if (isMobile) return;

    if (entryTimeoutRef.current) {
      clearTimeout(entryTimeoutRef.current);
      entryTimeoutRef.current = null;
    }

    exitTimeoutRef.current = window.setTimeout(() => {
      setHoveredId(null);
    }, exitDelay);
  }, [isMobile, exitDelay]);

  const handleDrawerEnter = useCallback(() => {
    if (isMobile) return;

    if (exitTimeoutRef.current) {
      clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = null;
    }

    if (entryTimeoutRef.current) {
      clearTimeout(entryTimeoutRef.current);
      entryTimeoutRef.current = null;
    }
  }, [isMobile]);

  const handleDrawerLeave = useCallback(() => {
    if (isMobile) return;

    exitTimeoutRef.current = window.setTimeout(() => {
      setHoveredId(null);
    }, exitDelay);
  }, [isMobile, exitDelay]);

  // -------------------------------------------------------------------------
  // Derived State
  // -------------------------------------------------------------------------

  const activeItem = items.find((i) => i.id === activeId);
  const hoveredItem = hoveredId ? items.find((i) => i.id === hoveredId) : null;
  const hoverHasChildren = !!(hoveredItem?.items && hoveredItem.items.length > 0);

  // Determine effective item for drawer content
  let targetItem = activeItem;
  if (hoveredItem && hoverHasChildren) {
    targetItem = hoveredItem;
  }

  // Update last content ID when target changes
  useEffect(() => {
    if (targetItem?.items && targetItem.items.length > 0) {
      setLastContentId(targetItem.id);
    }
  }, [targetItem]);

  const effectiveItem = items.find((i) => i.id === lastContentId) || null;

  // Drawer visibility
  const isDrawerVisible = expanded || (!!hoveredId && hoverHasChildren);

  // Content margin calculation
  const contentMargin = isDesktop
    ? expanded
      ? railWidth + drawerWidth
      : railWidth
    : 0;

  // -------------------------------------------------------------------------
  // Context Value
  // -------------------------------------------------------------------------

  const value: SidebarState = {
    activeId,
    setActiveId,
    expanded,
    setExpanded,
    toggleExpanded,
    mobileOpen,
    setMobileOpen,
    toggleMobile,
    hoveredId,
    isDrawerVisible,
    effectiveItem,
    handleHover,
    handleClick,
    handleRailLeave,
    handleDrawerEnter,
    handleDrawerLeave,
    items,
    isMobile,
    isDesktop,
    railWidth,
    drawerWidth,
    contentMargin,
  };

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}
