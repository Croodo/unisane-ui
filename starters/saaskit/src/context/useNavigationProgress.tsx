"use client";

import { create } from "zustand";
import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// ============================================================================
// Store Types
// ============================================================================

interface NavigationProgressState {
  /** Whether navigation is in progress */
  isNavigating: boolean;
  /** Current progress value (0-100) */
  progress: number;
  /** Start navigation with optional initial progress */
  start: (initialProgress?: number) => void;
  /** Set progress to a specific value */
  setProgress: (progress: number) => void;
  /** Complete the navigation (animate to 100% then hide) */
  done: () => void;
  /** Reset state immediately (no animation) */
  reset: () => void;
}

// ============================================================================
// Zustand Store
// ============================================================================

export const useNavigationProgressStore = create<NavigationProgressState>(
  (set) => ({
    isNavigating: false,
    progress: 0,

    start: (initialProgress = 10) => {
      set({ isNavigating: true, progress: initialProgress });
    },

    setProgress: (progress) => {
      set({ progress: Math.min(progress, 99) }); // Never reach 100 until done()
    },

    done: () => {
      set({ progress: 100 });
      // Hide after animation completes
      setTimeout(() => {
        set({ isNavigating: false, progress: 0 });
      }, 200);
    },

    reset: () => {
      set({ isNavigating: false, progress: 0 });
    },
  })
);

// ============================================================================
// Navigation Progress Bar Component
// ============================================================================

// Safety timeout - reset progress if stuck for too long (10 seconds)
const SAFETY_TIMEOUT = 10000;

/**
 * Renders a thin progress bar at the top of the viewport.
 * Automatically shows during navigation and hides when complete.
 * Uses event delegation to detect clicks on internal navigation links.
 *
 * @example
 * ```tsx
 * // In your shell/layout component
 * <NavigationProgress />
 * ```
 */
export function NavigationProgress() {
  const { isNavigating, progress, start, setProgress, done, reset } =
    useNavigationProgressStore();

  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Refs for timers
  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousPathRef = useRef<string | null>(null);
  const pendingNavigationRef = useRef<string | null>(null);

  // Helper to clear all timers
  const clearAllTimers = () => {
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
      delayTimeoutRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }
  };

  // Helper to start progress animation
  const startProgress = (targetHref?: string) => {
    clearAllTimers();

    // Store the target href to detect same-page navigation
    pendingNavigationRef.current = targetHref ?? null;

    // Delay before showing to avoid flicker on fast navigations (150ms)
    delayTimeoutRef.current = setTimeout(() => {
      start(10);

      // Simulate gradual progress
      let currentProgress = 10;
      progressIntervalRef.current = setInterval(() => {
        const increment =
          currentProgress < 50 ? 10 : currentProgress < 80 ? 5 : 2;
        currentProgress = Math.min(currentProgress + increment, 90);
        setProgress(currentProgress);

        if (currentProgress >= 90 && progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }, 200);

      // Safety timeout - reset if stuck
      safetyTimeoutRef.current = setTimeout(() => {
        clearAllTimers();
        reset();
      }, SAFETY_TIMEOUT);
    }, 150);
  };

  // Track URL changes to complete progress
  useEffect(() => {
    const currentPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");

    // On initial mount, just store the path
    if (previousPathRef.current === null) {
      previousPathRef.current = currentPath;
      return;
    }

    // Path changed - complete the progress if we were navigating
    if (previousPathRef.current !== currentPath) {
      clearAllTimers();

      // Check if store says we're navigating (use getState for current value)
      const { isNavigating: wasNavigating } = useNavigationProgressStore.getState();
      if (wasNavigating) {
        done();
      }

      pendingNavigationRef.current = null;
    }

    previousPathRef.current = currentPath;
  }, [pathname, searchParams, done]);

  // Event delegation: listen for clicks on anchor tags
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Find the closest anchor element
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (!anchor) return;

      // Skip if modifier keys are pressed (new tab/window)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      // Skip if default is prevented
      if (e.defaultPrevented) return;

      // Skip external links
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      // Skip hash-only links
      if (href.startsWith("#")) return;

      // Skip if target is not _self
      const linkTarget = anchor.getAttribute("target");
      if (linkTarget && linkTarget !== "_self") return;

      // Skip download links
      if (anchor.hasAttribute("download")) return;

      // Get current path for comparison
      const currentPath = previousPathRef.current;

      // Normalize the href to compare with current path
      // Handle relative paths by resolving against current location
      let normalizedHref = href;
      try {
        const url = new URL(href, window.location.origin);
        normalizedHref = url.pathname + url.search;
      } catch {
        // Keep original href if URL parsing fails
      }

      // Skip if clicking on the same page (no navigation will occur)
      if (currentPath && normalizedHref === currentPath) {
        return;
      }

      // Also skip if href matches current pathname (without query)
      const currentPathname = pathname;
      const hrefPathname = normalizedHref.split("?")[0];
      if (hrefPathname === currentPathname && !normalizedHref.includes("?")) {
        // Same pathname and no query params in link - likely same page
        return;
      }

      // This is an internal navigation to a different page - start the progress bar
      startProgress(normalizedHref);
    };

    // Use capture phase to catch events before they're handled
    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      clearAllTimers();
    };
  }, [pathname, start, setProgress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  // This is a headless component - it only handles click detection and URL tracking
  // The actual progress bar UI is rendered by NavigationProgressBar in PageHeader
  return null;
}

// ============================================================================
// Selector Hooks
// ============================================================================

/** Get navigation state */
export const useIsNavigating = () =>
  useNavigationProgressStore((s) => s.isNavigating);

/** Get current progress */
export const useProgress = () => useNavigationProgressStore((s) => s.progress);
