import { useState, useEffect } from "react";
import type { NavigationBreakpoint } from "../types/navigation";

/**
 * Navigation breakpoint detection hook.
 *
 * Detects current viewport size and returns responsive breakpoint information.
 * Useful for adapting navigation behavior based on screen size.
 *
 * @example
 * ```tsx
 * const { isMobile, isTablet, isDesktop, breakpoint } = useNavigationBreakpoint();
 *
 * if (isMobile) {
 *   return <BottomNav />;
 * }
 * return <Sidebar />;
 * ```
 */
export function useNavigationBreakpoint(): NavigationBreakpoint {
  const [breakpoint, setBreakpoint] = useState<NavigationBreakpoint>(() => {
    if (typeof window === "undefined") {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        breakpoint: "desktop",
      };
    }

    const width = window.innerWidth;
    if (width < 768) {
      return {
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        breakpoint: "mobile",
      };
    }
    if (width < 1024) {
      return {
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        breakpoint: "tablet",
      };
    }
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      breakpoint: "desktop",
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      if (width < 768) {
        setBreakpoint({
          isMobile: true,
          isTablet: false,
          isDesktop: false,
          breakpoint: "mobile",
        });
      } else if (width < 1024) {
        setBreakpoint({
          isMobile: false,
          isTablet: true,
          isDesktop: false,
          breakpoint: "tablet",
        });
      } else {
        setBreakpoint({
          isMobile: false,
          isTablet: false,
          isDesktop: true,
          breakpoint: "desktop",
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return breakpoint;
}
