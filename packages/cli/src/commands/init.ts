import { promises as fs } from "fs";
import { join } from "path";
import chalk from "chalk";
import ora from "ora";
import { prompts } from "../utils/prompts.js";

// The globals.css content - imports from local styles directory
const GLOBALS_CSS_CONTENT = `/* Unisane UI - Tailwind v4 with Material 3 Design Tokens */
@import "tailwindcss";
@import "../styles/uni-tokens.css";
@import "../styles/uni-theme.css";
@import "../styles/uni-base.css";

/* Scan your project files for Tailwind classes */
@source "../**/*.{ts,tsx,mdx}";

/* ============================================================
   THEMING - Customize your color theme here!
   ============================================================

   Change --uni-hue-primary to switch your entire color palette:

   :root {
     --uni-hue-primary: 145;   // Green
   }

   Available hue values:
   - Blue: 240 (default)  - Green: 145   - Teal: 180
   - Purple: 285          - Orange: 70   - Red: 25

   Or use any hue value 0-360 for custom colors!
   ============================================================ */

/* Base document styles */
* {
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--color-background);
  color: var(--color-on-background);
  font-family: inherit;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
`;

// The base styles (animations, utilities)
const UNI_BASE_CSS = `/* Unisane UI Base Styles - Animations and Utilities */

/* Ripple animation */
@keyframes ripple {
  from {
    opacity: 0.35;
    transform: scale(0);
  }
  to {
    opacity: 0;
    transform: scale(2);
  }
}

/* Stagger animation for list items */
@keyframes stagger-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@layer base {
  /* Remove default focus outline */
  *:focus {
    outline: none;
  }

  /* Apply custom focus ring only for keyboard navigation */
  *:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  /* Ensure focus is visible on interactive elements */
  button:focus-visible,
  a:focus-visible,
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}

@layer utilities {
  /* Scrollbar utilities */
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }

  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  /* Ripple container */
  .ripple-container {
    position: relative;
    overflow: hidden;
  }

  /* Animation utilities */
  .animate-in {
    animation-fill-mode: both;
  }

  .animate-out {
    animation-fill-mode: both;
    animation-direction: reverse;
  }

  .animate-stagger {
    animation: stagger-in 300ms ease-out;
  }
}
`;

// The layout.tsx wrapper with ThemeProvider
const LAYOUT_WRAPPER = `import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "My App",
  description: "Built with Unisane UI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body>
        <ThemeProvider
          config={{
            density: "standard",
            theme: "system",
            radius: "standard",
          }}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
`;

