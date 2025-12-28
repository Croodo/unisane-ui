import React from "react";
import { cn } from "@/lib/utils";

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "vertical" | "horizontal" | "both";
  scrollbarClassName?: string;
}

export const ScrollArea: React.FC<ScrollAreaProps> = ({
  children,
  className,
  orientation = "vertical",
  scrollbarClassName,
  ...props
}) => {
  return (
    <div className={cn("relative overflow-hidden", className)} {...props}>
      <div
        className={cn(
          "h-full w-full",
          // Scroll behavior
          orientation === "vertical" && "overflow-y-auto overflow-x-hidden",
          orientation === "horizontal" && "overflow-x-auto overflow-y-hidden",
          orientation === "both" && "overflow-auto",

          // Firefox
          "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-outline-variant/40",

          // Webkit (Chrome/Safari/Edge)
          "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2",
          "[&::-webkit-scrollbar-track]:bg-transparent",
          "[&::-webkit-scrollbar-thumb]:bg-outline-variant/40 [&::-webkit-scrollbar-thumb]:rounded-full",
          "[&::-webkit-scrollbar-thumb]:hover:bg-outline-variant/80",

          scrollbarClassName
        )}
      >
        {children}
      </div>
    </div>
  );
};
