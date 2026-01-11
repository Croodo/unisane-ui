"use client";

import { useEffect, useCallback } from "react";
import { cn } from "@unisane/ui/lib/utils";
import { Button } from "@unisane/ui/components/button";
import { ScrollArea } from "@unisane/ui/components/scroll-area";
import { Typography } from "@unisane/ui/components/typography";
import { Icon } from "@unisane/ui/primitives/icon";
import {
  useAsidePanel,
  ASIDE_PANEL_WIDTH_CLASSES,
} from "@/src/context/useAsidePanel";

// ============================================================================
// Types
// ============================================================================

export type AsidePanelProps = {
  /** Additional class names for the panel */
  className?: string;
  /** Override default position (reads from content.side if not provided) */
  defaultSide?: "left" | "right";
  /** Show close button */
  showCloseButton?: boolean;
  /** Close on escape key */
  closeOnEscape?: boolean;
  /** Close on overlay click (when overlay is enabled) */
  closeOnOverlayClick?: boolean;
};

// ============================================================================
// Component
// ============================================================================

/**
 * Global aside panel component that renders on the side of the layout.
 * Controlled by the useAsidePanel Zustand store.
 *
 * Place this component in your layout where you want the panel to appear.
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * <div className="flex h-screen">
 *   <Sidebar />
 *   <main className="flex-1">{children}</main>
 *   <AsidePanel />
 * </div>
 * ```
 */
export function AsidePanel({
  className,
  defaultSide = "right",
  showCloseButton = true,
  closeOnEscape = true,
  closeOnOverlayClick = true,
}: AsidePanelProps) {
  const { isOpen, content, close } = useAsidePanel();

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !content?.preventClose) {
        close();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [closeOnEscape, isOpen, content?.preventClose, close]);

  // Handle overlay click
  const handleOverlayClick = useCallback(() => {
    if (closeOnOverlayClick && !content?.preventClose) {
      close();
    }
  }, [closeOnOverlayClick, content?.preventClose, close]);

  if (!isOpen || !content) {
    return null;
  }

  const side = content.side ?? defaultSide;
  const width = content.width ?? "md";
  const nav = content.navigation;
  const showOverlay = content.overlay ?? false;

  // Animation classes based on side
  const slideAnimation =
    side === "left"
      ? "animate-in slide-in-from-left-4"
      : "animate-in slide-in-from-right-4";

  // Border classes based on side
  const borderClass = side === "left" ? "border-r" : "border-l";

  return (
    <>
      {/* Overlay backdrop */}
      {showOverlay && (
        <div
          className="fixed inset-0 z-40 bg-scrim/50 animate-in fade-in duration-200"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <aside
        className={cn(
          "h-full bg-surface flex flex-col shrink-0",
          borderClass,
          "border-outline-variant",
          slideAnimation,
          "duration-200",
          ASIDE_PANEL_WIDTH_CLASSES[width],
          showOverlay && "fixed z-50 top-0 bottom-0",
          showOverlay && (side === "left" ? "left-0" : "right-0"),
          className
        )}
        role="complementary"
        aria-label={content.title}
      >
        {/* Header */}
        <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-outline-variant shrink-0">
          <div className="flex-1 min-w-0">
            <Typography variant="titleSmall" className="font-semibold truncate">
              {content.title}
            </Typography>
            {content.subtitle && (
              <Typography
                variant="bodySmall"
                className="text-on-surface-variant truncate"
              >
                {content.subtitle}
              </Typography>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Custom header actions */}
            {content.headerActions}

            {/* Navigation controls */}
            {nav && (
              <>
                <Button
                  variant="text"
                  size="sm"
                  className="size-8 p-0"
                  onClick={nav.onPrev}
                  disabled={!nav.canPrev}
                  aria-label="Previous item"
                >
                  <Icon symbol="chevron_left" size="sm" />
                </Button>

                {nav.currentIndex !== undefined &&
                  nav.totalCount !== undefined && (
                    <Typography
                      variant="labelSmall"
                      className="text-on-surface-variant tabular-nums px-1"
                    >
                      {nav.currentIndex + 1}/{nav.totalCount}
                    </Typography>
                  )}

                <Button
                  variant="text"
                  size="sm"
                  className="size-8 p-0"
                  onClick={nav.onNext}
                  disabled={!nav.canNext}
                  aria-label="Next item"
                >
                  <Icon symbol="chevron_right" size="sm" />
                </Button>

                {/* Divider before close button */}
                {showCloseButton && (
                  <div className="w-px h-4 bg-outline-variant mx-1" />
                )}
              </>
            )}

            {/* Close button */}
            {showCloseButton && (
              <Button
                variant="text"
                size="sm"
                className="size-8 p-0"
                onClick={close}
                aria-label="Close panel"
              >
                <Icon symbol="close" size="sm" />
              </Button>
            )}
          </div>
        </header>

        {/* Content */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4">{content.content}</div>
        </ScrollArea>

        {/* Footer (optional) */}
        {content.footer && (
          <footer className="shrink-0 border-t border-outline-variant p-4">
            {content.footer}
          </footer>
        )}
      </aside>
    </>
  );
}

export default AsidePanel;
