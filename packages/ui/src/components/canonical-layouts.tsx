import React from "react";
import { cn } from "@ui/lib/utils";
import { IconButton } from "./icon-button";
import { Pane, PaneLayout } from "../layout/pane";

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
      <Pane 
        role="list" 
        isActive={!showDetailMobile} 
        className="transition-transform duration-long ease-emphasized"
      >
        {list}
      </Pane>

      <Pane 
        role="main" 
        isActive={showDetailMobile} 
        className="bg-surface-container-low transition-opacity duration-long ease-standard relative"
      >
        {showDetailMobile && (
          <div className="medium:hidden absolute top-4 left-4 z-20">
            <IconButton
              onClick={onBackClick}
              variant="standard"
              className="bg-surface/50 backdrop-blur-md border border-outline-variant/30"
              ariaLabel="Back"
              icon={<span className="material-symbols-outlined">arrow_back</span>}
            />
          </div>
        )}
        {detail}
      </Pane>
    </PaneLayout>
  );
};

export { ListDetailLayout as PaneGroup };

export interface SupportingPaneLayoutProps {
  main: React.ReactNode;
  supporting: React.ReactNode;
  open?: boolean;
  onClose?: () => void;
  className?: string;
  isRoot?: boolean;
  mainRef?: React.RefObject<HTMLDivElement | null>;
  showSupportingMobile?: boolean;
  onToggleSupporting?: () => void;
  title?: string;
}

export const SupportingPaneLayout: React.FC<SupportingPaneLayoutProps> = ({
  main,
  supporting,
  open,
  onClose,
  showSupportingMobile,
  onToggleSupporting,
  className,
  isRoot = false,
  mainRef,
  title = "Audit Protocol",
}) => {
  const isOpen = open !== undefined ? open : showSupportingMobile;
  const handleClose = () => {
    if (onClose) {
      onClose();
      return;
    }
    onToggleSupporting?.();
  };
  const handleToggle = () => {
    onToggleSupporting?.();
  };

  return (
    <div
      className={cn(
        "grid w-full h-full bg-surface relative transition-[grid-template-columns] duration-long ease-emphasized overflow-hidden isolate",
        !isRoot && "rounded-sm border border-outline-variant/30",
        isOpen
          ? "expanded:grid-cols-[1fr_var(--width-pane-supporting)]"
          : "expanded:grid-cols-[1fr_var(--width-rail-collapsed)]",
        className
      )}
    >
      <div
        ref={mainRef as React.RefObject<HTMLDivElement>}
        className="flex-1 h-full overflow-hidden bg-surface relative min-w-0"
      >
        <div className="h-full overflow-y-auto scroll-smooth [scrollbar-gutter:stable]">
          {main}
        </div>
      </div>

      <aside
        className={cn(
          "shrink-0 bg-surface-container-low overflow-hidden transition-all duration-long ease-emphasized z-20",
          "absolute inset-y-0 right-0 h-full w-full medium:w-[min(100%,var(--width-pane-supporting))]",
          isOpen ? "translate-x-0 shadow-3" : "translate-x-full shadow-none",
          "expanded:static expanded:shadow-none expanded:translate-x-0 expanded:border-l expanded:border-outline-variant/30 expanded:w-full"
        )}
      >
        {isOpen ? (
          <div className="flex flex-col h-full">
            <header className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between shrink-0">
              <div className="font-medium text-primary text-label-medium">
                {title}
              </div>
              <IconButton
                onClick={handleClose}
                variant="standard"
                icon={
                  <span className="material-symbols-outlined text-(length:--size-icon-sm)">
                    close
                  </span>
                }
                ariaLabel="Close pane"
                className="expanded:hidden"
              />
            </header>
            <div className="flex-1 overflow-y-auto [scrollbar-gutter:stable] pt-2">
              {supporting}
            </div>
          </div>
        ) : (
          <div className="hidden expanded:flex flex-col items-center py-6 h-full gap-4 overflow-y-auto no-scrollbar">
            <IconButton
              onClick={handleToggle}
              variant="standard"
              className="rounded-sm border border-outline-variant/30 bg-surface hover:border-primary/50 transition-all group shrink-0"
              ariaLabel="Expand pane"
              icon={
                <span className="material-symbols-outlined group-hover:text-primary transition-colors">
                  chevron_left
                </span>
              }
            />
            <div className="w-[calc(var(--unit)/4)] flex-1 bg-outline-variant/30 min-h-10" />
            <div className="rotate-90 whitespace-nowrap text-label-small font-medium text-on-surface-variant/50 tracking-wide origin-center mt-12 mb-6 shrink-0">
              {title}
            </div>
          </div>
        )}
      </aside>

      <div
        className={cn(
          "expanded:hidden absolute inset-0 bg-scrim backdrop-blur-[calc(var(--unit)/4)] z-10 transition-opacity duration-emphasized",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={handleClose}
      />
    </div>
  );
};

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
        "w-full h-full overflow-y-auto bg-surface-container-low p-4 expanded:p-6 scroll-smooth no-scrollbar",
        !isRoot && "rounded-sm border border-outline-variant/30",
        className
      )}
    >
      <div className="max-w-large mx-auto">
        <div className="grid grid-cols-1 expanded:grid-cols-2 large:grid-cols-3 gap-4 expanded:gap-6 items-start">
          {children}
        </div>
      </div>
    </div>
  );
};
