import { useState, useRef, useCallback, useEffect } from "react";
import type {
  NavigationItem,
  NavigationHoverState,
  UseNavigationHoverConfig,
} from "../types/navigation";

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

  const [activeItemId, setActiveItemId] = useState<string | null>(activeItem);
  const [isDrawerLocked, setIsDrawerLocked] = useState<boolean>(false);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [lastContentItemId, setLastContentItemId] = useState<string | null>(
    activeItem
  );
  const entryTimeoutRef = useRef<number | null>(null);
  const exitTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setActiveItemId(activeItem);
  }, [activeItem]);

  const handleItemClick = useCallback(
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
      const itemHasChildren = item?.items && item.items.length > 0;

      if (activeItemId === id) {
        if (itemHasChildren) {
          setIsDrawerLocked((prev) => !prev);
        } else {
          setIsDrawerLocked(false);
        }
      } else {
        setActiveItemId(id);
        setIsDrawerLocked(!!itemHasChildren);
      }

      setHoveredItemId(null);
      onItemClick?.(id);
    },
    [items, activeItemId, onItemClick]
  );

  const handleItemHover = useCallback(
    (id: string) => {
      if (!enabled) return;

      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }

      if (entryTimeoutRef.current) {
        clearTimeout(entryTimeoutRef.current);
        entryTimeoutRef.current = null;
      }

      entryTimeoutRef.current = window.setTimeout(() => {
        setHoveredItemId(id);
      }, hoverDelay);
    },
    [enabled, hoverDelay]
  );

  const handleRailLeave = useCallback(() => {
    if (!enabled) return;

    if (entryTimeoutRef.current) {
      clearTimeout(entryTimeoutRef.current);
      entryTimeoutRef.current = null;
    }

    exitTimeoutRef.current = window.setTimeout(() => {
      setHoveredItemId(null);
    }, exitDelay);
  }, [enabled, exitDelay]);

  const handleDrawerEnter = useCallback(() => {
    if (!enabled) return;

    if (exitTimeoutRef.current) {
      clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = null;
    }

    if (entryTimeoutRef.current) {
      clearTimeout(entryTimeoutRef.current);
      entryTimeoutRef.current = null;
    }
  }, [enabled]);

  const handleDrawerLeave = useCallback(() => {
    if (!enabled) return;

    exitTimeoutRef.current = window.setTimeout(() => {
      setHoveredItemId(null);
    }, exitDelay);
  }, [enabled, exitDelay]);

  const activeItemObject = items.find((i) => i.id === activeItemId);
  const hoveredItemObject = hoveredItemId
    ? items.find((i) => i.id === hoveredItemId)
    : null;

  const hoverHasChildren = !!(
    hoveredItemObject?.items && hoveredItemObject.items.length > 0
  );

  let targetItem = activeItemObject;
  if (hoveredItemObject && hoverHasChildren) {
    targetItem = hoveredItemObject;
  }

  useEffect(() => {
    const targetHasChildren =
      targetItem?.items && targetItem.items.length > 0;
    if (targetHasChildren && targetItem) {
      setLastContentItemId(targetItem.id);
    }
  }, [targetItem]);

  const effectiveItem = items.find((i) => i.id === lastContentItemId) || null;

  const isDrawerVisible =
    isDrawerLocked || (!!hoveredItemId && hoverHasChildren);

  const isPushMode = isDrawerLocked;

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
