"use client";

import { useDetailPanel } from "@/src/context/useDetailPanel";
import { cn } from "@unisane/ui/lib/utils";
import { Button } from "@unisane/ui/components/button";
import { ScrollArea } from "@unisane/ui/components/scroll-area";
import { Text } from "@unisane/ui/primitives/text";
import { Icon } from "@unisane/ui/primitives/icon";

const WIDTH_CLASSES = {
  sm: "w-[320px]",
  md: "w-[400px]",
  lg: "w-[500px]",
} as const;

/**
 * Global detail panel that renders on the right side of the layout.
 * Controlled by the useDetailPanel Zustand store.
 */
export function DetailPanel() {
  const { isOpen, content, close } = useDetailPanel();

  if (!isOpen || !content) {
    return null;
  }

  const width = content.width ?? "md";
  const nav = content.navigation;

  return (
    <aside
      className={cn(
        "h-full border-l border-outline-variant bg-surface flex flex-col shrink-0",
        "animate-in slide-in-from-right-4 duration-200",
        WIDTH_CLASSES[width]
      )}
    >
      {/* Header */}
      <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-outline-variant shrink-0">
        <div className="flex-1 min-w-0">
          <Text variant="titleSmall" weight="semibold" className="truncate">
            {content.title}
          </Text>
          {content.subtitle && (
            <Text variant="bodySmall" color="onSurfaceVariant" className="truncate">
              {content.subtitle}
            </Text>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Navigation controls */}
          {nav && (
            <>
              <Button
                variant="text"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={nav.onPrev}
                disabled={!nav.canPrev}
                title="Previous"
              >
                <Icon symbol="chevron_left" size="sm" />
              </Button>
              {nav.currentIndex !== undefined &&
                nav.totalCount !== undefined && (
                  <Text variant="labelSmall" color="onSurfaceVariant" className="tabular-nums px-1">
                    {nav.currentIndex + 1}/{nav.totalCount}
                  </Text>
                )}
              <Button
                variant="text"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={nav.onNext}
                disabled={!nav.canNext}
                title="Next"
              >
                <Icon symbol="chevron_right" size="sm" />
              </Button>
              <div className="w-px h-4 bg-outline-variant mx-1" />
            </>
          )}

          {/* Close button */}
          <Button
            variant="text"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={close}
            title="Close panel"
          >
            <Icon symbol="close" size="sm" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4">{content.content}</div>
      </ScrollArea>
    </aside>
  );
}

export default DetailPanel;
