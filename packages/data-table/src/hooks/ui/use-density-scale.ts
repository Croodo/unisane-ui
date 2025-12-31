"use client";

import { useState, useEffect } from "react";

/**
 * Scale factors for each density level as defined in the Unisane theming system.
 * These match the CSS [data-density="*"] rules in unisane.css.
 */
const DENSITY_SCALE_MAP = {
  compact: 0.875,
  dense: 0.75,
  standard: 1,
  comfortable: 1.1,
} as const;

/**
 * Hook to get the current density scale factor from the global theme.
 *
 * This reads the `data-density` attribute from the <html> element and returns
 * the corresponding scale factor. The scale factor can be used to multiply
 * base dimensions (like row heights) to match the current theme density.
 *
 * @returns The current density scale factor (0.75 - 1.1)
 *
 * @example
 * ```tsx
 * const scale = useDensityScale();
 * const scaledRowHeight = Math.round(52 * scale); // 52px at standard, ~45px at dense
 * ```
 */
export function useDensityScale(): number {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function updateScale() {
      const density = document.documentElement.getAttribute("data-density");
      const scaleValue = density && density in DENSITY_SCALE_MAP
        ? DENSITY_SCALE_MAP[density as keyof typeof DENSITY_SCALE_MAP]
        : 1;
      setScale(scaleValue);
    }

    // Initial read
    updateScale();

    // Watch for changes to the data-density attribute
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes" && mutation.attributeName === "data-density") {
          updateScale();
          break;
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-density"],
    });

    return () => observer.disconnect();
  }, []);

  return scale;
}

/**
 * Get the density scale factor synchronously (for SSR or initial render).
 * Falls back to 1 (standard density) on the server.
 */
export function getDensityScale(): number {
  if (typeof document === "undefined") return 1;

  const density = document.documentElement.getAttribute("data-density");
  return density && density in DENSITY_SCALE_MAP
    ? DENSITY_SCALE_MAP[density as keyof typeof DENSITY_SCALE_MAP]
    : 1;
}

export { DENSITY_SCALE_MAP };
