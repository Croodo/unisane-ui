import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    // Set initial value
    setMatches(media.matches);

    // Create listener
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Add listener
    media.addEventListener("change", listener);

    return () => {
      media.removeEventListener("change", listener);
    };
  }, [query]);

  return matches;
}

// Convenience hooks for common breakpoints
export function useBreakpoint(breakpoint: "compact" | "medium" | "expanded" | "large" | "extra-large") {
  const queries = {
    compact: "(max-width: 599px)",
    medium: "(min-width: 600px) and (max-width: 839px)",
    expanded: "(min-width: 840px) and (max-width: 1199px)",
    large: "(min-width: 1200px) and (max-width: 1599px)",
    "extra-large": "(min-width: 1600px)",
  };

  return useMediaQuery(queries[breakpoint]);
}

export function useIsMobile() {
  return useMediaQuery("(max-width: 599px)");
}

export function useIsDesktop() {
  return useMediaQuery("(min-width: 840px)");
}