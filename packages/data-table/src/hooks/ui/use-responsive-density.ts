"use client";

import { useState, useEffect, useCallback } from "react";
import type { Density } from "../../types";

/**
 * Breakpoint for mobile detection (matches Tailwind sm: 640px).
 * Below this width, density defaults to "compact" for better touch experience.
 */
const MOBILE_BREAKPOINT = 640;

export interface UseResponsiveDensityOptions {
  /**
   * The density to use on larger screens.
   * @default "standard"
   */
  defaultDensity?: Density;

  /**
   * The density to use on mobile screens (below MOBILE_BREAKPOINT).
   * @default "compact"
   */
  mobileDensity?: Density;

  /**
   * Custom breakpoint for mobile detection.
   * @default 640
   */
  mobileBreakpoint?: number;
}

export interface UseResponsiveDensityReturn {
  /** The current density value based on screen size and user selection */
  density: Density;

  /** Whether the current screen is considered mobile */
  isMobile: boolean;

  /** Update the density (will be overridden by mobile detection if on mobile) */
  setDensity: (density: Density) => void;

  /** The user's selected density (ignoring responsive override) */
  userDensity: Density;
}

/**
 * Hook that provides responsive density management for DataTable.
 *
 * On mobile screens (< 640px by default), the density automatically
 * switches to "compact" for better touch experience and space efficiency.
 * Users can still manually change the density, which takes precedence.
 *
 * @example
 * ```tsx
 * function MyTable() {
 *   const { density, setDensity, isMobile } = useResponsiveDensity({
 *     defaultDensity: "standard",
 *     mobileDensity: "compact",
 *   });
 *
 *   return (
 *     <DataTableToolbar
 *       density={density}
 *       onDensityChange={setDensity}
 *     />
 *   );
 * }
 * ```
 */
export function useResponsiveDensity(
  options: UseResponsiveDensityOptions = {}
): UseResponsiveDensityReturn {
  const {
    defaultDensity = "standard",
    mobileDensity = "compact",
    mobileBreakpoint = MOBILE_BREAKPOINT,
  } = options;

  // Track user's explicit density selection
  const [userDensity, setUserDensity] = useState<Density>(defaultDensity);

  // Track whether user has explicitly changed density
  const [hasUserOverride, setHasUserOverride] = useState(false);

  // Track mobile state
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };

    // Initial check
    checkMobile();

    // Listen for resize
    const mediaQuery = window.matchMedia(`(max-width: ${mobileBreakpoint - 1}px)`);

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    // Fallback for older browsers
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [mobileBreakpoint]);

  // Handler for user density changes
  const setDensity = useCallback((newDensity: Density) => {
    setUserDensity(newDensity);
    setHasUserOverride(true);
  }, []);

  // Compute effective density
  // If on mobile and user hasn't explicitly changed density, use mobile density
  const density = isMobile && !hasUserOverride ? mobileDensity : userDensity;

  return {
    density,
    isMobile,
    setDensity,
    userDensity,
  };
}
