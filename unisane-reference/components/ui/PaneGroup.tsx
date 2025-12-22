import React from 'react';
import { cn } from '../../lib/utils';

interface PaneGroupProps {
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
  className
}) => {
  return (
    <div className={cn("flex w-full h-full overflow-hidden bg-surface", className)}>
      {/* Sidebar Pane */}
      <div 
        className={cn(
          "flex-shrink-0 w-full md:w-[360px] h-full overflow-y-auto border-r border-outline-variant/20 transition-transform duration-500 ease-emphasized",
          // Mobile Logic: If detail is shown, hide sidebar
          showDetail ? "hidden md:block" : "block"
        )}
      >
        {sidebar}
      </div>

      {/* Detail Pane */}
      <div 
        className={cn(
          "flex-1 h-full overflow-y-auto bg-surface md:bg-surface-container transition-opacity duration-400 ease-standard",
          // Mobile Logic: If detail is NOT shown, hide this pane
          !showDetail ? "hidden md:block" : "block"
        )}
      >
        {detail}
      </div>
    </div>
  );
};