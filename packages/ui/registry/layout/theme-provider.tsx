"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

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

// Color hue mapping (must match theme-script.ts)
const COLOR_THEMES: Record<ColorTheme, { hue: number; chroma: number }> = {
  blue: { hue: 240, chroma: 0.13 },
  purple: { hue: 285, chroma: 0.14 },
  pink: { hue: 340, chroma: 0.15 },
  red: { hue: 25, chroma: 0.16 },
  orange: { hue: 55, chroma: 0.16 },
  yellow: { hue: 85, chroma: 0.14 },
  green: { hue: 145, chroma: 0.14 },
  cyan: { hue: 195, chroma: 0.12 },
  neutral: { hue: 60, chroma: 0.02 },
  black: { hue: 0, chroma: 0 },
};

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
  storageKey?: string;
  disableStorage?: boolean;
}

// Read theme from DOM (set by blocking script in <head>)
function readFromDOM(): {
  density: Density;
  radius: RadiusTheme;
  scheme: ColorScheme;
  contrast: ContrastLevel;
  colorTheme: ColorTheme;
  theme: Theme;
  resolvedTheme: "light" | "dark";
} {
  if (typeof document === "undefined") {
    return {
      density: "standard",
      radius: "standard",
      scheme: "tonal",
      contrast: "standard",
      colorTheme: "blue",
      theme: "system",
      resolvedTheme: "light",
    };
  }

  const root = document.documentElement;

  return {
    density: (root.getAttribute("data-density") || "standard") as Density,
    radius: (root.getAttribute("data-radius") || "standard") as RadiusTheme,
    scheme: (root.getAttribute("data-scheme") || "tonal") as ColorScheme,
    contrast: (root.getAttribute("data-contrast") || "standard") as ContrastLevel,
    colorTheme: (root.getAttribute("data-theme") || "blue") as ColorTheme,
    theme: (root.getAttribute("data-theme-mode") || "system") as Theme,
    resolvedTheme: root.classList.contains("dark") ? "dark" : "light",
  };
}

// Update inline style tag with new color values (prevents flicker on theme change)
function updateInlineStyles(colorTheme: ColorTheme, resolvedTheme: "light" | "dark") {
  const color = COLOR_THEMES[colorTheme] || COLOR_THEMES.blue;
  let styleEl = document.getElementById("unisane-theme-init") as HTMLStyleElement | null;

  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "unisane-theme-init";
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
:root {
  --hue: ${color.hue};
  --chroma: ${color.chroma};
  color-scheme: ${resolvedTheme};
}
`.trim();
}

// Update DOM and persist to localStorage
function updateDOM(key: string, value: string, storageKey: string, disableStorage: boolean) {
  const root = document.documentElement;

  switch (key) {
    case "resolvedTheme":
      root.classList.toggle("dark", value === "dark");
      break;
    case "theme":
      root.setAttribute("data-theme-mode", value);
      break;
    case "colorTheme":
      root.setAttribute("data-theme", value);
      break;
    default:
      root.setAttribute(`data-${key}`, value);
  }

  // Persist to localStorage
  if (!disableStorage) {
    try {
      const current = JSON.parse(localStorage.getItem(storageKey) || "{}");
      current[key] = value;
      localStorage.setItem(storageKey, JSON.stringify(current));
    } catch {
      // Ignore storage errors
    }
  }
}

export function ThemeProvider({
  children,
  storageKey = STORAGE_KEY,
  disableStorage = false,
}: ThemeProviderProps) {
  // Read initial values from DOM (already set by blocking script)
  const initial = readFromDOM();

  const [density, setDensityState] = useState<Density>(initial.density);
  const [theme, setThemeState] = useState<Theme>(initial.theme);
  const [radius, setRadiusState] = useState<RadiusTheme>(initial.radius);
  const [scheme, setSchemeState] = useState<ColorScheme>(initial.scheme);
  const [contrast, setContrastState] = useState<ContrastLevel>(initial.contrast);
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(initial.colorTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(initial.resolvedTheme);

  // Setters
  const setDensity = (v: Density) => {
    setDensityState(v);
    updateDOM("density", v, storageKey, disableStorage);
  };

  const setRadius = (v: RadiusTheme) => {
    setRadiusState(v);
    updateDOM("radius", v, storageKey, disableStorage);
  };

  const setScheme = (v: ColorScheme) => {
    setSchemeState(v);
    updateDOM("scheme", v, storageKey, disableStorage);
  };

  const setContrast = (v: ContrastLevel) => {
    setContrastState(v);
    updateDOM("contrast", v, storageKey, disableStorage);
  };

  const setColorTheme = (v: ColorTheme) => {
    setColorThemeState(v);
    updateDOM("colorTheme", v, storageKey, disableStorage);
    // Also update inline styles to prevent flicker
    updateInlineStyles(v, resolvedTheme);
  };

  const setTheme = (v: Theme) => {
    setThemeState(v);
    updateDOM("theme", v, storageKey, disableStorage);

    let resolved: "light" | "dark";
    if (v === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      resolved = v;
    }

    setResolvedTheme(resolved);
    updateDOM("resolvedTheme", resolved, storageKey, disableStorage);
    updateInlineStyles(colorTheme, resolved);
  };

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const resolved = mediaQuery.matches ? "dark" : "light";
      setResolvedTheme(resolved);
      updateDOM("resolvedTheme", resolved, storageKey, disableStorage);
      updateInlineStyles(colorTheme, resolved);
    };

    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, [theme, colorTheme, storageKey, disableStorage]);

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
