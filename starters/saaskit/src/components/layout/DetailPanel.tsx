"use client";

import { useDetailPanel } from "@/src/context/useDetailPanel";
import { cn } from "@/src/lib/utils";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { ScrollArea } from "@/src/components/ui/scroll-area";

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
        "h-full border-l bg-background flex flex-col shrink-0",
        "animate-in slide-in-from-right-4 duration-200",
        WIDTH_CLASSES[width]
      )}
    >
      {/* Header */}
      <header className="flex items-center justify-between gap-2 px-4 py-3 border-b shrink-0">
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold truncate">{content.title}</h2>
          {content.subtitle && (
            <p className="text-xs text-muted-foreground truncate">
              {content.subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Navigation controls */}
          {nav && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={nav.onPrev}
                disabled={!nav.canPrev}
                title="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {nav.currentIndex !== undefined &&
                nav.totalCount !== undefined && (
                  <span className="text-xs text-muted-foreground tabular-nums px-1">
                    {nav.currentIndex + 1}/{nav.totalCount}
                  </span>
                )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={nav.onNext}
                disabled={!nav.canNext}
                title="Next"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="w-px h-4 bg-border mx-1" />
            </>
          )}

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={close}
            title="Close panel"
          >
            <X className="h-4 w-4" />
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