export async function initCommand() {
  console.log(chalk.bold.blue("Unisane UI Init\n"));

  const spinner = ora("Initializing Unisane UI...").start();

  try {
    const cwd = process.cwd();

    // Check if we're in a project
    const packageJsonPath = join(cwd, "package.json");
    let packageJson: Record<string, unknown>;

    try {
      packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));
    } catch {
      spinner.fail("package.json not found");
      console.log(chalk.yellow("Please run this command in a project directory."));
      return;
    }

    const deps = packageJson.dependencies as Record<string, string> | undefined;
    const isNextProject = deps?.next !== undefined;

    if (!isNextProject) {
      spinner.warn("This does not appear to be a Next.js project");
      console.log(chalk.yellow("\nUnisane UI is optimized for Next.js."));
      console.log(chalk.gray("For other frameworks, manual setup may be required.\n"));
    }

    // Determine source directory
    const hasSrcDir = await fs
      .access(join(cwd, "src"))
      .then(() => true)
      .catch(() => false);

    const srcDir = hasSrcDir ? join(cwd, "src") : cwd;
    const appDir = join(srcDir, "app");

    // Check if app directory exists (Next.js App Router)
    const hasAppDir = await fs
      .access(appDir)
      .then(() => true)
      .catch(() => false);

    if (!hasAppDir) {
      spinner.fail("Could not find app directory");
      console.log(chalk.yellow("\nExpected to find: src/app or app"));
      console.log(chalk.gray("Make sure you're using Next.js App Router."));
      return;
    }

    // Find @unisane/ui in node_modules for token files
    const uiPackagePath = join(cwd, "node_modules", "@unisane", "ui");
    const tokensPackagePath = join(cwd, "node_modules", "@unisane", "tokens", "dist");

    const hasUiPackage = await fs
      .access(uiPackagePath)
      .then(() => true)
      .catch(() => false);

    const hasTokensPackage = await fs
      .access(tokensPackagePath)
      .then(() => true)
      .catch(() => false);

    // Create directories
    spinner.text = "Creating directories...";
    const stylesDir = join(srcDir, "styles");
    const libDir = join(srcDir, "lib");
    const componentsDir = join(srcDir, "components");
    const componentsUiDir = join(srcDir, "components", "ui");

    await fs.mkdir(stylesDir, { recursive: true });
    await fs.mkdir(libDir, { recursive: true });
    await fs.mkdir(componentsDir, { recursive: true });
    await fs.mkdir(componentsUiDir, { recursive: true });

    // Copy token files
    spinner.text = "Copying token files...";

    if (hasTokensPackage) {
      // Copy from installed @unisane/tokens package
      const uniTokensSrc = join(tokensPackagePath, "uni-tokens.css");
      const uniThemeSrc = join(tokensPackagePath, "uni-theme.css");

      await fs.copyFile(uniTokensSrc, join(stylesDir, "uni-tokens.css"));
      await fs.copyFile(uniThemeSrc, join(stylesDir, "uni-theme.css"));
    } else {
      // Fallback: fetch from registry or create minimal placeholders
      console.log(chalk.yellow("\n  @unisane/tokens not found, creating placeholder files..."));
      console.log(chalk.gray("  Run: pnpm add @unisane/ui @unisane/tokens"));

      await fs.writeFile(
        join(stylesDir, "uni-tokens.css"),
        `/* Unisane UI Tokens - Install @unisane/tokens and re-run init */
/* Or customize these tokens for your project */

:root {
  /* Scaling Knobs */
  --scale-space: 1;
  --scale-type: 1;
  --scale-radius: 1;
  --unit: calc(4px * var(--scale-space));

  /* Primary Colors */
  --color-primary: #6750A4;
  --color-on-primary: #FFFFFF;
  --color-primary-container: #EADDFF;
  --color-on-primary-container: #21005D;

  /* Surface Colors */
  --color-surface: #FEF7FF;
  --color-on-surface: #1D1B20;
  --color-background: #FEF7FF;
  --color-on-background: #1D1B20;

  /* Add more tokens as needed... */
}

.dark {
  --color-primary: #D0BCFF;
  --color-on-primary: #381E72;
  --color-surface: #1D1B20;
  --color-on-surface: #E6E0E9;
  --color-background: #1D1B20;
  --color-on-background: #E6E0E9;
}
`
      );

      await fs.writeFile(
        join(stylesDir, "uni-theme.css"),
        `/* Unisane UI Theme - Tailwind v4 Mapping */
/* Install @unisane/tokens for complete theme */

@theme {
  --color-primary: var(--color-primary);
  --color-on-primary: var(--color-on-primary);
  --color-surface: var(--color-surface);
  --color-on-surface: var(--color-on-surface);
  --color-background: var(--color-background);
  --color-on-background: var(--color-on-background);

  --radius-small: 8px;
  --radius-medium: 12px;
  --radius-large: 16px;

  --shadow-1: 0px 1px 3px 1px rgba(0, 0, 0, 0.15);
  --shadow-2: 0px 2px 6px 2px rgba(0, 0, 0, 0.15);
}
`
      );
    }

    // Write base styles
    await fs.writeFile(join(stylesDir, "uni-base.css"), UNI_BASE_CSS);

    // Copy utils.ts
    spinner.text = "Copying utilities...";

    if (hasUiPackage) {
      const utilsSrc = join(uiPackagePath, "registry", "lib", "utils.ts");
      const utilsExists = await fs
        .access(utilsSrc)
        .then(() => true)
        .catch(() => false);

      if (utilsExists) {
        let utilsContent = await fs.readFile(utilsSrc, "utf-8");
        // Update imports to use local paths
        utilsContent = utilsContent.replace(/@ui\/lib\//g, "@/lib/");
        await fs.writeFile(join(libDir, "utils.ts"), utilsContent);
      } else {
        await writeDefaultUtils(libDir);
      }
    } else {
      await writeDefaultUtils(libDir);
    }

    // Copy ThemeProvider (shadcn pattern: components/theme-provider.tsx)
    spinner.text = "Copying ThemeProvider...";

    if (hasUiPackage) {
      const themeProviderSrc = join(uiPackagePath, "registry", "layout", "theme-provider.tsx");
      const themeProviderExists = await fs
        .access(themeProviderSrc)
        .then(() => true)
        .catch(() => false);

      if (themeProviderExists) {
        let themeProviderContent = await fs.readFile(themeProviderSrc, "utf-8");
        // Update imports to use local paths
        themeProviderContent = themeProviderContent.replace(/@ui\/lib\//g, "@/lib/");
        themeProviderContent = themeProviderContent.replace(/@ui\/components\//g, "@/components/ui/");
        await fs.writeFile(join(componentsDir, "theme-provider.tsx"), themeProviderContent);
      } else {
        await writeDefaultThemeProvider(componentsDir);
      }
    } else {
      await writeDefaultThemeProvider(componentsDir);
    }

    // Update globals.css
    spinner.text = "Setting up globals.css...";
    const globalsCssPath = join(appDir, "globals.css");
    const globalsExists = await fs
      .access(globalsCssPath)
      .then(() => true)
      .catch(() => false);

    if (globalsExists) {
      const existingGlobals = await fs.readFile(globalsCssPath, "utf-8");

      if (existingGlobals.includes("uni-tokens.css")) {
        spinner.info("globals.css already configured");
      } else {
        // Backup existing and replace
        await fs.writeFile(join(appDir, "globals.css.backup"), existingGlobals);
        await fs.writeFile(globalsCssPath, GLOBALS_CSS_CONTENT);
      }
    } else {
      await fs.writeFile(globalsCssPath, GLOBALS_CSS_CONTENT);
    }

    // Check layout.tsx for ThemeProvider
    spinner.text = "Checking layout.tsx...";
    const layoutPath = join(appDir, "layout.tsx");
    const layoutExists = await fs
      .access(layoutPath)
      .then(() => true)
      .catch(() => false);

    if (layoutExists) {
      const existingLayout = await fs.readFile(layoutPath, "utf-8");

      if (!existingLayout.includes("ThemeProvider")) {
        console.log(chalk.yellow("\n  Note: Add ThemeProvider to your layout.tsx:"));
        console.log(chalk.gray(`
  import { ThemeProvider } from "@/components/theme-provider";

  // Wrap your app with ThemeProvider:
  <ThemeProvider config={{ density: "standard", theme: "system", radius: "standard" }}>
    {children}
  </ThemeProvider>
`));
      }
    } else {
      await fs.writeFile(layoutPath, LAYOUT_WRAPPER);
    }

    spinner.succeed("Unisane UI initialized successfully!");

    const prefix = hasSrcDir ? "src/" : "";

    console.log(chalk.green("\n✓ Created files:"));
    console.log(chalk.gray(`  - ${prefix}styles/uni-tokens.css`));
    console.log(chalk.gray(`  - ${prefix}styles/uni-theme.css`));
    console.log(chalk.gray(`  - ${prefix}styles/uni-base.css`));
    console.log(chalk.gray(`  - ${prefix}lib/utils.ts`));
    console.log(chalk.gray(`  - ${prefix}components/theme-provider.tsx`));
    console.log(chalk.gray(`  - ${prefix}app/globals.css`));

    console.log(chalk.blue("\n📦 Next steps:"));
    console.log(chalk.white("1. Add components:"));
    console.log(chalk.gray("   npx @unisane/cli add button"));
    console.log(chalk.white("\n2. Start your dev server:"));
    console.log(chalk.gray("   pnpm dev"));

    console.log(chalk.blue("\n🎨 Customize your theme:"));
    console.log(chalk.white("   Add to globals.css:"));
    console.log(chalk.gray("   :root { --uni-hue-primary: 145; } /* Green */"));
    console.log(chalk.gray("   Hues: Blue=240, Green=145, Teal=180, Purple=285, Orange=70, Red=25"));

    console.log(chalk.blue("\n📚 Documentation:"));
    console.log(chalk.gray("   https://unisane-ui.dev/docs"));
  } catch (error) {
    spinner.fail("Failed to initialize Unisane UI");
    console.error(chalk.red("\nError:"), error);
    process.exit(1);
  }
}

// Default utils.ts content
async function writeDefaultUtils(libDir: string) {
  const content = `import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Extended tailwind-merge with M3 token support
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display-large", "display-medium", "display-small",
            "headline-large", "headline-medium", "headline-small",
            "title-large", "title-medium", "title-small",
            "body-large", "body-medium", "body-small",
            "label-large", "label-medium", "label-small",
          ],
        },
      ],
      "text-color": [
        {
          text: [
            "primary", "on-primary", "primary-container", "on-primary-container",
            "secondary", "on-secondary", "secondary-container", "on-secondary-container",
            "tertiary", "on-tertiary", "tertiary-container", "on-tertiary-container",
            "surface", "on-surface", "surface-variant", "on-surface-variant",
            "background", "on-background", "outline", "outline-variant",
            "error", "on-error", "error-container", "on-error-container",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Focus ring utility classes
export const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export const focusRingInset =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary";

// State layer utility classes
export const stateLayer = {
  primary: "hover:bg-primary/[0.08] active:bg-primary/[0.12]",
  onPrimary: "hover:bg-on-primary/[0.08] active:bg-on-primary/[0.12]",
  secondary: "hover:bg-secondary/[0.08] active:bg-secondary/[0.12]",
  surface: "hover:bg-on-surface/[0.08] active:bg-on-surface/[0.12]",
  error: "hover:bg-error/[0.08] active:bg-error/[0.12]",
} as const;

export type StateLayerColor = keyof typeof stateLayer;
`;

  await fs.writeFile(join(libDir, "utils.ts"), content);
}

// Default ThemeProvider content
async function writeDefaultThemeProvider(componentsDir: string) {
  const content = `"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Density = "compact" | "standard" | "comfortable" | "dense";
export type Theme = "light" | "dark" | "system";
export type RadiusTheme = "sharp" | "standard" | "soft";

interface ThemeContextType {
  density: Density;
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

const DENSITY_PRESETS: Record<Density, { space: number; type: number; radius: number }> = {
  dense: { space: 0.75, type: 0.85, radius: 0.75 },
  compact: { space: 0.85, type: 0.9, radius: 0.8 },
  standard: { space: 1, type: 1, radius: 0.85 },
  comfortable: { space: 1.1, type: 1, radius: 1.0 },
};

const RADIUS_PRESETS: Record<RadiusTheme, number> = {
  sharp: 0.75,
  standard: 0.85,
  soft: 1.0,
};

export interface ThemeConfig {
  density?: Density;
  theme?: Theme;
  radius?: RadiusTheme;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  config?: ThemeConfig;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  config,
  storageKey = "unisane-theme",
}: ThemeProviderProps) {
  const configDensity = config?.density || "standard";
  const configTheme = config?.theme || "system";
  const configRadius = config?.radius || "standard";

  const [density, setDensityState] = useState<Density>(configDensity);
  const [theme, setThemeState] = useState<Theme>(configTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [radiusTheme, setRadiusThemeState] = useState<RadiusTheme>(configRadius);

  // Load theme from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.theme) setThemeState(parsed.theme);
        if (parsed.density && parsed.density in DENSITY_PRESETS) {
          setDensityState(parsed.density);
        }
        if (parsed.radiusTheme) setRadiusThemeState(parsed.radiusTheme);
      } catch (e) {
        console.warn("Failed to parse theme from localStorage", e);
      }
    }
  }, [storageKey]);

  // Resolve system theme preference
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

  // Apply theme to document
  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;

    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    root.setAttribute("data-density", density);
    root.setAttribute("data-radius", radiusTheme);

    const preset = DENSITY_PRESETS[density];
    root.style.setProperty("--scale-space", preset.space.toString());
    root.style.setProperty("--scale-type", preset.type.toString());
    root.style.setProperty("--scale-radius", RADIUS_PRESETS[radiusTheme].toString());
  }, [resolvedTheme, density, radiusTheme]);

  // Save to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    localStorage.setItem(
      storageKey,
      JSON.stringify({ theme, density, radiusTheme })
    );
  }, [theme, density, radiusTheme, storageKey]);

  const setDensity = (d: Density) => setDensityState(d);
  const setTheme = (t: Theme) => setThemeState(t);
  const setRadiusTheme = (r: RadiusTheme) => setRadiusThemeState(r);

  const value = useMemo(
    () => ({
      density,
      setDensity,
      theme,
      setTheme,
      resolvedTheme,
      radiusTheme,
      setRadiusTheme,
    }),
    [density, theme, resolvedTheme, radiusTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
`;

  await fs.writeFile(join(componentsDir, "theme-provider.tsx"), content);
}
