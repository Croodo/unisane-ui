"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Density = "compact" | "standard" | "comfortable" | "dense";
export type Theme = "light" | "dark" | "system";
export type RadiusTheme = "none" | "minimal" | "sharp" | "standard" | "soft";
export type ColorScheme = "tonal" | "monochrome" | "neutral";
export type ContrastLevel = "standard" | "medium" | "high";
export type ColorTheme = "blue" | "purple" | "pink" | "red" | "orange" | "yellow" | "green" | "cyan" | "neutral" | "black";
export type Elevation = "flat" | "subtle" | "standard" | "pronounced";

export interface ThemeConfig {
  density?: Density;
  theme?: Theme;
  radius?: RadiusTheme;
  scheme?: ColorScheme;
  contrast?: ContrastLevel;
  colorTheme?: ColorTheme;
  elevation?: Elevation;
}

interface ThemeContextType {
  density: Density;
  theme: Theme;
  resolvedTheme: "light" | "dark";
  radius: RadiusTheme;
  scheme: ColorScheme;
  contrast: ContrastLevel;
  colorTheme: ColorTheme;
  elevation: Elevation;
  setDensity: (density: Density) => void;
  setTheme: (theme: Theme) => void;
  setRadius: (radius: RadiusTheme) => void;
  setScheme: (scheme: ColorScheme) => void;
  setContrast: (contrast: ContrastLevel) => void;
  setColorTheme: (colorTheme: ColorTheme) => void;
  setElevation: (elevation: Elevation) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "unisane-theme";

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
  /**
   * Storage key for persisting theme. Set to `false` to disable persistence.
   * When disabled, HTML attributes become the source of truth.
   */
  storageKey?: string | false;
}

// Fallback defaults (only used if HTML attributes are missing)
const DEFAULTS: Required<ThemeConfig> = {
  density: "standard",
  theme: "system",
  radius: "standard",
  scheme: "tonal",
  contrast: "standard",
  colorTheme: "blue",
  elevation: "standard",
};

// Read initial values from HTML attributes (SSR source of truth)
function getInitialFromDOM(): Partial<ThemeConfig> {
  if (typeof document === "undefined") return {};
  const root = document.documentElement;
  return {
    density: root.getAttribute("data-density") as Density | undefined,
    radius: root.getAttribute("data-radius") as RadiusTheme | undefined,
    scheme: root.getAttribute("data-scheme") as ColorScheme | undefined,
    contrast: root.getAttribute("data-contrast") as ContrastLevel | undefined,
    colorTheme: root.getAttribute("data-theme") as ColorTheme | undefined,
    theme: root.getAttribute("data-theme-mode") as Theme | undefined,
    elevation: root.getAttribute("data-elevation") as Elevation | undefined,
  };
}

// Get stored values from localStorage
function getStoredConfig(storageKey: string | false): Partial<ThemeConfig> {
  if (!storageKey || typeof localStorage === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "{}");
  } catch {
    return {};
  }
}

// Persist to localStorage
function persist(key: string, value: string, storageKey: string | false) {
  if (!storageKey) return;
  try {
    const current = JSON.parse(localStorage.getItem(storageKey) || "{}");
    current[key] = value;
    localStorage.setItem(storageKey, JSON.stringify(current));
  } catch {
    // Ignore storage errors
  }
}

// Apply a single attribute to DOM
function applyAttribute(attr: string, value: string) {
  document.documentElement.setAttribute(attr, value);
}

