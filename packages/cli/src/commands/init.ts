import { promises as fs } from "fs";
import { join } from "path";
import chalk from "chalk";
import ora from "ora";
import { prompts } from "../utils/prompts.js";

// The globals.css content - single import, comprehensive theming
const GLOBALS_CSS_CONTENT = `/* Unisane UI - Tailwind v4 with Material 3 Design Tokens */
@import "tailwindcss";
@import "../styles/unisane.css";

/* Scan your project files for Tailwind classes */
@source "../**/*.{ts,tsx,mdx}";

/* ============================================================
   THEMING - OKLCH Color Science
   ============================================================

   Set your theme with just 2 variables:
   :root {
     --hue: 145;      // Green theme (0-360)
     --chroma: 0.14;  // Color intensity (0-0.2)
   }

   Quick reference:
   | Color  | Hue  | Chroma |
   |--------|------|--------|
   | Blue   | 240  | 0.13   | (default)
   | Green  | 145  | 0.14   |
   | Teal   | 180  | 0.12   |
   | Purple | 285  | 0.15   |
   | Orange | 70   | 0.16   |
   | Red    | 25   | 0.16   |

   MONOCHROME / BLACK THEME:
   :root {
     --hue: 0;
     --chroma: 0;
     --chroma-neutral: 0;  // Removes tint from surfaces
   }

   ============================================================
   THEME MODIFIERS (optional - via HTML attributes)
   ============================================================

   DARK MODE: Automatic via prefers-color-scheme
     Or: <html class="dark">

   SCHEME (color strategy):
     <html data-scheme="tonal">        // Full color (default)
     <html data-scheme="monochrome">   // Pure grayscale
     <html data-scheme="neutral">      // Low saturation

   CONTRAST (accessibility):
     <html data-contrast="standard">   // Default
     <html data-contrast="medium">     // Boosted readability
     <html data-contrast="high">       // WCAG AAA compliant

   DENSITY:
     <html data-density="compact">     // Tighter spacing
     <html data-density="comfortable"> // More spacious

   RADIUS:
     <html data-radius="sharp">        // Sharper corners
     <html data-radius="soft">         // Rounder corners

   COMBINING: <html class="dark" data-scheme="neutral" data-contrast="high">
   ============================================================ */
`;

// Layout.tsx - NO ThemeProvider required! (CSS handles everything)
const LAYOUT_WRAPPER = `import "./globals.css";
import type { Metadata } from "next";

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
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
`;

