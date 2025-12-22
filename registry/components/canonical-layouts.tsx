import React from "react";
import { cn } from "@ui/lib/utils";
import { IconButton } from "./icon-button";
import { Pane, PaneLayout } from "../layout/pane";

// --- List Detail Layout ---
export interface ListDetailLayoutProps {
  list: React.ReactNode;
  detail: React.ReactNode;
  showDetailMobile?: boolean; // Controlled state for mobile view
  onBackClick?: () => void; // Mobile only
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
        !isRoot && "rounded-xs border border-outline-variant/30",
        className
      )}
    >
      {/* List Pane - Hidden on mobile if detail is shown */}
      <Pane 
        role="list" 
        isActive={!showDetailMobile} 
        className="transition-transform duration-long ease-emphasized"
      >
        {list}
      </Pane>

      {/* Detail Pane - Hidden on mobile if detail is NOT shown */}
      <Pane 
        role="main" 
        isActive={showDetailMobile} 
        className="bg-surface-container-low transition-opacity duration-long ease-standard relative"
      >
        {showDetailMobile && (
          <div className="medium:hidden absolute top-4u left-4u z-20">
            <IconButton
              onClick={onBackClick}
              variant="standard"
              className="bg-surface/50 backdrop-blur-md shadow-1 border border-outline-variant/30"
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

// Backward compatibility
export { ListDetailLayout as PaneGroup };

// --- Supporting Pane Layout ---
export interface SupportingPaneLayoutProps {
  main: React.ReactNode;
  supporting: React.ReactNode;
  open?: boolean; // Global open state
  onClose?: () => void; // Used for mobile close button
  className?: string;
  isRoot?: boolean;
  mainRef?: React.RefObject<HTMLDivElement | null>;
  showSupportingMobile?: boolean; // Legacy/Mapped
  onToggleSupporting?: () => void; // Legacy/Mapped
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
  title = "Audit Protocol"
}) => {
  // Normalize props
  const isOpen = open !== undefined ? open : showSupportingMobile;
  const handleToggle = onClose || onToggleSupporting;

  return (
    <div
      className={cn(
        "grid w-full h-full bg-surface relative transition-[grid-template-columns] duration-long ease-emphasized overflow-x-hidden isolate",
        !isRoot && "rounded-xs border border-outline-variant/30",
        // Desktop Grid: Supporting width when open, Rail width when closed
        isOpen ? "extra-large:grid-cols-[1fr_var(--width-pane-supporting)]" : "extra-large:grid-cols-[1fr_var(--width-rail-collapsed)]",
        className
      )}
    >
      {/* Main Content Pane */}
      <div
        ref={mainRef as React.RefObject<HTMLDivElement>}
        className="flex-1 h-full overflow-hidden bg-surface relative min-w-0"
      >
        <div className="h-full overflow-y-auto scroll-smooth no-scrollbar">
          {main}
        </div>
      </div>

      {/* Supporting Pane Container */}
      <aside
        className={cn(
          "shrink-0 bg-surface-container-low border-outline-variant/30 overflow-hidden transition-all duration-long ease-emphasized z-20",
          // Mobile/Tablet: Absolute overlay
          "absolute inset-y-0 right-0 h-full w-full medium:w-pane-supporting",
          isOpen ? "translate-x-0 shadow-3" : "translate-x-full shadow-none",
          // XL Desktop: Static positioning, remove shadow
          "extra-large:static extra-large:shadow-none extra-large:translate-x-0 extra-large:border-l",
          !isOpen && "extra-large:border-l-outline-variant/20"
        )}
      >
        <div className={cn(
            "h-full relative transition-all duration-long",
            isOpen ? "w-full medium:w-pane-supporting" : "extra-large:w-rail-collapsed"
        )}>
           {isOpen ? (
              <div className="flex flex-col h-full">
                <header className="px-6u py-4u border-b border-outline-variant/10 flex items-center justify-between shrink-0">
                  {/* Assuming Typography component is available or replace with a div */}
                  <div className="font-black uppercase tracking-widest text-primary text-label-medium">
                    {title}
                  </div>
                  <IconButton 
                    onClick={handleToggle} 
                    variant="standard" 
                    icon={<span className="material-symbols-outlined text-[length:var(--size-icon-sm)]">close</span>}
                    ariaLabel="Close pane"
                    className="extra-large:hidden"
                  />
                </header>
                <div className="flex-1 overflow-y-auto no-scrollbar pt-2u">
                  {supporting}
                </div>
              </div>
           ) : (
              /* Collapsed Rail State */
              <div className={cn(
                  "hidden extra-large:flex flex-col items-center py-6u h-full gap-4u overflow-y-auto no-scrollbar transition-all",
                  "mask-[linear-gradient(to_bottom,transparent,black_calc(var(--uni-sys-u)*5),black_calc(100%-calc(var(--uni-sys-u)*5)),transparent)]"
              )}>
                  <IconButton 
                      onClick={handleToggle} 
                      variant="standard"
                      className="rounded-xs border border-outline-variant/30 bg-surface shadow-1 hover:border-primary/50 transition-all group shrink-0"
                      ariaLabel="Expand pane"
                      icon={<span className="material-symbols-outlined group-hover:text-primary transition-colors">chevron_left</span>}
                  />
                  <div className="w-[calc(var(--uni-sys-u)/4)] flex-1 bg-outline-variant/30 min-h-10u" />
                  <div className="rotate-90 whitespace-nowrap text-label-small font-black uppercase text-on-surface-variant/40 tracking-[0.4em] origin-center mt-12u mb-6u shrink-0">
                      {title}
                  </div>
              </div>
           )}
        </div>
      </aside>

      {/* Mobile Backdrop */}
      <div
        className={cn(
          "extra-large:hidden absolute inset-0 bg-scrim/30 backdrop-blur-[calc(var(--uni-sys-u)/4)] z-10 transition-opacity duration-emphasized",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={handleToggle}
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
        !isRoot && "rounded-xs border border-outline-variant/30",
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
