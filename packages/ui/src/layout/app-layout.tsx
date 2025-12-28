"use client";

import React from "react";
import { cn } from "@ui/lib/utils";

export interface AppLayoutProps {
  topBar?: React.ReactNode;
  bottomBar?: React.ReactNode;
  fab?: React.ReactNode;
  navigation?: React.ReactNode;
  secondaryNavigation?: React.ReactNode;
  mobileNavigation?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  mainRef?: React.RefObject<HTMLElement | null>;
  disableScroll?: boolean;
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
      {mobileNavigation}

      {topBar && <div className="z-30 shrink-0 relative">{topBar}</div>}

      <div className="flex flex-1 overflow-hidden relative z-0">
        {navigation && (
          <div className="z-40 shrink-0 relative hidden medium:flex">
            {navigation}
          </div>
        )}

        {secondaryNavigation && (
          <div className="z-10 shrink-0 relative hidden expanded:block">
            {secondaryNavigation}
          </div>
        )}

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

          {fab && (
            <div
              className={cn(
                "z-40 pointer-events-auto",
                "fixed bottom-6 right-4 large:bottom-6 large:right-6",
                disableScroll
                  ? "absolute"
                  : "medium:sticky medium:float-right medium:mr-6 medium:mb-6"
              )}
            >
              {fab}
            </div>
          )}
        </main>
      </div>

      {bottomBar && <div className="z-30 shrink-0 relative">{bottomBar}</div>}
    </div>
  );
};
