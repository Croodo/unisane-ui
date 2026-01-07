"use client";

import { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/src/components/ui/sheet";
import { Button } from "@/src/components/ui/button";
import { ChevronUp, ChevronDown, X } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { ScrollArea } from "@/src/components/ui/scroll-area";

export interface RowDetailSheetProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: T | null;
  title?: string | ((row: T) => ReactNode);
  subtitle?: string | ((row: T) => ReactNode);
  children: (row: T) => ReactNode;
  width?: "sm" | "md" | "lg" | "xl" | "2xl";
  side?: "right" | "left";
  onNavigate?: (direction: "prev" | "next") => void;
  canNavigatePrev?: boolean;
  canNavigateNext?: boolean;
  currentIndex?: number;
  totalCount?: number;
  headerActions?: (row: T) => ReactNode;
  className?: string;
}

const widthClasses = {
  sm: "w-[320px] sm:w-[380px]",
  md: "w-[400px] sm:w-[480px]",
  lg: "w-[480px] sm:w-[560px]",
  xl: "w-[560px] sm:w-[640px]",
  "2xl": "w-[640px] sm:w-[800px]",
};

export function RowDetailSheet<T>({
  open,
  onOpenChange,
  row,
  title,
  subtitle,
  children,
  width = "md",
  side = "right",
  onNavigate,
  canNavigatePrev,
  canNavigateNext,
  currentIndex,
  totalCount,
  headerActions,
  className,
}: RowDetailSheetProps<T>) {
  if (!row) return null;

  const resolvedTitle = typeof title === "function" ? title(row) : title;
  const resolvedSubtitle =
    typeof subtitle === "function" ? subtitle(row) : subtitle;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={cn(
          widthClasses[width],
          "p-0 flex flex-col max-w-[100vw]",
          className
        )}
      >
        <SheetHeader className="px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              {resolvedTitle && (
                <SheetTitle className="text-sm font-medium truncate">
                  {resolvedTitle}
                </SheetTitle>
              )}
              {resolvedSubtitle && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {resolvedSubtitle}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {onNavigate && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onNavigate("prev")}
                    disabled={!canNavigatePrev}
                    aria-label="Previous"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onNavigate("next")}
                    disabled={!canNavigateNext}
                    aria-label="Next"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  {typeof currentIndex === "number" && totalCount && (
                    <span className="text-xs text-muted-foreground tabular-nums px-1">
                      {currentIndex + 1}/{totalCount}
                    </span>
                  )}
                </>
              )}
              {headerActions && headerActions(row)}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onOpenChange(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>
        <ScrollArea className="flex-1">
          <div className="px-4 py-3 space-y-4">{children(row)}</div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
