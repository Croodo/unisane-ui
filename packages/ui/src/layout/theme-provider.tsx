"use client";

import React, { createContext, useContext, useEffect, useMemo } from "react";

export type Density = "compact" | "standard" | "comfortable" | "dense";

interface ThemeContextType {
  spaceScale: number;
  typeScale: number;
  radiusScale: number;
  density: Density;
  setSpaceScale: (scale: number) => void;
  setTypeScale: (scale: number) => void;
  setRadiusScale: (scale: number) => void;
  setDensity: (density: Density) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

const DENSITY_PRESETS: Record<Density, { space: number; type: number; radius: number }> = {
  dense: { space: 0.75, type: 0.85, radius: 0.8 },
  compact: { space: 0.85, type: 0.9, radius: 0.9 },
  standard: { space: 1, type: 1, radius: 1 },
  comfortable: { space: 1.1, type: 1, radius: 1.1 },
};

interface ThemeProviderProps {
  children: React.ReactNode;
  initialDensity?: Density;
}

export function ThemeProvider({
  children,
  initialDensity = "standard",
}: ThemeProviderProps) {
  const [density, setDensityState] = React.useState<Density>(initialDensity);
  const [spaceScale, setSpaceScale] = React.useState(DENSITY_PRESETS[initialDensity].space);
  const [typeScale, setTypeScale] = React.useState(DENSITY_PRESETS[initialDensity].type);
  const [radiusScale, setRadiusScale] = React.useState(DENSITY_PRESETS[initialDensity].radius);

  const setDensity = (d: Density) => {
    setDensityState(d);
    setSpaceScale(DENSITY_PRESETS[d].space);
    setTypeScale(DENSITY_PRESETS[d].type);
    setRadiusScale(DENSITY_PRESETS[d].radius);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--uni-sys-space-scale", spaceScale.toString());
    root.style.setProperty("--uni-sys-type-scale", typeScale.toString());
    root.style.setProperty("--uni-sys-radius-scale", radiusScale.toString());
  }, [spaceScale, typeScale, radiusScale]);

  const value = useMemo(
    () => ({
      spaceScale,
      typeScale,
      radiusScale,
      density,
      setSpaceScale,
      setTypeScale,
      setRadiusScale,
      setDensity,
    }),
    [spaceScale, typeScale, radiusScale, density]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
