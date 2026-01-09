import React from "react";
import { cn } from "@/src/lib/utils";

export interface PaneGroupProps {
  sidebar: React.ReactNode;
  detail: React.ReactNode;
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
      <div
        className={cn(
          "shrink-0 w-full medium:w-(--width-pane-list,var(--spacing-90)) h-full overflow-y-auto border-r border-outline-variant/20 transition-transform duration-long ease-emphasized",
          showDetail ? "hidden medium:block" : "block"
        )}
      >
        {sidebar}
      </div>

      <div
        className={cn(
          "flex-1 h-full overflow-y-auto bg-surface medium:bg-surface-container transition-opacity duration-long ease-standard",
          !showDetail ? "hidden medium:block" : "block"
        )}
      >
        {detail}
      </div>
    </div>
  );
};
