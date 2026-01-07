"use client";

import { create } from "zustand";
import type { ReactNode } from "react";

/**
 * Detail Panel content configuration
 */
export type DetailPanelContent = {
  /** Unique key to identify the content (prevents duplicate renders) */
  key: string;
  /** Panel title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Panel content renderer */
  content: ReactNode;
  /** Width variant */
  width?: "sm" | "md" | "lg";
  /** Navigation callbacks (for prev/next in lists) */
  navigation?: {
    onPrev?: () => void;
    onNext?: () => void;
    canPrev?: boolean;
    canNext?: boolean;
    currentIndex?: number;
    totalCount?: number;
  };
};

type DetailPanelState = {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Current panel content */
  content: DetailPanelContent | null;
  /** Open panel with content */
  open: (content: DetailPanelContent) => void;
  /** Close the panel */
  close: () => void;
  /** Update content (for navigation) */
  update: (content: Partial<DetailPanelContent>) => void;
  /** Toggle panel visibility */
  toggle: () => void;
};

/**
 * Global Zustand store for the right-side detail panel.
 *
 * Usage:
 * ```tsx
 * const { open, close } = useDetailPanel();
 *
 * // Open panel
 * open({
 *   key: `user-${user.id}`,
 *   title: user.name,
 *   subtitle: user.email,
 *   content: <UserDetails user={user} />,
 * });
 *
 * // Close panel
 * close();
 * ```
 */
export const useDetailPanel = create<DetailPanelState>((set, get) => ({
  isOpen: false,
  content: null,

  open: (content) => {
    set({ isOpen: true, content });
  },

  close: () => {
    set({ isOpen: false, content: null });
  },

  update: (partial) => {
    const { content } = get();
    if (content) {
      set({ content: { ...content, ...partial } });
    }
  },

  toggle: () => {
    const { isOpen } = get();
    if (isOpen) {
      set({ isOpen: false, content: null });
    }
  },
}));

/**
 * Helper hook for row detail navigation
 */
export function useDetailPanelNavigation<T extends { id: string }>(
  items: T[],
  renderContent: (item: T) => DetailPanelContent
) {
  const { open, content } = useDetailPanel();

  const openItem = (item: T) => {
    const currentIndex = items.findIndex((i) => i.id === item.id);
    const baseContent = renderContent(item);
    const prevItem = items[currentIndex - 1];
    const nextItem = items[currentIndex + 1];

    open({
      ...baseContent,
      navigation: {
        currentIndex,
        totalCount: items.length,
        canPrev: currentIndex > 0,
        canNext: currentIndex < items.length - 1,
        ...(prevItem ? { onPrev: () => openItem(prevItem) } : {}),
        ...(nextItem ? { onNext: () => openItem(nextItem) } : {}),
      },
    });
  };

  const activeItemId = content?.key?.split("-").pop();

  return {
    openItem,
    activeItemId,
    isActive: (id: string) => activeItemId === id,
  };
}
