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

export interface SidebarState {
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  toggleExpanded: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  toggleMobile: () => void;
  hoveredId: string | null;
  isDrawerVisible: boolean;
  effectiveItem: NavigationItem | null;
  handleHover: (id: string) => void;
  handleClick: (id: string) => void;
  handleRailLeave: () => void;
  handleDrawerEnter: () => void;
  handleDrawerLeave: () => void;
  items: NavigationItem[];
  isMobile: boolean;
  isDesktop: boolean;
  railWidth: number;
  drawerWidth: number;
  mobileDrawerWidth: number;
  contentMargin: number;
  hasActiveChild: (parentId: string, childIds: string[]) => boolean;
  expandedGroups: Set<string>;
  setGroupExpanded: (groupId: string, expanded: boolean) => void;
  toggleGroup: (groupId: string) => void;
  isGroupExpanded: (groupId: string, childIds?: string[]) => boolean;
}

export interface SidebarProviderProps {
  children: React.ReactNode;
  items?: NavigationItem[];
  defaultActiveId?: string | null;
  defaultExpanded?: boolean;
  persist?: boolean;
  storageKey?: string;
  hoverDelay?: number;
  exitDelay?: number;
  railWidth?: number;
  drawerWidth?: number;
  mobileDrawerWidth?: number;
  onActiveChange?: (id: string | null) => void;
  onExpandedChange?: (expanded: boolean) => void;
}

const SidebarContext = createContext<SidebarState | null>(null);

export function useSidebar(): SidebarState {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

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
  mobileDrawerWidth = 280,
  onActiveChange,
  onExpandedChange,
}: SidebarProviderProps) {
  const [activeId, setActiveIdState] = useState<string | null>(defaultActiveId);
  const [expanded, setExpandedState] = useState<boolean>(defaultExpanded);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [lastContentId, setLastContentId] = useState<string | null>(defaultActiveId);
  const [isHydrated, setIsHydrated] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!persist) {
      setIsHydrated(true);
      return;
    }

    try {
      const storedActive = localStorage.getItem(`${storageKey}-active`);
      const storedExpanded = localStorage.getItem(`${storageKey}-expanded`);
      const storedGroups = localStorage.getItem(`${storageKey}-groups`);

      if (storedActive) {
        const parsedActive = JSON.parse(storedActive);
        setActiveIdState(parsedActive);
        setLastContentId(parsedActive);
      }
      if (storedExpanded) {
        setExpandedState(JSON.parse(storedExpanded));
      }
      if (storedGroups) {
        const parsedGroups = JSON.parse(storedGroups);
        setExpandedGroups(new Set(parsedGroups));
      }
    } catch {}

    setIsHydrated(true);
  }, [persist, storageKey]);

  const [isMobile, setIsMobile] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  const entryTimeoutRef = useRef<number | null>(null);
  const exitTimeoutRef = useRef<number | null>(null);

  const prevDefaultActiveIdRef = useRef(defaultActiveId);
  useEffect(() => {
    if (defaultActiveId !== prevDefaultActiveIdRef.current) {
      prevDefaultActiveIdRef.current = defaultActiveId;
      if (defaultActiveId) {
        setActiveIdState(defaultActiveId);
        setLastContentId(defaultActiveId);
        const item = items.find((i) => i.id === defaultActiveId);
        if (item?.items && item.items.length > 0) {
          setExpandedState(true);
        }
      }
    }
  }, [defaultActiveId, items]);

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      setIsMobile(width < 600);
      setIsDesktop(width >= 600);
    };
    updateBreakpoint();
    window.addEventListener("resize", updateBreakpoint);
    return () => window.removeEventListener("resize", updateBreakpoint);
  }, []);

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

  useEffect(() => {
    if (!persist || typeof window === "undefined") return;
    try {
      localStorage.setItem(`${storageKey}-groups`, JSON.stringify(Array.from(expandedGroups)));
    } catch {}
  }, [expandedGroups, persist, storageKey]);

  useEffect(() => {
    return () => {
      if (entryTimeoutRef.current) clearTimeout(entryTimeoutRef.current);
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    };
  }, []);

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
      const wasDrawerVisible = expanded || !!hoveredId;

      setHoveredId(null);

      if (activeId === id) {
        if (hasChildren) {
          setExpanded(!expanded);
        } else {
          setExpanded(false);
        }
      } else {
        setActiveId(id);

        if (hasChildren) {
          setLastContentId(id);

          if (wasDrawerVisible) {
            if (!expanded) {
              setExpanded(true);
            }
          } else {
            setExpanded(true);
          }
        } else {
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

  const hasActiveChild = useCallback(
    (parentId: string, childIds: string[]): boolean => {
      if (!activeId) return false;
      return childIds.includes(activeId);
    },
    [activeId]
  );

  const setGroupExpanded = useCallback((groupId: string, isExpanded: boolean) => {
    if (isExpanded) {
      setExpandedGroups((prev) => new Set(prev).add(groupId));
      setCollapsedGroups((prev) => {
        const next = new Set(prev);
        next.delete(groupId);
        return next;
      });
    } else {
      setExpandedGroups((prev) => {
        const next = new Set(prev);
        next.delete(groupId);
        return next;
      });
      setCollapsedGroups((prev) => new Set(prev).add(groupId));
    }
  }, []);

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
        setCollapsedGroups((collapsed) => new Set(collapsed).add(groupId));
      } else {
        next.add(groupId);
        setCollapsedGroups((collapsed) => {
          const newCollapsed = new Set(collapsed);
          newCollapsed.delete(groupId);
          return newCollapsed;
        });
      }
      return next;
    });
  }, []);

  const isGroupExpanded = useCallback(
    (groupId: string, childIds?: string[]): boolean => {
      if (collapsedGroups.has(groupId)) return false;
      if (expandedGroups.has(groupId)) return true;
      if (childIds && activeId && childIds.includes(activeId)) return true;
      return false;
    },
    [expandedGroups, collapsedGroups, activeId]
  );

  const activeItem = items.find((i) => i.id === activeId);
  const hoveredItem = hoveredId ? items.find((i) => i.id === hoveredId) : null;
  const hoverHasChildren = !!(hoveredItem?.items && hoveredItem.items.length > 0);

  let targetItem = activeItem;
  if (hoveredItem && hoverHasChildren) {
    targetItem = hoveredItem;
  }

  useEffect(() => {
    if (targetItem?.items && targetItem.items.length > 0) {
      setLastContentId(targetItem.id);
    }
  }, [targetItem]);

  const effectiveItem = items.find((i) => i.id === lastContentId) || null;
  const isDrawerVisible = expanded || (!!hoveredId && hoverHasChildren);
  const contentMargin = isDesktop
    ? expanded
      ? railWidth + drawerWidth
      : railWidth
    : 0;

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
    mobileDrawerWidth,
    contentMargin,
    hasActiveChild,
    expandedGroups,
    setGroupExpanded,
    toggleGroup,
    isGroupExpanded,
  };

  if (persist && !isHydrated) {
    return null;
  }

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}
