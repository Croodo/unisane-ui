import React from "react";
import { cn } from "../lib/utils";
import { IconButton } from "./ui/icon-button";
import { Pane, PaneLayout } from "./ui/pane";
import { Portal } from "./ui/portal";
import { animations } from "../utils/animations";

// --- List Detail Layout ---

export interface ListDetailLayoutProps {
  list: React.ReactNode;
  detail: React.ReactNode;
  showDetailMobile?: boolean;
  onBackClick?: () => void;
  className?: string;
  isRoot?: boolean;
}

export const ListDetailLayout: React.FC<ListDetailLayoutProps> = ({
  list,
  detail,
  showDetailMobile = false,
  onBackClick,
  className,
  isRoot = false,
}) => {
  return (
    <PaneLayout
      className={cn(
        !isRoot && "rounded-sm border border-outline-variant/30",
        className
      )}
    >
      {/* List Pane - Hidden on mobile when detail is shown */}
      <Pane
        role="list"
        isActive={!showDetailMobile}
        className={cn("transition-transform", animations.transition.transform)}
      >
        {list}
      </Pane>

      {/* Detail Pane - Slides in on mobile */}
      <Pane
        role="main"
        isActive={showDetailMobile}
        className={cn(
          "bg-surface-container-low relative",
          animations.transition.opacity
        )}
      >
        {showDetailMobile && (
          <div className="medium:hidden absolute top-4u left-4u z-20">
            <IconButton
              onClick={onBackClick}
              variant="standard"
              className="bg-surface/50 backdrop-blur-md border border-outline-variant/30"
              ariaLabel="Back"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </IconButton>
          </div>
        )}
        {detail}
      </Pane>
    </PaneLayout>
  );
};

// --- Supporting Pane Layout ---

export interface SupportingPaneLayoutProps {
  main: React.ReactNode;
  supporting: React.ReactNode;
  open?: boolean;
  onClose?: () => void;
  className?: string;
  isRoot?: boolean;
  mainRef?: React.RefObject<HTMLDivElement | null>;
  title?: string;
}

export const SupportingPaneLayout: React.FC<SupportingPaneLayoutProps> = ({
  main,
  supporting,
  open = false,
  onClose,
  className,
  isRoot = false,
  mainRef,
  title = "Details",
}) => {
  return (
    <div
      className={cn(
        "grid w-full h-full bg-surface relative overflow-hidden isolate",
        "transition-[grid-template-columns] duration-long ease-emphasized",
        !isRoot && "rounded-sm border border-outline-variant/30",
        open
          ? "expanded:grid-cols-[1fr_var(--width-pane-supporting,400px)]"
          : "expanded:grid-cols-[1fr_var(--width-rail-collapsed,72px)]",
        className
      )}
    >
      {/* Main Content Pane */}
      <div
        ref={mainRef as React.RefObject<HTMLDivElement>}
        className="flex-1 h-full overflow-hidden bg-surface relative min-w-0"
      >
        <div className="h-full overflow-y-auto scroll-smooth [scrollbar-gutter:stable]">
          {main}
        </div>
      </div>

      {/* Supporting Pane - Overlay on mobile, static on expanded */}
      <aside
        className={cn(
          "shrink-0 bg-surface-container-low overflow-hidden z-20",
          "transition-all duration-long ease-emphasized",
          // Mobile: Absolute overlay
          "absolute inset-y-0 right-0 h-full w-full medium:w-[min(100%,var(--width-pane-supporting,400px))]",
          open ? "translate-x-0 shadow-3" : "translate-x-full shadow-none",
          // Expanded: Static
          "expanded:static expanded:shadow-none expanded:translate-x-0",
          "expanded:border-l expanded:border-outline-variant/30 expanded:w-full"
        )}
      >
        {open ? (
          <div className="flex flex-col h-full">
            <header className="px-6u py-4u border-b border-outline-variant/10 flex items-center justify-between shrink-0">
              <div className="font-medium text-primary text-label-medium">
                {title}
              </div>
              <IconButton
                onClick={onClose}
                variant="standard"
                ariaLabel="Close pane"
                className="expanded:hidden"
              >
                <span className="material-symbols-outlined text-[length:var(--size-icon-sm)]">close</span>
              </IconButton>
            </header>
            <div className="flex-1 overflow-y-auto [scrollbar-gutter:stable] pt-2u">
              {supporting}
            </div>
          </div>
        ) : (
          /* Collapsed Rail State (desktop only) */
          <div className="hidden expanded:flex flex-col items-center py-6u h-full gap-4u overflow-y-auto no-scrollbar">
            <IconButton
              onClick={onClose}
              variant="standard"
              className="rounded-sm border border-outline-variant/30 bg-surface hover:border-primary/50 transition-all group shrink-0"
              ariaLabel="Expand pane"
            >
              <span className="material-symbols-outlined group-hover:text-primary transition-colors">chevron_left</span>
            </IconButton>
            <div className="w-[calc(var(--uni-sys-u)/4)] flex-1 bg-outline-variant/30 min-h-10u" />
            <div className="rotate-90 whitespace-nowrap text-label-small font-medium text-on-surface-variant/50 tracking-wide origin-center mt-12u mb-6u shrink-0">
              {title}
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Backdrop */}
      <div
        className={cn(
          "expanded:hidden absolute inset-0 bg-scrim backdrop-blur-[calc(var(--uni-sys-u)/4)] z-10",
          "transition-opacity duration-emphasized",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
    </div>
  );
};

// --- Feed Layout ---

export interface FeedLayoutProps {
  children: React.ReactNode;
  className?: string;
  isRoot?: boolean;
}

export const FeedLayout: React.FC<FeedLayoutProps> = ({
  children,
  className,
  isRoot = false,
}) => {
  return (
    <div
      className={cn(
        "w-full h-full overflow-y-auto bg-surface-container-low p-4u expanded:p-6u scroll-smooth no-scrollbar",
        !isRoot && "rounded-sm border border-outline-variant/30",
        className
      )}
    >
      <div className="max-w-large mx-auto">
        <div className="grid grid-cols-1 expanded:grid-cols-2 large:grid-cols-3 gap-4u expanded:gap-6u items-start">
          {children}
        </div>
      </div>
    </div>
  );
};