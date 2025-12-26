"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface AppLayoutProps {
  topBar?: React.ReactNode;
  bottomBar?: React.ReactNode;
  fab?: React.ReactNode;
  navigation?: React.ReactNode; // Rail or Drawer
  secondaryNavigation?: React.ReactNode;
  mobileNavigation?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  mainRef?: React.RefObject<HTMLElement | null>;
  disableScroll?: boolean; // If true, the main area won't overflow-y-auto, letting children handle it.
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  topBar,
  bottomBar,
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
    <div
      className={cn(
        "flex flex-col h-full w-full bg-surface text-on-surface overflow-hidden relative isolate",
        className
      )}
    >
      {/* Mobile Drawer Overlay */}
      {mobileNavigation}

      {/* Top Bar Slot: Level 2 (z-30) */}
      {topBar && <div className="z-30 shrink-0 relative">{topBar}</div>}

      <div className="flex flex-1 overflow-hidden relative z-0">
        {/* Navigation Slot (Rail/Drawer): Level 2 (z-40) */}
        {navigation && (
          <div className="z-40 shrink-0 relative hidden medium:flex">
            {navigation}
          </div>
        )}

        {/* Expanded+ Secondary Nav */}
        {secondaryNavigation && (
          <div className="z-10 shrink-0 relative hidden expanded:block">
            {secondaryNavigation}
          </div>
        )}

        {/* Main Content Area: Level 0 (z-0) */}
        <main
          ref={mainRef as React.RefObject<HTMLElement>}
          className={cn(
            "flex-1 relative bg-surface z-0 min-w-0 flex flex-col",
            disableScroll ? "overflow-hidden" : "overflow-y-auto scroll-smooth"
          )}
        >
          <div
            className={cn(
              "flex-1",
              disableScroll ? "overflow-hidden flex flex-col" : ""
            )}
          >
            {children}
          </div>

          {/* FAB Slot: Level 3 (z-40) */}
          {fab && (
            <div
              className={cn(
                "z-40 pointer-events-auto",
                // Mobile: Fixed to viewport
                "fixed bottom-6u right-4u large:bottom-6u large:right-6u",
                // Desktop: Sticky/Absolute positioning fallback.
                disableScroll
                  ? "absolute"
                  : "medium:sticky medium:float-right medium:mr-6u medium:mb-6u"
              )}
            >
              {fab}
            </div>
          )}
        </main>
      </div>

      {/* Bottom Bar Slot: Level 2 (z-30) */}
      {bottomBar && <div className="z-30 shrink-0 relative">{bottomBar}</div>}
    </div>
  );
};
