"use client";

import { create } from "zustand";
import type { ReactNode } from "react";

// ============================================================================
// Types
// ============================================================================

/**
 * Navigation configuration for list item traversal
 */
export type AsidePanelNavigation = {
  /** Handler for previous item */
  onPrev?: () => void;
  /** Handler for next item */
  onNext?: () => void;
  /** Whether previous navigation is available */
  canPrev?: boolean;
  /** Whether next navigation is available */
  canNext?: boolean;
  /** Current item index (0-based) */
  currentIndex?: number;
  /** Total number of items */
  totalCount?: number;
};

/**
 * Aside panel content configuration
 */
export type AsidePanelContent = {
  /** Unique key to identify the content (prevents duplicate renders) */
  key: string;
  /** Panel title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Panel content renderer */
  content: ReactNode;
  /** Width variant */
  width?: "sm" | "md" | "lg" | "xl";
  /** Which side to show the panel */
  side?: "left" | "right";
  /** Show overlay backdrop */
  overlay?: boolean;
  /** Navigation callbacks (for prev/next in lists) */
  navigation?: AsidePanelNavigation;
  /** Custom header actions */
  headerActions?: ReactNode;
  /** Footer content */
  footer?: ReactNode;
  /** Whether to prevent closing on overlay click */
  preventClose?: boolean;
  /** Callback when panel is closed */
  onClose?: () => void;
};

/**
 * Aside panel state
 */
export type AsidePanelState = {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Current panel content */
  content: AsidePanelContent | null;
  /** Open panel with content */
  open: (content: AsidePanelContent) => void;
  /** Close the panel */
  close: () => void;
  /** Update content (for navigation or dynamic updates) */
  update: (content: Partial<AsidePanelContent>) => void;
  /** Toggle panel visibility */
  toggle: () => void;
  /** Replace content without closing (smooth transition) */
  replace: (content: AsidePanelContent) => void;
};

// ============================================================================
// Constants
// ============================================================================

/**
 * Width classes for each size variant
 */
export const ASIDE_PANEL_WIDTH_CLASSES = {
  sm: "w-80", // 320px
  md: "w-96", // 384px
  lg: "w-[480px]", // 480px
  xl: "w-[600px]", // 600px
} as const;

// ============================================================================
// Zustand Store
// ============================================================================

/**
 * Global Zustand store for the aside panel.
 *
 * Enhanced version of useDetailPanel with additional features:
 * - Left or right positioning
 * - Overlay mode
 * - Multiple width variants
 * - Header actions
 * - Footer content
 * - Replace content without closing
 *
 * @example
 * ```tsx
 * const { open, close } = useAsidePanel();
 *
 * // Open panel
 * open({
 *   key: `user-${user.id}`,
 *   title: user.name,
 *   subtitle: user.email,
 *   content: <UserDetails user={user} />,
 *   width: 'md',
 *   side: 'right',
 * });
 *
 * // Close panel
 * close();
 * ```
 */
export const useAsidePanel = create<AsidePanelState>((set, get) => ({
  isOpen: false,
  content: null,

  open: (content) => {
    set({ isOpen: true, content });
  },

  close: () => {
    const { content } = get();
    // Call onClose callback if provided
    content?.onClose?.();
    set({ isOpen: false, content: null });
  },

  update: (partial) => {
    const { content } = get();
    if (content) {
      set({ content: { ...content, ...partial } });
    }
  },

  toggle: () => {
    const { isOpen, content } = get();
    if (isOpen) {
      content?.onClose?.();
      set({ isOpen: false, content: null });
    }
  },

  replace: (newContent) => {
    // Replace content without closing animation
    set({ content: newContent });
  },
}));

// ============================================================================
// Selector Hooks
// ============================================================================

/** Get panel open state */
export const useAsidePanelOpen = () => useAsidePanel((s) => s.isOpen);

/** Get panel content */
export const useAsidePanelContent = () => useAsidePanel((s) => s.content);

/** Get panel actions */
export const useAsidePanelActions = () =>
  useAsidePanel((s) => ({
    open: s.open,
    close: s.close,
    update: s.update,
    toggle: s.toggle,
    replace: s.replace,
  }));

// ============================================================================
// Helper Hooks
// ============================================================================

/**
 * Helper hook for list item navigation in aside panel.
 *
 * Automatically handles:
 * - Previous/next item navigation
 * - Index tracking
 * - Active item detection
 *
 * @example
 * ```tsx
 * const { openItem, activeItemId, isActive } = useAsidePanelNavigation(
 *   users,
 *   (user) => ({
 *     key: `user-${user.id}`,
 *     title: user.name,
 *     subtitle: user.email,
 *     content: <UserDetailsContent user={user} />,
 *   })
 * );
 *
 * // In list row
 * <tr onClick={() => openItem(user)} data-active={isActive(user.id)}>
 * ```
 */
export function useAsidePanelNavigation<T extends { id: string }>(
  items: T[],
  renderContent: (item: T) => Omit<AsidePanelContent, "navigation">
) {
  const { open, replace, content, isOpen } = useAsidePanel();

  const openItem = (item: T) => {
    const currentIndex = items.findIndex((i) => i.id === item.id);
    const baseContent = renderContent(item);
    const prevItem = items[currentIndex - 1];
    const nextItem = items[currentIndex + 1];

    const panelContent: AsidePanelContent = {
      ...baseContent,
      navigation: {
        currentIndex,
        totalCount: items.length,
        canPrev: currentIndex > 0,
        canNext: currentIndex < items.length - 1,
        ...(prevItem ? { onPrev: () => openItem(prevItem) } : {}),
        ...(nextItem ? { onNext: () => openItem(nextItem) } : {}),
      },
    };

    // Use replace if already open for smoother transition
    if (isOpen) {
      replace(panelContent);
    } else {
      open(panelContent);
    }
  };

  // Extract item ID from content key (assumes format: "prefix-id")
  const activeItemId = content?.key?.split("-").pop();

  return {
    /** Open the aside panel for a specific item */
    openItem,
    /** Currently active item ID (if panel is open) */
    activeItemId: isOpen ? activeItemId : undefined,
    /** Check if a specific item is active */
    isActive: (id: string) => isOpen && activeItemId === id,
  };
}

/**
 * Hook to check if aside panel is showing a specific item
 */
export function useIsAsidePanelActive(key: string) {
  const content = useAsidePanelContent();
  const isOpen = useAsidePanelOpen();
  return isOpen && content?.key === key;
}

// ============================================================================
// Backwards Compatibility
// ============================================================================

/**
 * @deprecated Use useAsidePanel instead
 */
export const useDetailPanel = useAsidePanel;

/**
 * @deprecated Use useAsidePanelNavigation instead
 */
export const useDetailPanelNavigation = useAsidePanelNavigation;

/**
 * @deprecated Use AsidePanelContent instead
 */
export type DetailPanelContent = AsidePanelContent;
