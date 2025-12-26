import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
export type Density = "compact" | "standard" | "comfortable" | "dense";

interface ThemeProviderProps {
  children?: React.ReactNode;
  defaultTheme?: Theme;
  defaultDensity?: Density;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  density: Density;
  setDensity: (density: Density) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  defaultDensity = "standard",
}: ThemeProviderProps) {
  // Initialize state lazily from localStorage if available to prevent flash
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  const [density, setDensity] = useState<Density>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("density") as Density) || defaultDensity;
    }
    return defaultDensity;
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.toggle("dark", systemTheme === "dark");
      setResolvedTheme(systemTheme);
    } else {
      root.classList.toggle("dark", theme === "dark");
      setResolvedTheme(theme);
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-density", density);
    localStorage.setItem("density", density);
  }, [density]);

  useEffect(() => {
    if (theme !== "system") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const systemTheme = e.matches ? "dark" : "light";
      document.documentElement.classList.toggle("dark", e.matches);
      setResolvedTheme(systemTheme);
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Always return the Provider.
  // We can render children immediately because we initialize state from localStorage.
  // 'mounted' can be used for other client-specific rendering if needed, but the Provider must exist.
  return (
    <ThemeContext.Provider value={{ theme, setTheme, density, setDensity, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}