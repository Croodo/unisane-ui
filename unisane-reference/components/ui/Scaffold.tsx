import React from 'react';
import { cn } from '../../lib/utils';

interface ScaffoldProps {
  topBar?: React.ReactNode;
  fab?: React.ReactNode;
  navigation?: React.ReactNode; 
  secondaryNavigation?: React.ReactNode; 
  mobileNavigation?: React.ReactNode; 
  children: React.ReactNode;
  className?: string;
  mainRef?: React.RefObject<HTMLElement | null>;
  disableScroll?: boolean; 
}

export const Scaffold: React.FC<ScaffoldProps> = ({
  topBar,
  fab,
  navigation,
  secondaryNavigation,
  mobileNavigation,
  children,
  className,
  mainRef,
  disableScroll = false,
}) => {
  return (
    <div className={cn("flex flex-col h-full w-full bg-surface text-on-surface overflow-hidden relative isolate", className)}>
      {/* Mobile Drawer Overlay */}
      {mobileNavigation}

      {topBar && <div className="z-[30] flex-shrink-0 relative">{topBar}</div>}

      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Rail */}
        {navigation && <div className="z-[40] flex-shrink-0 relative hidden lg:flex">{navigation}</div>}
        
        {/* Desktop Secondary Nav */}
        {secondaryNavigation && <div className="z-[10] flex-shrink-0 relative hidden lg:block">{secondaryNavigation}</div>}

        <main 
          ref={mainRef as React.RefObject<HTMLElement>}
          className={cn(
            "flex-1 relative bg-surface z-0 min-w-0 flex flex-col",
            disableScroll ? "overflow-hidden" : "overflow-y-auto scroll-smooth"
          )}
        >
          <div className={cn("flex-1", disableScroll ? "overflow-hidden flex flex-col" : "")}>
            {children}
          </div>
          
          {fab && (
            <div className={cn(
              "z-[40] pointer-events-auto",
              "fixed bottom-6u right-4u lg:bottom-6u lg:right-6u", 
              disableScroll ? "absolute" : "md:absolute md:sticky md:float-right md:mr-6u md:mb-6u"
            )}>
              {fab}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};