import React from 'react';
import { cn } from '../../lib/utils';
import { IconButton } from './IconButton';
import { Icon } from './Icon';

// --- List Detail Layout ---
interface ListDetailLayoutProps {
  list: React.ReactNode;
  detail: React.ReactNode;
  showDetailMobile?: boolean; 
  onBackClick?: () => void; 
  className?: string;
}

export const ListDetailLayout: React.FC<ListDetailLayoutProps> = ({
  list,
  detail,
  showDetailMobile = false,
  onBackClick,
  className
}) => {
  return (
    <div className={cn("flex w-full h-full bg-surface overflow-hidden relative", className)}>
      {/* List Pane */}
      <div 
        className={cn(
          "flex-shrink-0 w-full md:w-[360px] h-full overflow-hidden transition-transform duration-500 ease-emphasized z-[10]",
          "border-r border-outline-variant",
          showDetailMobile ? "hidden md:block" : "block"
        )}
      >
        <div className="h-full overflow-y-auto scroll-smooth no-scrollbar">
           {list}
        </div>
      </div>

      {/* Detail Pane */}
      <div 
        className={cn(
          "flex-1 h-full bg-surface transition-opacity duration-400 ease-standard relative z-0 overflow-hidden",
          !showDetailMobile ? "hidden md:block" : "block"
        )}
      >
        {showDetailMobile && (
          <div className="md:hidden absolute top-4u left-4u z-40">
             <IconButton onClick={onBackClick} className="bg-surface shadow-1 border border-outline-variant rounded-xs">
                <Icon symbol="arrow_back" />
             </IconButton>
          </div>
        )}
        <div id="detail-scroll-viewport" className="h-full overflow-y-auto scroll-smooth no-scrollbar">
            {detail}
        </div>
      </div>
    </div>
  );
};

// --- Supporting Pane Layout ---
interface SupportingPaneLayoutProps {
  main: React.ReactNode;
  supporting: React.ReactNode;
  open?: boolean; // Global open state
  onClose?: () => void; // Used for mobile close button
  className?: string;
  isRoot?: boolean; 
  mainRef?: React.RefObject<HTMLDivElement | null>;
  showSupportingMobile?: boolean;
  onToggleSupporting?: () => void;
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
  mainRef
}) => {
  const isOpen = open !== undefined ? open : showSupportingMobile;
  const handleToggle = onClose || onToggleSupporting;

  return (
    <div 
      className={cn(
        "grid w-full h-full bg-surface relative transition-[grid-template-columns] duration-500 ease-emphasized overflow-x-hidden",
        !isRoot && "rounded-sm border border-outline-variant",
        // Desktop Grid: 360px when open, 80px rail when closed
        isOpen ? "xl:grid-cols-[1fr_360px]" : "xl:grid-cols-[1fr_80px]",
        className
      )}
    >
      {/* Main Content Pane */}
      <div 
        ref={mainRef as React.RefObject<HTMLDivElement>}
        className="flex-1 h-full overflow-hidden bg-surface relative min-w-0"
      >
        {main}
      </div>

      {/* Supporting Pane Container */}
      <aside 
        className={cn(
          "flex-shrink-0 bg-surface-container-low border-outline-variant overflow-hidden transition-all duration-500 ease-emphasized z-[50]",
          // Mobile Overlay Logic
          "absolute inset-y-0 right-0 h-full w-full sm:w-[360px]",
          isOpen ? "translate-x-0 shadow-3" : "translate-x-full shadow-none",
          // Desktop Logic
          "xl:static xl:shadow-none xl:translate-x-0 xl:border-l",
          !isOpen && "xl:border-l-outline-variant"
        )}
      >
         <div className={cn(
             "h-full relative transition-all duration-500",
             isOpen ? "w-full sm:w-[360px]" : "xl:w-[80px]"
         )}>
             {isOpen ? (
                <>
                    <div className="xl:hidden absolute top-2u right-2u z-30">
                        <IconButton onClick={handleToggle} className="bg-surface/50 backdrop-blur-md shadow-1 rounded-xs">
                           <Icon symbol="close" />
                        </IconButton>
                    </div>
                    {supporting}
                </>
             ) : (
                /* Collapsed Rail State: Expand Trigger with Fading Mask */
                <div className={cn(
                    "hidden xl:flex flex-col items-center py-6u h-full gap-4u overflow-y-auto no-scrollbar transition-all",
                    "[mask-image:linear-gradient(to_bottom,transparent,black_20px,black_calc(100%-20px),transparent)]"
                )}>
                    <IconButton 
                        onClick={handleToggle} 
                        className="rounded-xs border border-outline-variant bg-surface shadow-sm hover:border-primary/50 transition-all group shrink-0"
                        title="Expand Audit Pane"
                    >
                        <Icon symbol="chevron_left" className="group-hover:text-primary" />
                    </IconButton>
                    <div className="w-px flex-1 bg-outline-variant min-h-[40px]" />
                    <div className="rotate-90 whitespace-nowrap text-[11px] font-black uppercase text-on-surface-variant/50 tracking-[0.4em] origin-center mt-12u mb-6u shrink-0">
                        Audit Protocol
                    </div>
                </div>
             )}
         </div>
      </aside>
      
      {/* Mobile Scrim */}
      <div 
          className={cn(
              "xl:hidden absolute inset-0 bg-scrim/20 backdrop-blur-[1px] z-[45] transition-opacity duration-300",
              isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
          onClick={handleToggle}
      />
    </div>
  );
};

// --- Feed Layout ---
export const FeedLayout: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => {
  return (
    <div className={cn("w-full h-full overflow-y-auto bg-surface-container-low p-4u md:p-6u rounded-sm border border-outline-variant", className)}>
        <div className="max-w-[1200px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4u md:gap-6u items-start">{children}</div>
        </div>
    </div>
  );
};