// Resolve dark mode
function resolveDarkMode(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

// Apply dark mode class
function applyDarkMode(resolved: "light" | "dark") {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

export function ThemeProvider({
  children,
  storageKey = STORAGE_KEY,
}: ThemeProviderProps) {
  // Priority: localStorage > HTML attributes > DEFAULTS
  // This allows HTML attributes to be the SSR source of truth,
  // while localStorage preserves user changes across sessions.
  const domValues = typeof window !== "undefined" ? getInitialFromDOM() : {};
  const stored = getStoredConfig(storageKey);

  const initialConfig: Required<ThemeConfig> = {
    density: stored.density ?? domValues.density ?? DEFAULTS.density,
    theme: stored.theme ?? domValues.theme ?? DEFAULTS.theme,
    radius: stored.radius ?? domValues.radius ?? DEFAULTS.radius,
    scheme: stored.scheme ?? domValues.scheme ?? DEFAULTS.scheme,
    contrast: stored.contrast ?? domValues.contrast ?? DEFAULTS.contrast,
    colorTheme: stored.colorTheme ?? domValues.colorTheme ?? DEFAULTS.colorTheme,
    elevation: stored.elevation ?? domValues.elevation ?? DEFAULTS.elevation,
  };

  const [density, setDensityState] = useState<Density>(initialConfig.density);
  const [theme, setThemeState] = useState<Theme>(initialConfig.theme);
  const [radius, setRadiusState] = useState<RadiusTheme>(initialConfig.radius);
  const [scheme, setSchemeState] = useState<ColorScheme>(initialConfig.scheme);
  const [contrast, setContrastState] = useState<ContrastLevel>(initialConfig.contrast);
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(initialConfig.colorTheme);
  const [elevation, setElevationState] = useState<Elevation>(initialConfig.elevation);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return resolveDarkMode(initialConfig.theme);
  });

  // Sync DOM on mount (in case state differs from SSR HTML)
  useEffect(() => {
    applyAttribute("data-density", density);
    applyAttribute("data-radius", radius);
    applyAttribute("data-scheme", scheme);
    applyAttribute("data-contrast", contrast);
    applyAttribute("data-theme", colorTheme);
    applyAttribute("data-theme-mode", theme);
    applyAttribute("data-elevation", elevation);

    const resolved = resolveDarkMode(theme);
    applyDarkMode(resolved);
    setResolvedTheme(resolved);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setDensity = (v: Density) => {
    setDensityState(v);
    applyAttribute("data-density", v);
    persist("density", v, storageKey);
  };

  const setRadius = (v: RadiusTheme) => {
    setRadiusState(v);
    applyAttribute("data-radius", v);
    persist("radius", v, storageKey);
  };

  const setScheme = (v: ColorScheme) => {
    setSchemeState(v);
    applyAttribute("data-scheme", v);
    persist("scheme", v, storageKey);
  };

  const setContrast = (v: ContrastLevel) => {
    setContrastState(v);
    applyAttribute("data-contrast", v);
    persist("contrast", v, storageKey);
  };

  const setColorTheme = (v: ColorTheme) => {
    setColorThemeState(v);
    applyAttribute("data-theme", v);
    persist("colorTheme", v, storageKey);
  };

  const setElevation = (v: Elevation) => {
    setElevationState(v);
    applyAttribute("data-elevation", v);
    persist("elevation", v, storageKey);
  };

  const setTheme = (v: Theme) => {
    setThemeState(v);
    applyAttribute("data-theme-mode", v);
    persist("theme", v, storageKey);

    const resolved = resolveDarkMode(v);
    setResolvedTheme(resolved);
    applyDarkMode(resolved);
  };

  // Listen for system theme changes when in "system" mode
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const resolved = mediaQuery.matches ? "dark" : "light";
      setResolvedTheme(resolved);
      applyDarkMode(resolved);
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
      colorTheme,
      elevation,
      setDensity,
      setTheme,
      setRadius,
      setScheme,
      setContrast,
      setColorTheme,
      setElevation,
    }),
    [density, theme, resolvedTheme, radius, scheme, contrast, colorTheme, elevation]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * Clears stored theme preferences, resetting to HTML attribute defaults.
 * Useful for testing or providing a "reset to defaults" option.
 */
export function clearStoredTheme(storageKey: string = STORAGE_KEY) {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(storageKey);
  }
}
