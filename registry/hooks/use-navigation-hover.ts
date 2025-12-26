import { useState, useRef, useCallback, useEffect } from "react";
import type {
  NavigationItem,
  NavigationHoverState,
  UseNavigationHoverConfig,
} from "../types/navigation";

/**
 * Navigation hover system hook.
 *
 * Implements sophisticated hover intent detection with:
 * - 150ms entry delay (prevents flickering)
 * - 300ms exit grace period (allows diagonal mouse movement)
 * - Lock/unlock on click
 * - Content persistence during animations
 *
 * This is the core of the rail + drawer navigation pattern.
 *
 * @example
 * ```tsx
 * const {
 *   hoveredItem,
 *   isDrawerVisible,
 *   isPushMode,
 *   handleItemHover,
 *   handleItemClick,
 *   handleDrawerEnter,
 *   handleDrawerLeave,
 * } = useNavigationHover({
 *   items: navItems,
 *   activeItem: 'home',
 * });
 *
 * <NavRail
 *   onItemHover={handleItemHover}
 *   onMouseLeave={handleRailLeave}
 * />
 *
 * <NavDrawer
 *   open={isDrawerVisible}
 *   onMouseEnter={handleDrawerEnter}
 *   onMouseLeave={handleDrawerLeave}
 * />
 * ```
 */
export function useNavigationHover(
  config: UseNavigationHoverConfig
): NavigationHoverState {
  const {
    items,
    activeItem,
    hoverDelay = 150,
    exitDelay = 300,
    enabled = true,
    onItemClick,
  } = config;

  // PERSISTENT STATE (User Clicked)
  const [activeItemId, setActiveItemId] = useState<string | null>(activeItem);
  const [isDrawerLocked, setIsDrawerLocked] = useState<boolean>(false);

  // TRANSIENT STATE (User Hover/Focus)
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  // VISUAL STATE (Content Persistence)
  // Keeps track of the last item that had content, so the drawer doesn't
  // appear empty while animating out.
  const [lastContentItemId, setLastContentItemId] = useState<string | null>(
    activeItem
  );

  // TIMEOUT REFS
  const entryTimeoutRef = useRef<number | null>(null);
  const exitTimeoutRef = useRef<number | null>(null);

  // Sync external active item
  useEffect(() => {
    setActiveItemId(activeItem);
  }, [activeItem]);

  // --- ACTIONS ---

  const handleItemClick = useCallback(
    (id: string) => {
      // 1. CLEAR TIMERS: Immediate action required, cancel any pending hover logic
      if (entryTimeoutRef.current) {
        clearTimeout(entryTimeoutRef.current);
        entryTimeoutRef.current = null;
      }
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }

      const item = items.find((i) => i.id === id);
      const itemHasChildren = item?.items && item.items.length > 0;

      if (activeItemId === id) {
        // Toggle lock if clicking the already active item (and it has children)
        if (itemHasChildren) {
          setIsDrawerLocked((prev) => !prev);
        } else {
          setIsDrawerLocked(false);
        }
      } else {
        // Navigate to new item
        setActiveItemId(id);

        // Auto-lock if the new item has children
        setIsDrawerLocked(!!itemHasChildren);
      }

      // Clear hover state instantly on click to let lock take over
      setHoveredItemId(null);

      // Call external handler
      onItemClick?.(id);
    },
    [items, activeItemId, onItemClick]
  );

  const handleItemHover = useCallback(
    (id: string) => {
      if (!enabled) return;

      // 1. Cancel any pending EXIT. If user moves from Rail -> Drawer -> Rail, keep it open.
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }

      // 2. Cancel any pending ENTRY for a different item.
      if (entryTimeoutRef.current) {
        clearTimeout(entryTimeoutRef.current);
        entryTimeoutRef.current = null;
      }

      // 3. HOVER INTENT: Wait before switching content.
      // This prevents flickering if the user just swipes across an icon.
      entryTimeoutRef.current = window.setTimeout(() => {
        setHoveredItemId(id);
      }, hoverDelay);
    },
    [enabled, hoverDelay]
  );

  const handleRailLeave = useCallback(() => {
    if (!enabled) return;

    // 1. Cancel pending ENTRY. If user leaves before delay, the hover never happened.
    if (entryTimeoutRef.current) {
      clearTimeout(entryTimeoutRef.current);
      entryTimeoutRef.current = null;
    }

    // 2. GRACE PERIOD: Wait before closing.
    // Allows diagonal movement from Rail to Drawer without it closing.
    exitTimeoutRef.current = window.setTimeout(() => {
      setHoveredItemId(null);
    }, exitDelay);
  }, [enabled, exitDelay]);

  const handleDrawerEnter = useCallback(() => {
    if (!enabled) return;

    // We are inside the safe zone. Cancel the exit timer.
    if (exitTimeoutRef.current) {
      clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = null;
    }

    // Also cancel any pending entry timers to be safe.
    if (entryTimeoutRef.current) {
      clearTimeout(entryTimeoutRef.current);
      entryTimeoutRef.current = null;
    }
  }, [enabled]);

  const handleDrawerLeave = useCallback(() => {
    if (!enabled) return;

    // Leaving the drawer is the same as leaving the rail -> start the exit timer.
    exitTimeoutRef.current = window.setTimeout(() => {
      setHoveredItemId(null);
    }, exitDelay);
  }, [enabled, exitDelay]);

  // --- DERIVED STATE & EFFECTS ---

  const activeItemObject = items.find((i) => i.id === activeItemId);
  const hoveredItemObject = hoveredItemId
    ? items.find((i) => i.id === hoveredItemId)
    : null;

  const hoverHasChildren = !!(
    hoveredItemObject?.items && hoveredItemObject.items.length > 0
  );

  // 1. Determine Target Item
  // If hovering a valid item with children, show it. Otherwise show active.
  let targetItem = activeItemObject;
  if (hoveredItemObject && hoverHasChildren) {
    targetItem = hoveredItemObject;
  }

  // 2. Persist Content Effect
  // Freezes the content state when closing so animation looks good.
  useEffect(() => {
    const targetHasChildren =
      targetItem?.items && targetItem.items.length > 0;
    if (targetHasChildren && targetItem) {
      setLastContentItemId(targetItem.id);
    }
  }, [targetItem]);

  // 3. Effective Item for Render
  const effectiveItem = items.find((i) => i.id === lastContentItemId) || null;

  // 4. Visibility Logic
  const isDrawerVisible =
    isDrawerLocked || (!!hoveredItemId && hoverHasChildren);

  // 5. Layout Mode
  const isPushMode = isDrawerLocked;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (entryTimeoutRef.current) clearTimeout(entryTimeoutRef.current);
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    };
  }, []);

  return {
    hoveredItem: hoveredItemId,
    activeItem: activeItemId,
    isDrawerVisible,
    isPushMode,
    effectiveItem,
    handleItemHover,
    handleItemClick,
    handleRailLeave,
    handleDrawerEnter,
    handleDrawerLeave,
  };
}
