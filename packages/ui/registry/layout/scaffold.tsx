"use client";

import { type ReactNode } from "react";
import { useWindowSize } from "./window-size-provider.js";

interface ScaffoldProps {
  children: ReactNode;
  topBar?: ReactNode;
  navigation?: ReactNode;
  content?: ReactNode;
  fab?: ReactNode;
  bottomBar?: ReactNode;
}

export function Scaffold({
  children,
  topBar,
  navigation,
  content,
  fab,
  bottomBar,
}: ScaffoldProps) {
  const { sizeClass } = useWindowSize();

  // Determine navigation pattern based on window size class
  const getNavigationLayout = () => {
    switch (sizeClass) {
      case "compact":
        return "bottom-nav";
      case "medium":
      case "expanded":
        return "nav-rail";
      case "large":
      case "xlarge":
        return "drawer";
      default:
        return "bottom-nav";
    }
  };

  const navigationLayout = getNavigationLayout();

  return (
    <div className="min-h-screen bg-background text-on-background">
      {/* Top App Bar */}
      {topBar && (
        <header className="sticky top-0 z-50 bg-surface text-on-surface shadow-1">
          {topBar}
        </header>
      )}

      <div className="flex min-h-[calc(100vh-64px)]">
        {/* Navigation */}
        {navigation && (
          <>
            {navigationLayout === "drawer" && (
              <nav className="hidden lg:block w-80 bg-surface text-on-surface border-r border-outline-variant">
                {navigation}
              </nav>
            )}

            {navigationLayout === "nav-rail" && (
              <nav className="hidden md:block w-20 bg-surface text-on-surface border-r border-outline-variant">
                {navigation}
              </nav>
            )}
          </>
        )}

        {/* Main Content */}
        <main className="flex-1">{content || children}</main>
      </div>

      {/* Floating Action Button */}
      {fab && (
        <div className="fixed bottom-24 right-6 z-40 md:bottom-6">{fab}</div>
      )}

      {/* Bottom Navigation (compact only) */}
      {navigationLayout === "bottom-nav" && navigation && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface text-on-surface border-t border-outline-variant lg:hidden">
          {navigation}
        </nav>
      )}

      {/* Bottom Bar */}
      {bottomBar && (
        <footer className="bg-surface text-on-surface border-t border-outline-variant">
          {bottomBar}
        </footer>
      )}
    </div>
  );
}
