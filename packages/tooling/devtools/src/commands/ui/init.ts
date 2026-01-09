/**
 * @module commands/ui/init
 *
 * Initialize Unisane UI in a project.
 */

import fse from 'fs-extra';
const { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } = fse;
import path from 'path';
import { log } from '@unisane/cli-core';

// ════════════════════════════════════════════════════════════════════════════
// Templates
// ════════════════════════════════════════════════════════════════════════════

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
   ============================================================ */
`;

const DEFAULT_UTILS = `import { clsx, type ClassValue } from "clsx";
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
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
`;

// ════════════════════════════════════════════════════════════════════════════
// Main
// ════════════════════════════════════════════════════════════════════════════

export interface UiInitOptions {
  cwd?: string;
  force?: boolean;
}

export async function uiInit(options: UiInitOptions = {}): Promise<number> {
  const cwd = options.cwd ?? process.cwd();

  log.info('Initializing Unisane UI...');

  // Check if we're in a project
  const packageJsonPath = path.join(cwd, 'package.json');
  if (!existsSync(packageJsonPath)) {
    log.error('package.json not found');
    log.dim('Run this command in a project directory');
    return 1;
  }

  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const isNextProject = pkg.dependencies?.next !== undefined;

  if (!isNextProject) {
    log.warn('This does not appear to be a Next.js project');
    log.dim('Unisane UI is optimized for Next.js');
  }

  // Determine source directory
  const hasSrcDir = existsSync(path.join(cwd, 'src'));
  const srcDir = hasSrcDir ? path.join(cwd, 'src') : cwd;
  const appDir = path.join(srcDir, 'app');

  if (!existsSync(appDir)) {
    log.error('Could not find app directory');
    log.dim('Expected: src/app or app (Next.js App Router)');
    return 1;
  }

  // Create directories
  const stylesDir = path.join(srcDir, 'styles');
  const libDir = path.join(srcDir, 'lib');
  const componentsUiDir = path.join(srcDir, 'components', 'ui');

  mkdirSync(stylesDir, { recursive: true });
  mkdirSync(libDir, { recursive: true });
  mkdirSync(componentsUiDir, { recursive: true });

  // Copy tokens from @unisane/tokens if available
  const tokensPath = path.join(cwd, 'node_modules', '@unisane', 'tokens', 'dist', 'unisane.css');

  if (existsSync(tokensPath)) {
    copyFileSync(tokensPath, path.join(stylesDir, 'unisane.css'));
    log.success('Copied design tokens');
  } else {
    // Create placeholder
    writeFileSync(
      path.join(stylesDir, 'unisane.css'),
      `/* Install @unisane/tokens for full theme: pnpm add @unisane/tokens */
:root {
  --hue: 240;
  --chroma: 0.15;
  --color-primary: oklch(0.55 0.15 var(--hue));
  --color-surface: oklch(0.995 0.002 var(--hue));
}
`
    );
    log.warn('Created placeholder styles');
    log.dim('Install @unisane/tokens for full theme');
  }

  // Copy utils
  const uiUtilsPath = path.join(cwd, 'node_modules', '@unisane', 'ui', 'registry', 'lib', 'utils.ts');

  if (existsSync(uiUtilsPath)) {
    let content = readFileSync(uiUtilsPath, 'utf-8');
    // Transform imports
    content = content
      .replace(/@ui\/lib\//g, '@/lib/')
      .replace(/@ui\/components\//g, '@/components/ui/')
      .replace(/@ui\//g, '@/');
    writeFileSync(path.join(libDir, 'utils.ts'), content);
  } else {
    writeFileSync(path.join(libDir, 'utils.ts'), DEFAULT_UTILS);
  }
  log.success('Created lib/utils.ts');

  // Update globals.css
  const globalsCssPath = path.join(appDir, 'globals.css');
  const existingGlobals = existsSync(globalsCssPath) ? readFileSync(globalsCssPath, 'utf-8') : '';

  if (existingGlobals.includes('unisane.css')) {
    log.info('globals.css already configured');
  } else {
    if (existingGlobals) {
      writeFileSync(path.join(appDir, 'globals.css.backup'), existingGlobals);
    }
    writeFileSync(globalsCssPath, GLOBALS_CSS_CONTENT);
    log.success('Updated globals.css');
  }

  // Summary
  log.newline();
  log.success('Unisane UI initialized!');

  log.newline();
  log.info('Next steps:');
  log.dim('  1. Add components: unisane ui add button');
  log.dim('  2. Start dev server: pnpm dev');

  log.newline();
  log.info('Theming (OKLCH):');
  log.dim('  :root { --hue: 145; --chroma: 0.14; }');
  log.dim('  Hues: Blue=240, Green=145, Purple=285, Orange=70');

  return 0;
}
