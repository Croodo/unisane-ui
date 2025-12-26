import { useState, useEffect, useCallback } from "react";
import type {
  NavigationState,
  UseNavigationStateConfig,
} from "../types/navigation";

/**
 * Navigation state management hook.
 *
 * Manages active item, collapsed state, and mobile drawer state
 * with optional localStorage persistence.
 *
 * @example
 * ```tsx
 * const nav = useNavigationState({
 *   defaultActive: 'home',
 *   persistState: true,
 * });
 *
 * <NavItem
 *   active={nav.active === 'dashboard'}
 *   onClick={() => nav.setActive('dashboard')}
 * />
 * ```
 */
export function useNavigationState(
  config: UseNavigationStateConfig = {}
): NavigationState {
  const {
    defaultActive = null,
    defaultCollapsed = false,
    persistState = false,
    storageKey = "unisane-navigation",
    onActiveChange,
    onCollapsedChange,
  } = config;

  // Initialize state from localStorage if persistence enabled
  const getInitialState = useCallback(() => {
    if (!persistState || typeof window === "undefined") {
      return {
        active: defaultActive,
        collapsed: defaultCollapsed,
      };
    }

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          active: parsed.active ?? defaultActive,
          collapsed: parsed.collapsed ?? defaultCollapsed,
        };
      }
    } catch (error) {
      console.warn("Failed to parse navigation state from localStorage:", error);
    }

    return {
      active: defaultActive,
      collapsed: defaultCollapsed,
    };
  }, [persistState, storageKey, defaultActive, defaultCollapsed]);

  const [active, setActiveState] = useState<string | null>(
    () => getInitialState().active
  );
  const [collapsed, setCollapsedState] = useState<boolean>(
    () => getInitialState().collapsed
  );
  const [open, setOpenState] = useState<boolean>(false);

  // Persist to localStorage when state changes
  useEffect(() => {
    if (!persistState || typeof window === "undefined") return;

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ active, collapsed })
      );
    } catch (error) {
      console.warn("Failed to persist navigation state to localStorage:", error);
    }
  }, [active, collapsed, persistState, storageKey]);

  // Wrapped setters with callbacks
  const setActive = useCallback(
    (id: string | null) => {
      setActiveState(id);
      onActiveChange?.(id);
    },
    [onActiveChange]
  );

  const setCollapsed = useCallback(
    (value: boolean) => {
      setCollapsedState(value);
      onCollapsedChange?.(value);
    },
    [onCollapsedChange]
  );

  const setOpen = useCallback((value: boolean) => {
    setOpenState(value);
  }, []);

  return {
    active,
    setActive,
    collapsed,
    setCollapsed,
    open,
    setOpen,
  };
}