// Optional: ThemeProvider for runtime control (toggle dark mode, density, etc.)
const THEME_PROVIDER_OPTIONAL = `"use client";

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

/**
 * Optional ThemeProvider - use ONLY if you need runtime theme switching.
 *
 * Without ThemeProvider:
 * - Dark mode: automatic via prefers-color-scheme, or add .dark class
 * - Density: add data-density="compact|dense|comfortable" to <html>
 * - Radius: add data-radius="sharp|soft" to <html>
 *
 * With ThemeProvider:
 * - Runtime toggle between light/dark/system
 * - Runtime density switching
 * - Persists preferences to localStorage
 */
export function ThemeProvider({
  children,
  config,
  storageKey = "unisane-theme",
}: ThemeProviderProps) {
  const [density, setDensityState] = useState<Density>(config?.density || "standard");
  const [theme, setThemeState] = useState<Theme>(config?.theme || "system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [radiusTheme, setRadiusThemeState] = useState<RadiusTheme>(config?.radius || "standard");

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.theme) setThemeState(parsed.theme);
        if (parsed.density) setDensityState(parsed.density);
        if (parsed.radiusTheme) setRadiusThemeState(parsed.radiusTheme);
      } catch (e) {
        console.warn("Failed to parse theme from localStorage", e);
      }
    }
  }, [storageKey]);

  // Resolve system theme
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

  // Apply to document
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;

    // Dark mode via class
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.classList.toggle("light", resolvedTheme === "light");

    // Density and radius via data attributes
    root.setAttribute("data-density", density);
    root.setAttribute("data-radius", radiusTheme);
  }, [resolvedTheme, density, radiusTheme]);

  // Save to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(storageKey, JSON.stringify({ theme, density, radiusTheme }));
  }, [theme, density, radiusTheme, storageKey]);

  const value = useMemo(
    () => ({
      density,
      setDensity: setDensityState,
      theme,
      setTheme: setThemeState,
      resolvedTheme,
      radiusTheme,
      setRadiusTheme: setRadiusThemeState,
    }),
    [density, theme, resolvedTheme, radiusTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
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

    // Copy merged CSS file
    spinner.text = "Copying style files...";

    if (hasTokensPackage) {
      // Copy merged file from installed @unisane/tokens package
      const unisaneCssSrc = join(tokensPackagePath, "unisane.css");
      const unisaneExists = await fs
        .access(unisaneCssSrc)
        .then(() => true)
        .catch(() => false);

      if (unisaneExists) {
        await fs.copyFile(unisaneCssSrc, join(stylesDir, "unisane.css"));
      } else {
        // Fallback to individual files if merged doesn't exist
        const uniTokensSrc = join(tokensPackagePath, "uni-tokens.css");
        const uniThemeSrc = join(tokensPackagePath, "uni-theme.css");
        const uniBaseSrc = join(tokensPackagePath, "uni-base.css");

        // Read and merge
        const tokens = await fs.readFile(uniTokensSrc, "utf-8").catch(() => "");
        const theme = await fs.readFile(uniThemeSrc, "utf-8").catch(() => "");
        const base = await fs.readFile(uniBaseSrc, "utf-8").catch(() => "");
        await fs.writeFile(join(stylesDir, "unisane.css"), tokens + theme + base);
      }
    } else {
      // Fallback: create minimal placeholder
      console.log(chalk.yellow("\n  @unisane/tokens not found, creating placeholder..."));
      console.log(chalk.gray("  Run: pnpm add @unisane/ui @unisane/tokens"));

      await fs.writeFile(
        join(stylesDir, "unisane.css"),
        `/* Unisane UI - Install @unisane/tokens and re-run init for full theme */

:root {
  /* Theme - change this to switch colors! */
  --hue: 240;
  --chroma: 0.15;

  /* Scaling */
  --scale-space: 1;
  --scale-type: 1;
  --scale-radius: 1;

  /* Basic colors (placeholder) */
  --color-primary: oklch(0.55 0.15 var(--hue));
  --color-on-primary: #FFFFFF;
  --color-surface: oklch(0.995 0.002 var(--hue));
  --color-on-surface: oklch(0.22 0.014 var(--hue));
  --color-background: oklch(0.995 0.002 var(--hue));
  --color-on-background: oklch(0.22 0.014 var(--hue));

  /* Radius */
  --radius-sm: calc(8px * var(--scale-radius));
  --radius-md: calc(12px * var(--scale-radius));
  --radius-lg: calc(20px * var(--scale-radius));
}

@media (prefers-color-scheme: dark) {
  :root:not(.light) {
    --color-primary: oklch(0.88 0.105 var(--hue));
    --color-on-primary: oklch(0.33 0.1275 var(--hue));
    --color-surface: oklch(0.22 0.014 var(--hue));
    --color-on-surface: oklch(0.94 0.007 var(--hue));
    --color-background: oklch(0.22 0.014 var(--hue));
    --color-on-background: oklch(0.94 0.007 var(--hue));
  }
}

.dark {
  --color-primary: oklch(0.88 0.105 var(--hue));
  --color-on-primary: oklch(0.33 0.1275 var(--hue));
  --color-surface: oklch(0.22 0.014 var(--hue));
  --color-on-surface: oklch(0.94 0.007 var(--hue));
  --color-background: oklch(0.22 0.014 var(--hue));
  --color-on-background: oklch(0.94 0.007 var(--hue));
}

