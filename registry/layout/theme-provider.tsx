"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Density = "compact" | "standard" | "comfortable" | "dense";
export type Theme = "light" | "dark" | "system";
export type RadiusTheme = "sharp" | "standard" | "soft";

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
const RADIUS_PRESETS: Record<RadiusTheme, number> = {
  sharp: 0.75,
  standard: 1.0,
  soft: 1.15,
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
  const configDensity = config?.density || initialDensity || "standard";
  const configTheme = config?.theme || "system";
  const configRadius = config?.radius || "standard";

  const [density, setDensityState] = useState<Density>(configDensity);
  const [spaceScale, setSpaceScale] = useState(
    DENSITY_PRESETS[configDensity].space
  );
  const [typeScale, setTypeScale] = useState(
    DENSITY_PRESETS[configDensity].type
  );
  const [radiusScale, setRadiusScaleState] = useState(
    DENSITY_PRESETS[configDensity].radius
  );

  const [theme, setThemeState] = useState<Theme>(configTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  const [radiusTheme, setRadiusThemeState] =
    useState<RadiusTheme>(configRadius);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.theme) setThemeState(parsed.theme);
        if (parsed.density && parsed.density in DENSITY_PRESETS) {
          const density = parsed.density as Density;
          setDensityState(density);
          setSpaceScale(DENSITY_PRESETS[density].space);
          setTypeScale(DENSITY_PRESETS[density].type);
        }
        if (parsed.radiusTheme) setRadiusThemeState(parsed.radiusTheme);
      } catch (e) {
        console.warn("Failed to parse theme from localStorage", e);
      }
    }
  }, [storageKey]);

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

  const setDensity = (d: Density) => {
    setDensityState(d);
    setSpaceScale(DENSITY_PRESETS[d].space);
    setTypeScale(DENSITY_PRESETS[d].type);
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  const setRadiusTheme = (r: RadiusTheme) => {
    setRadiusThemeState(r);
    setRadiusScaleState(RADIUS_PRESETS[r]);
  };

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
    [spaceScale, typeScale, radiusScale, density, theme, resolvedTheme, radiusTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
