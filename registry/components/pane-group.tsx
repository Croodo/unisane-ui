import React from "react";
import { cn } from "@/lib/utils";

export interface PaneGroupProps {
  /** The "List" pane. Always visible on Desktop. Hidden on Mobile if detail is active. */
  sidebar: React.ReactNode;
  /** The "Detail" pane. Visible on Desktop. Visible on Mobile only if showDetail is true. */
  detail: React.ReactNode;
  /** Mobile only: whether to show the detail view. */
  showDetail?: boolean;
  className?: string;
}

export const PaneGroup: React.FC<PaneGroupProps> = ({
  sidebar,
  detail,
  showDetail = false,
  className,
}) => {
  return (
    <div
      className={cn("flex w-full h-full overflow-hidden bg-surface", className)}
    >
      {/* Sidebar Pane */}
      <div
        className={cn(
          "flex-shrink-0 w-full medium:w-[var(--width-pane-list,calc(var(--unit)*90))] h-full overflow-y-auto border-r border-outline-variant/20 transition-transform duration-long ease-emphasized",
          // Mobile Logic: If detail is shown, hide sidebar
          showDetail ? "hidden medium:block" : "block"
        )}
      >
        {sidebar}
      </div>

      {/* Detail Pane */}
      <div
        className={cn(
          "flex-1 h-full overflow-y-auto bg-surface medium:bg-surface-container transition-opacity duration-long ease-standard",
          // Mobile Logic: If detail is NOT shown, hide this pane
          !showDetail ? "hidden medium:block" : "block"
        )}
      >
        {detail}
      </div>
    </div>
  );
};