@theme {
  --color-primary: var(--color-primary);
  --color-on-primary: var(--color-on-primary);
  --color-surface: var(--color-surface);
  --color-on-surface: var(--color-on-surface);
  --color-background: var(--color-background);
  --color-on-background: var(--color-on-background);
  --radius-sm: var(--radius-sm);
  --radius-md: var(--radius-md);
  --radius-lg: var(--radius-lg);
}
`
      );
    }

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
        // Update imports to use local paths (handle all @ui/* patterns)
        utilsContent = utilsContent
          .replace(/@ui\/lib\//g, "@/lib/")
          .replace(/@ui\/components\//g, "@/components/ui/")
          .replace(/@ui\/primitives\//g, "@/primitives/")
          .replace(/@ui\/layout\//g, "@/layout/")
          .replace(/@ui\/hooks\//g, "@/hooks/")
          .replace(/@ui\//g, "@/"); // Catch any remaining
        await fs.writeFile(join(libDir, "utils.ts"), utilsContent);
      } else {
        await writeDefaultUtils(libDir);
      }
    } else {
      await writeDefaultUtils(libDir);
    }

    // Copy ThemeProvider (OPTIONAL - for runtime theme switching)
    spinner.text = "Copying optional ThemeProvider...";
    await fs.writeFile(join(componentsDir, "theme-provider.tsx"), THEME_PROVIDER_OPTIONAL);

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

    // Check layout.tsx
    spinner.text = "Checking layout.tsx...";
    const layoutPath = join(appDir, "layout.tsx");
    const layoutExists = await fs
      .access(layoutPath)
      .then(() => true)
      .catch(() => false);

    if (!layoutExists) {
      await fs.writeFile(layoutPath, LAYOUT_WRAPPER);
    }

    spinner.succeed("Unisane UI initialized successfully!");

    const prefix = hasSrcDir ? "src/" : "";

    console.log(chalk.green("\n✓ Created files:"));
    console.log(chalk.gray(`  - ${prefix}styles/unisane.css (all tokens + theme + base)`));
    console.log(chalk.gray(`  - ${prefix}lib/utils.ts`));
    console.log(chalk.gray(`  - ${prefix}components/theme-provider.tsx (optional)`));
    console.log(chalk.gray(`  - ${prefix}app/globals.css`));

    console.log(chalk.blue("\n📦 Next steps:"));
    console.log(chalk.white("1. Add components:"));
    console.log(chalk.gray("   npx @unisane/cli add button"));
    console.log(chalk.white("\n2. Start your dev server:"));
    console.log(chalk.gray("   pnpm dev"));

    console.log(chalk.blue("\n🎨 Theming (OKLCH color science):"));
    console.log(chalk.white("   Add to globals.css:"));
    console.log(chalk.gray("   :root { --hue: 145; --chroma: 0.14; }  /* Green theme */"));
    console.log(chalk.gray("   Hues: Blue=240, Green=145, Teal=180, Purple=285, Orange=70, Red=25"));

    console.log(chalk.blue("\n🌙 Dark mode (automatic!):"));
    console.log(chalk.gray("   Works automatically via prefers-color-scheme"));
    console.log(chalk.gray("   Or add class=\"dark\" to <html>"));

    console.log(chalk.blue("\n📐 Theme modifiers (CSS only):"));
    console.log(chalk.gray("   <html data-scheme=\"neutral\">     /* monochrome | tonal */"));
    console.log(chalk.gray("   <html data-contrast=\"high\">      /* medium | standard */"));
    console.log(chalk.gray("   <html data-density=\"compact\">    /* dense | comfortable */"));
    console.log(chalk.gray("   <html data-radius=\"soft\">        /* sharp | standard */"));

    console.log(chalk.blue("\n💡 ThemeProvider (optional):"));
    console.log(chalk.gray("   Only needed for runtime theme switching UI"));
    console.log(chalk.gray("   CSS handles everything by default!"));

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

