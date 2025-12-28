"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useLayoutEffect } from "react";

export type Density = "compact" | "standard" | "comfortable" | "dense";
export type Theme = "light" | "dark" | "system";
export type RadiusTheme = "none" | "minimal" | "sharp" | "standard" | "soft";
export type ColorScheme = "tonal" | "monochrome" | "neutral";
export type ContrastLevel = "standard" | "medium" | "high";
export type ColorTheme = "blue" | "purple" | "pink" | "red" | "orange" | "yellow" | "green" | "cyan" | "neutral" | "black";

export interface ThemeConfig {
  density?: Density;
  theme?: Theme;
  radius?: RadiusTheme;
  scheme?: ColorScheme;
  contrast?: ContrastLevel;
  colorTheme?: ColorTheme;
}

interface ThemeContextType {
  density: Density;
  theme: Theme;
  resolvedTheme: "light" | "dark";
  radius: RadiusTheme;
  scheme: ColorScheme;
  contrast: ContrastLevel;
  colorTheme: ColorTheme;
  setDensity: (density: Density) => void;
  setTheme: (theme: Theme) => void;
  setRadius: (radius: RadiusTheme) => void;
  setScheme: (scheme: ColorScheme) => void;
  setContrast: (contrast: ContrastLevel) => void;
  setColorTheme: (colorTheme: ColorTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "unisane-theme";

// Use useLayoutEffect on client, useEffect on server
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
  defaultConfig?: ThemeConfig;
  storageKey?: string;
}

const DEFAULTS: Required<ThemeConfig> = {
  density: "standard",
  theme: "system",
  radius: "standard",
  scheme: "tonal",
  contrast: "standard",
  colorTheme: "blue",
};

// Get stored values from localStorage
function getStoredConfig(storageKey: string): Partial<ThemeConfig> {
  if (typeof localStorage === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "{}");
  } catch {
    return {};
  }
}

// Persist to localStorage
function persist(key: string, value: string, storageKey: string) {
  try {
    const current = JSON.parse(localStorage.getItem(storageKey) || "{}");
    current[key] = value;
    localStorage.setItem(storageKey, JSON.stringify(current));
  } catch {
    // Ignore storage errors
  }
}

// Apply theme to DOM
function applyToDOM(config: Required<ThemeConfig>) {
  const root = document.documentElement;

  root.setAttribute("data-density", config.density);
  root.setAttribute("data-radius", config.radius);
  root.setAttribute("data-scheme", config.scheme);
  root.setAttribute("data-contrast", config.contrast);
  root.setAttribute("data-theme", config.colorTheme);
  root.setAttribute("data-theme-mode", config.theme);

  // Handle dark mode
  let isDark: boolean;
  if (config.theme === "system") {
    isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  } else {
    isDark = config.theme === "dark";
  }

  root.classList.toggle("dark", isDark);
  root.style.colorScheme = isDark ? "dark" : "light";

  return isDark ? "dark" : "light";
}

export function ThemeProvider({
  children,
  defaultConfig,
  storageKey = STORAGE_KEY,
}: ThemeProviderProps) {
  // Merge: stored > defaultConfig > DEFAULTS
  const stored = typeof window !== "undefined" ? getStoredConfig(storageKey) : {};

  const initialConfig: Required<ThemeConfig> = {
    density: stored.density ?? defaultConfig?.density ?? DEFAULTS.density,
    theme: stored.theme ?? defaultConfig?.theme ?? DEFAULTS.theme,
    radius: stored.radius ?? defaultConfig?.radius ?? DEFAULTS.radius,
    scheme: stored.scheme ?? defaultConfig?.scheme ?? DEFAULTS.scheme,
    contrast: stored.contrast ?? defaultConfig?.contrast ?? DEFAULTS.contrast,
    colorTheme: stored.colorTheme ?? defaultConfig?.colorTheme ?? DEFAULTS.colorTheme,
  };

  const [density, setDensityState] = useState<Density>(initialConfig.density);
  const [theme, setThemeState] = useState<Theme>(initialConfig.theme);
  const [radius, setRadiusState] = useState<RadiusTheme>(initialConfig.radius);
  const [scheme, setSchemeState] = useState<ColorScheme>(initialConfig.scheme);
  const [contrast, setContrastState] = useState<ContrastLevel>(initialConfig.contrast);
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(initialConfig.colorTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  // Apply theme to DOM on mount
  useIsomorphicLayoutEffect(() => {
    const resolved = applyToDOM({
      density,
      theme,
      radius,
      scheme,
      contrast,
      colorTheme,
    });
    setResolvedTheme(resolved as "light" | "dark");
  }, []);

  const setDensity = (v: Density) => {
    setDensityState(v);
    document.documentElement.setAttribute("data-density", v);
    persist("density", v, storageKey);
  };

  const setRadius = (v: RadiusTheme) => {
    setRadiusState(v);
    document.documentElement.setAttribute("data-radius", v);
    persist("radius", v, storageKey);
  };

  const setScheme = (v: ColorScheme) => {
    setSchemeState(v);
    document.documentElement.setAttribute("data-scheme", v);
    persist("scheme", v, storageKey);
  };

  const setContrast = (v: ContrastLevel) => {
    setContrastState(v);
    document.documentElement.setAttribute("data-contrast", v);
    persist("contrast", v, storageKey);
  };

  const setColorTheme = (v: ColorTheme) => {
    setColorThemeState(v);
    document.documentElement.setAttribute("data-theme", v);
    persist("colorTheme", v, storageKey);
  };

  const setTheme = (v: Theme) => {
    setThemeState(v);
    document.documentElement.setAttribute("data-theme-mode", v);
    persist("theme", v, storageKey);

    let resolved: "light" | "dark";
    if (v === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      resolved = v;
    }

    setResolvedTheme(resolved);
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.style.colorScheme = resolved;
  };

  // Listen for system theme changes when in "system" mode
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const resolved = mediaQuery.matches ? "dark" : "light";
      setResolvedTheme(resolved);
      document.documentElement.classList.toggle("dark", resolved === "dark");
      document.documentElement.style.colorScheme = resolved;
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
      setDensity,
      setTheme,
      setRadius,
      setScheme,
      setContrast,
      setColorTheme,
    }),
    [density, theme, resolvedTheme, radius, scheme, contrast, colorTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
