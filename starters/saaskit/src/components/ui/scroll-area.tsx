"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

type ScrollAreaProps = React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
  viewportRef?: React.Ref<HTMLDivElement>;
};

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  ScrollAreaProps
>(({ className, children, viewportRef, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    type="always"
    className={cn("relative overflow-hidden group/sa", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport
      ref={viewportRef as any}
      className="h-full w-full rounded-[inherit]"
    >
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollBar orientation="horizontal" />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      // Base rail
      "flex touch-none select-none bg-transparent transition-colors opacity-0 group-hover/sa:opacity-100",
      // Thickness and padding per axis
      orientation === "vertical" ? "h-full w-2.5 p-[1px]" : "h-2.5 flex-col p-[1px]",
      // Subtle track on hover/scrollbar focus
      "hover:bg-muted/30 active:bg-muted/40",
      className
    )}
    {...props}
  >
    {/* Square(ish) thumb with better contrast */}
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-sm bg-muted-foreground/40 hover:bg-muted-foreground/60 active:bg-muted-foreground/70" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
