"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Density = "compact" | "standard" | "comfortable" | "dense";
export type Theme = "light" | "dark" | "system";
export type RadiusTheme = "none" | "minimal" | "sharp" | "standard" | "soft";
export type ColorScheme = "tonal" | "monochrome" | "neutral";
export type ContrastLevel = "standard" | "medium" | "high";

export interface ThemeConfig {
  density?: Density;
  theme?: Theme;
  radius?: RadiusTheme;
  scheme?: ColorScheme;
  contrast?: ContrastLevel;
}

interface ThemeContextType {
  density: Density;
  theme: Theme;
  resolvedTheme: "light" | "dark";
  radius: RadiusTheme;
  scheme: ColorScheme;
  contrast: ContrastLevel;
  setDensity: (density: Density) => void;
  setTheme: (theme: Theme) => void;
  setRadius: (radius: RadiusTheme) => void;
  setScheme: (scheme: ColorScheme) => void;
  setContrast: (contrast: ContrastLevel) => void;
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
  const { theme, setTheme, resolvedTheme } = useTheme();
  return { theme, setTheme, resolvedTheme };
}

export function useDensity() {
  const { density, setDensity } = useTheme();
  return { density, setDensity };
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

// Read current theme from DOM (source of truth)
function readFromDOM() {
  if (typeof document === "undefined") {
    return {
      density: "standard" as Density,
      radius: "standard" as RadiusTheme,
      scheme: "tonal" as ColorScheme,
      contrast: "standard" as ContrastLevel,
      theme: "light" as Theme,
      resolvedTheme: "light" as "light" | "dark",
    };
  }

  const root = document.documentElement;
  return {
    density: (root.getAttribute("data-density") || "standard") as Density,
    radius: (root.getAttribute("data-radius") || "standard") as RadiusTheme,
    scheme: (root.getAttribute("data-scheme") || "tonal") as ColorScheme,
    contrast: (root.getAttribute("data-contrast") || "standard") as ContrastLevel,
    theme: (root.classList.contains("dark") ? "dark" : "light") as Theme,
    resolvedTheme: (root.classList.contains("dark") ? "dark" : "light") as "light" | "dark",
  };
}

// Write to DOM (when user changes theme dynamically)
function writeToDOM(key: string, value: string) {
  const root = document.documentElement;

  if (key === "theme") {
    root.classList.toggle("dark", value === "dark");
  } else if (key === "scheme") {
    if (value === "tonal") {
      root.removeAttribute("data-scheme");
    } else {
      root.setAttribute("data-scheme", value);
    }
  } else if (key === "contrast") {
    if (value === "standard") {
      root.removeAttribute("data-contrast");
    } else {
      root.setAttribute("data-contrast", value);
    }
  } else {
    root.setAttribute(`data-${key}`, value);
  }
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Initialize from DOM
  const initial = readFromDOM();
  const [density, setDensityState] = useState<Density>(initial.density);
  const [theme, setThemeState] = useState<Theme>(initial.theme);
  const [radius, setRadiusState] = useState<RadiusTheme>(initial.radius);
  const [scheme, setSchemeState] = useState<ColorScheme>(initial.scheme);
  const [contrast, setContrastState] = useState<ContrastLevel>(initial.contrast);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(initial.resolvedTheme);

  // Setters that update both state and DOM
  const setDensity = (v: Density) => { setDensityState(v); writeToDOM("density", v); };
  const setRadius = (v: RadiusTheme) => { setRadiusState(v); writeToDOM("radius", v); };
  const setScheme = (v: ColorScheme) => { setSchemeState(v); writeToDOM("scheme", v); };
  const setContrast = (v: ContrastLevel) => { setContrastState(v); writeToDOM("contrast", v); };

  const setTheme = (v: Theme) => {
    setThemeState(v);
    if (v === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const resolved = isDark ? "dark" : "light";
      setResolvedTheme(resolved);
      writeToDOM("theme", resolved);
    } else {
      setResolvedTheme(v);
      writeToDOM("theme", v);
    }
  };

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const resolved = mediaQuery.matches ? "dark" : "light";
      setResolvedTheme(resolved);
      writeToDOM("theme", resolved);
    };

    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, [theme]);

  const value = useMemo<ThemeContextType>(
    () => ({
      density,
      theme,
      resolvedTheme,
      radius,
      scheme,
      contrast,
      setDensity,
      setTheme,
      setRadius,
      setScheme,
      setContrast,
    }),
    [density, theme, resolvedTheme, radius, scheme, contrast]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
