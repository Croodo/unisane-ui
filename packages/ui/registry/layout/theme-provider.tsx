"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

export type Density = "compact" | "standard" | "comfortable" | "dense";
export type Theme = "light" | "dark" | "system";
export type RadiusTheme = "none" | "minimal" | "sharp" | "standard" | "soft";

interface ThemeContextType {
  spaceScale: number;
  typeScale: number;
  radiusScale: number;
  density: Density;
  setSpaceScale: (scale: number) => void;
  setTypeScale: (scale: number) => void;
  setRadiusScale: (scale: number) => void;
  setDensity: (density: Density) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
  radiusTheme: RadiusTheme;
  setRadiusTheme: (radiusTheme: RadiusTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export function useColorScheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useColorScheme must be used within a ThemeProvider");
  }
  return {
    theme: context.theme,
    setTheme: context.setTheme,
    resolvedTheme: context.resolvedTheme,
  };
}

export function useDensity() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useDensity must be used within a ThemeProvider");
  }
  return {
    density: context.density,
    setDensity: context.setDensity,
    spaceScale: context.spaceScale,
    typeScale: context.typeScale,
    radiusScale: context.radiusScale,
  };
}

// Synced with CSS in uni-tokens.css [data-density="..."] selectors
const DENSITY_PRESETS: Record<
  Density,
  { space: number; type: number; radius: number }
> = {
  dense: { space: 0.75, type: 0.85, radius: 0.75 },
  compact: { space: 0.85, type: 0.9, radius: 0.8 },
  standard: { space: 1, type: 1, radius: 1.0 },
  comfortable: { space: 1.1, type: 1, radius: 1.0 },
};

// Synced with CSS in uni-tokens.css [data-radius="..."] selectors
// Scale affects all radius tokens: rounded-xs (4px), rounded-sm (8px), rounded-md (12px), etc.
const RADIUS_PRESETS: Record<RadiusTheme, number> = {
  none: 0,        // All corners squared (0px)
  minimal: 0.25,  // Very subtle: xs=1px, sm=2px, md=3px
  sharp: 0.5,     // Subtle rounding: xs=2px, sm=4px, md=6px
  standard: 1.0,  // Default M3: xs=4px, sm=8px, md=12px
  soft: 1.25,     // Extra rounded: xs=5px, sm=10px, md=15px
};

export interface ThemeConfig {
  density?: Density;
  theme?: Theme;
  radius?: RadiusTheme;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  config?: ThemeConfig;
  initialDensity?: Density;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  config,
  initialDensity,
  storageKey = "unisane-theme",
}: ThemeProviderProps) {
  // Config takes precedence - use config values as initial state
  const configDensity = config?.density || initialDensity || "standard";
  const configTheme = config?.theme || "system";
  const configRadius = config?.radius || "standard";

  // Initialize state directly from config (not hardcoded defaults)
  const [density, setDensityState] = useState<Density>(configDensity);
  const [spaceScale, setSpaceScale] = useState(DENSITY_PRESETS[configDensity].space);
  const [typeScale, setTypeScale] = useState(DENSITY_PRESETS[configDensity].type);
  const [radiusScale, setRadiusScaleState] = useState(RADIUS_PRESETS[configRadius]);

  const [theme, setThemeState] = useState<Theme>(configTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(
    configTheme === "dark" ? "dark" : configTheme === "light" ? "light" : "light"
  );

  const [radiusTheme, setRadiusThemeState] = useState<RadiusTheme>(configRadius);

  // Load from localStorage only for values not provided in config
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Start with config values (already set as initial state)
    let finalTheme: Theme = configTheme;
    let finalDensity: Density = configDensity;
    let finalRadiusTheme: RadiusTheme = configRadius;

    // Only load from localStorage for values NOT explicitly set in config
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Only use localStorage if config didn't provide these values
        if (!config?.theme && parsed.theme) finalTheme = parsed.theme;
        if (!config?.density && !initialDensity && parsed.density && parsed.density in DENSITY_PRESETS) {
          finalDensity = parsed.density as Density;
        }
        if (!config?.radius && parsed.radiusTheme) finalRadiusTheme = parsed.radiusTheme;
      } catch (e) {
        console.warn("Failed to parse theme from localStorage", e);
      }
    }

    // Apply final values
    setThemeState(finalTheme);
    setDensityState(finalDensity);
    setSpaceScale(DENSITY_PRESETS[finalDensity].space);
    setTypeScale(DENSITY_PRESETS[finalDensity].type);
    setRadiusThemeState(finalRadiusTheme);
    setRadiusScaleState(RADIUS_PRESETS[finalRadiusTheme]);
  }, [storageKey, config?.theme, config?.density, config?.radius, initialDensity, configTheme, configDensity, configRadius]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateResolvedTheme = () => {
      if (theme === "system") {
        setResolvedTheme(mediaQuery.matches ? "dark" : "light");
      } else {
        setResolvedTheme(theme);
      }
    };

    updateResolvedTheme();

    mediaQuery.addEventListener("change", updateResolvedTheme);
    return () => mediaQuery.removeEventListener("change", updateResolvedTheme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;

    // Dark mode via class (CSS handles color switching)
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Data attributes trigger CSS selectors in uni-tokens.css
    // No inline styles needed - CSS handles all scaling
    root.setAttribute("data-density", density);
    root.setAttribute("data-radius", radiusTheme);
  }, [resolvedTheme, density, radiusTheme]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    localStorage.setItem(
      storageKey,
      JSON.stringify({
        theme,
        density,
        radiusTheme,
      })
    );
  }, [theme, density, radiusTheme, storageKey]);

  const setDensity = useCallback((d: Density) => {
    setDensityState(d);
    setSpaceScale(DENSITY_PRESETS[d].space);
    setTypeScale(DENSITY_PRESETS[d].type);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
  }, []);

  const setRadiusTheme = useCallback((r: RadiusTheme) => {
    setRadiusThemeState(r);
    setRadiusScaleState(RADIUS_PRESETS[r]);
  }, []);

  const value = useMemo(
    () => ({
      spaceScale,
      typeScale,
      radiusScale,
      density,
      setSpaceScale,
      setTypeScale,
      setRadiusScale: setRadiusScaleState,
      setDensity,
      theme,
      setTheme,
      resolvedTheme,
      radiusTheme,
      setRadiusTheme,
    }),
    [spaceScale, typeScale, radiusScale, density, setDensity, theme, setTheme, resolvedTheme, radiusTheme, setRadiusTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
