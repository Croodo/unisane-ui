"use client";

import { type ReactNode } from "react";
import { useWindowSize } from "./window-size-provider.js";

interface PaneGroupProps {
  children: ReactNode;
  panes: Array<{
    id: string;
    content: ReactNode;
    defaultWidth?: string;
    minWidth?: string;
    maxWidth?: string;
  }>;
  separator?: boolean;
  className?: string;
}

export function PaneGroup({
  children,
  panes,
  separator = true,
  className = "",
}: PaneGroupProps) {
  const { sizeClass } = useWindowSize();

  // Determine number of visible panes based on window size class
  const getVisiblePanes = () => {
    switch (sizeClass) {
      case "compact":
        return 1;
      case "medium":
      case "expanded":
        return Math.min(2, panes.length);
      case "large":
      case "xlarge":
        return Math.min(3, panes.length);
      default:
        return 1;
    }
  };

  const visiblePanes = getVisiblePanes();

  // For compact mode, only show the first pane or children
  if (sizeClass === "compact") {
    return <div className={className}>{children || panes[0]?.content}</div>;
  }

  // For larger screens, show multiple panes
  return (
    <div className={`flex h-full ${className}`}>
      {panes.slice(0, visiblePanes).map((pane, index) => (
        <div
          key={pane.id}
          className={`
            ${pane.defaultWidth || "flex-1"}
            ${pane.minWidth ? `min-w-[${pane.minWidth}]` : ""}
            ${pane.maxWidth ? `max-w-[${pane.maxWidth}]` : ""}
            ${index < visiblePanes - 1 && separator ? "border-r border-outline-variant" : ""}
          `}
        >
          {pane.content}
        </div>
      ))}
    </div>
  );
}
