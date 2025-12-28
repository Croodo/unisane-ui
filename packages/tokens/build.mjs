#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const srcDir = join(rootDir, "src");
const distDir = join(rootDir, "dist");

// Ensure dist directory exists
mkdirSync(distDir, { recursive: true });

/**
 * OKLCH Color Generation System - Simplified for Best DX
 *
 * This system generates complete color palettes from a single primary hue.
 * Secondary, tertiary, and neutral colors are derived using color theory.
 *
 * RUNTIME THEMING - Just set ONE variable:
 *   :root { --hue: 145; }  // Green theme
 *
 * Available hues:
 *   Blue: 240 (default)  Green: 145   Teal: 180
 *   Purple: 285          Orange: 70   Red: 25
 *
 * NO JS REQUIRED - CSS handles:
 *   - Dark mode via prefers-color-scheme OR .dark class
 *   - Density via data-density attribute
 *   - Radius via data-radius attribute
 *
 * To switch build themes: node scripts/build.mjs --theme=green
 */

// M3-style tonal palette lightness values (0-100 scale mapped to OKLCH 0-1)
// Includes intermediate tones (4, 6, 12, 17, 22, 24) for dark mode surface containers
const TONAL_LIGHTNESS = {
  0: 0.0,
  4: 0.10,    // Dark mode surface-container-lowest
  6: 0.13,    // Dark mode surface
  10: 0.22,
  12: 0.25,   // Dark mode surface-container-low
  17: 0.30,   // Dark mode surface-container
  20: 0.33,
  22: 0.36,   // Dark mode surface-container-high
  24: 0.38,   // Dark mode surface-container-highest
  30: 0.44,
  40: 0.55,
  50: 0.65,
  60: 0.74,
  70: 0.82,
  80: 0.88,
  90: 0.94,
  95: 0.97,
  99: 0.995,
  100: 1.0,
};

// Chroma scaling per lightness level (colors desaturate at extremes)
const CHROMA_SCALE = {
  0: 0,
  4: 0.5,     // Very dark, low chroma
  6: 0.6,     // Very dark, low chroma
  10: 0.7,
  12: 0.75,
  17: 0.8,
  20: 0.85,
  22: 0.87,
  24: 0.88,
  30: 0.95,
  40: 1.0,
  50: 1.0,
  60: 0.95,
  70: 0.85,
  80: 0.7,
  90: 0.5,
  95: 0.3,
  99: 0.1,
  100: 0,
};

/**
 * Convert OKLCH to approximate hex (for backwards compatibility)
 * Uses simplified Oklab -> sRGB conversion
 */
function oklchToHex(l, c, h) {
  const hRad = (h * Math.PI) / 180;

  // Convert to Oklab
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  // Oklab to linear sRGB (approximate)
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  let r = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  let bl = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

  // Gamma correction
  const gamma = (x) => x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1/2.4) - 0.055;

  r = Math.round(Math.max(0, Math.min(1, gamma(r))) * 255);
  g = Math.round(Math.max(0, Math.min(1, gamma(g))) * 255);
  bl = Math.round(Math.max(0, Math.min(1, gamma(bl))) * 255);

  return `#${r.toString(16).padStart(2, '0').toUpperCase()}${g.toString(16).padStart(2, '0').toUpperCase()}${bl.toString(16).padStart(2, '0').toUpperCase()}`;
}

/**
 * Generate a tonal palette from hue and base chroma
 */
function generateTonalPalette(hue, baseChroma) {
  const palette = {};

  for (const [tone, lightness] of Object.entries(TONAL_LIGHTNESS)) {
    const chromaMultiplier = CHROMA_SCALE[tone];
    const chroma = baseChroma * chromaMultiplier;
    palette[tone] = oklchToHex(lightness, chroma, hue);
  }

  return palette;
}

/**
 * Generate neutral palette with optional tint from primary
 */
function generateNeutralPalette(primaryHue, tintAmount = 0.02) {
  const palette = {};

  for (const [tone, lightness] of Object.entries(TONAL_LIGHTNESS)) {
    // Neutrals have very low chroma, slightly tinted toward primary
    const chroma = tintAmount * CHROMA_SCALE[tone];
    palette[tone] = oklchToHex(lightness, chroma, primaryHue);
  }

  return palette;
}

/**
 * Load theme configuration
 */
function loadThemeConfig(themeName = 'blue') {
  const themePath = join(srcDir, 'themes', `${themeName}.json`);
  const configPath = join(srcDir, 'theme-config.json');

  // Load base config
  let baseConfig;
  if (existsSync(configPath)) {
    baseConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
  } else {
    // Default config if file doesn't exist
    baseConfig = {
      name: "Blue",
      primary: { hue: 210, chroma: 0.15 },
      secondary: { strategy: "analogous", hueShift: 0, chromaScale: 0.4 },
      tertiary: { strategy: "complementary", hueShift: 60, chromaScale: 0.7 },
      neutral: { tintFromPrimary: 0.02 },
      error: { hue: 25, chroma: 0.18 },
    };
  }

  // Override with specific theme if exists
  if (existsSync(themePath)) {
    const themeOverride = JSON.parse(readFileSync(themePath, 'utf-8'));
    baseConfig.primary = { ...baseConfig.primary, ...themeOverride.primary };
    baseConfig.name = themeOverride.name || baseConfig.name;
  }

  return baseConfig;
}

/**
 * Generate all palettes from theme config
 */
function generatePalettes(config) {
  const primaryHue = config.primary.hue;
  const primaryChroma = config.primary.chroma;

  // Secondary: desaturated version of primary (same hue family)
  const secondaryChroma = primaryChroma * (config.secondary?.chromaScale || 0.4);
  const secondaryHue = primaryHue + (config.secondary?.hueShift || 0);

  // Tertiary: complementary accent (typically 60° shift for triadic harmony)
  const tertiaryHue = (primaryHue + (config.tertiary?.hueShift || 60)) % 360;
  const tertiaryChroma = primaryChroma * (config.tertiary?.chromaScale || 0.7);

  // Neutral: very low chroma, tinted toward primary
  const neutralTint = config.neutral?.tintFromPrimary || 0.02;

  // Error: fixed red/orange hue for consistency
  const errorHue = config.error?.hue || 25;
  const errorChroma = config.error?.chroma || 0.18;

  return {
    primary: generateTonalPalette(primaryHue, primaryChroma),
    secondary: generateTonalPalette(secondaryHue, secondaryChroma),
    tertiary: generateTonalPalette(tertiaryHue, tertiaryChroma),
    neutral: generateNeutralPalette(primaryHue, neutralTint),
    "neutral-variant": generateNeutralPalette(primaryHue, neutralTint * 1.5),
    error: generateTonalPalette(errorHue, errorChroma),
  };
}

// Get theme from command line args
const themeName = process.argv.find(arg => arg.startsWith('--theme='))?.split('=')[1] || 'blue';

// Load config and generate palettes
const config = loadThemeConfig(themeName);
const palettes = generatePalettes(config);

// Save generated palettes as ref.json for inspection/debugging
writeFileSync(join(srcDir, 'ref.json'), JSON.stringify(palettes, null, 2));

/**
 * Generate uni-tokens.css (registry-compatible format with --uni-ref-* naming)
 * SIMPLIFIED: Uses --hue instead of --uni-hue-primary for better DX
 */
function generateUniTokens() {
  const primaryHue = config.primary.hue;
  const primaryChroma = config.primary.chroma;
  const secondaryChromaScale = config.secondary?.chromaScale || 0.4;
  const tertiaryHueShift = config.tertiary?.hueShift || 60;
  const tertiaryChromaScale = config.tertiary?.chromaScale || 0.7;
  const neutralTint = config.neutral?.tintFromPrimary || 0.02;
  const errorHue = config.error?.hue || 25;
  const errorChroma = config.error?.chroma || 0.18;

  let css = `/* ============================================================
   Unisane UI Design Tokens
   Generated from "${config.name}" theme using OKLCH color science
   ============================================================ */

/* ============================================================
   THEMING SYSTEM - Multiple ways to customize!
   ============================================================

   1. HUE - Change the primary color:
      :root { --hue: 145; }     // Green
      :root { --hue: 285; }     // Purple
      :root { --hue: 70; }      // Orange

      Available hues:
      Blue: 240 (default)  Green: 145   Teal: 180
      Purple: 285          Orange: 70   Red: 25

   2. CHROMA - Adjust color intensity:
      :root { --chroma: 0.08; }  // Muted
      :root { --chroma: 0.18; }  // Vibrant

   3. SCHEME - Color strategy (via data attribute):
      <html data-scheme="tonal">       // Default - full color
      <html data-scheme="monochrome">  // Pure grayscale
      <html data-scheme="neutral">     // Low saturation, professional

   4. CONTRAST - Accessibility level (via data attribute):
      <html data-contrast="standard">  // Default
      <html data-contrast="medium">    // Boosted readability
      <html data-contrast="high">      // WCAG AAA compliant

   5. DARK MODE:
      <html class="dark">              // Manual dark mode
      // Or automatic via prefers-color-scheme

   6. DENSITY:
      <html data-density="compact">    // Tighter spacing
      <html data-density="comfortable">// More breathing room

   7. RADIUS:
      <html data-radius="sharp">       // Sharper corners
      <html data-radius="soft">        // Rounder corners

   COMBINING: All options can be combined!
      <html class="dark" data-scheme="neutral" data-contrast="high">
   ============================================================ */

/* Theme defaults layer - can be overridden by unlayered app CSS */
@layer unisane-defaults {
  :root {
    --hue: 210;
    --chroma: 0.16;
  }
}

:root {

  /* Derived hues (auto-calculated) */
  --hue-secondary: var(--hue);
  --hue-tertiary: calc(var(--hue) + ${tertiaryHueShift});
  --hue-neutral: var(--hue);
  --hue-error: ${errorHue};

  /* Derived chromas */
  --chroma-secondary: calc(var(--chroma) * ${secondaryChromaScale});
  --chroma-tertiary: calc(var(--chroma) * ${tertiaryChromaScale});
  --chroma-neutral: ${neutralTint};
  --chroma-error: ${errorChroma};
`;

  // Generate OKLCH-based reference tokens
  // Use CSS calc() for runtime theming support
  const paletteConfigs = [
    { name: 'primary', hueVar: '--hue', chromaVar: '--chroma' },
    { name: 'secondary', hueVar: '--hue-secondary', chromaVar: '--chroma-secondary' },
    { name: 'tertiary', hueVar: '--hue-tertiary', chromaVar: '--chroma-tertiary' },
    { name: 'neutral', hueVar: '--hue-neutral', chromaVar: '--chroma-neutral' },
    { name: 'neutral-variant', hueVar: '--hue-neutral', chromaVar: '--chroma-neutral-variant' },
    { name: 'error', hueVar: '--hue-error', chromaVar: '--chroma-error' },
  ];

  css += `
  /* Neutral variant chroma (1.5x neutral) */
  --chroma-neutral-variant: calc(var(--chroma-neutral) * 1.5);
`;

  css += `\n  /* === REFERENCE PALETTES (auto-derived from --hue and --chroma) === */\n`;

  for (const { name, hueVar, chromaVar } of paletteConfigs) {
    css += `\n  /* ${name} */\n`;

    for (const [tone, lightness] of Object.entries(TONAL_LIGHTNESS)) {
      const chromaMultiplier = CHROMA_SCALE[tone];

      // Pure black and white for extremes
      if (tone === '0') {
        css += `  --ref-${name}-0: #000000;\n`;
      } else if (tone === '100') {
        css += `  --ref-${name}-100: #FFFFFF;\n`;
      } else {
        // Use calc() with CSS variable for runtime theming
        css += `  --ref-${name}-${tone}: oklch(${lightness} calc(var(${chromaVar}) * ${chromaMultiplier}) var(${hueVar}));\n`;
      }
    }
  }

  css += `

  /* === SCALING KNOBS === */
  --scale-space: 1;
  --scale-type: 1;
  --scale-radius: 1;
  --unit: calc(4px * var(--scale-space));

  /* Pane Widths */
  --width-pane-list: 360px;
  --width-pane-fixed: 412px;
  --width-pane-supporting: 400px;
  --width-rail-collapsed: 80px;
  --width-drawer-compact: 360px;

  /* === TONE MAPPING LAYER (Light Mode) ===
     Override these to remap which palette tones map to semantic colors.
     This enables special schemes (monochrome, high-contrast) without
     regenerating the entire palette. Just change the tone mappings! */

  /* Primary tone mapping */
  --tone-primary: var(--ref-primary-30);
  --tone-on-primary: var(--ref-primary-100);
  --tone-primary-container: var(--ref-primary-90);
  --tone-on-primary-container: var(--ref-primary-10);

  /* Secondary tone mapping */
  --tone-secondary: var(--ref-secondary-40);
  --tone-on-secondary: var(--ref-secondary-100);
  --tone-secondary-container: var(--ref-secondary-90);
  --tone-on-secondary-container: var(--ref-secondary-10);

  /* Tertiary tone mapping */
  --tone-tertiary: var(--ref-tertiary-40);
  --tone-on-tertiary: var(--ref-tertiary-100);
  --tone-tertiary-container: var(--ref-tertiary-90);
  --tone-on-tertiary-container: var(--ref-tertiary-10);

  /* Surface tone mapping */
  --tone-surface: var(--ref-neutral-99);
  --tone-on-surface: var(--ref-neutral-10);
  --tone-surface-container-lowest: var(--ref-neutral-100);
  --tone-surface-container-low: var(--ref-neutral-95);
  --tone-surface-container: var(--ref-neutral-90);
  --tone-surface-container-high: var(--ref-neutral-80);
  --tone-surface-container-highest: var(--ref-neutral-70);
  --tone-surface-variant: var(--ref-neutral-variant-90);
  --tone-on-surface-variant: var(--ref-neutral-variant-30);

  /* Background/outline tone mapping */
  --tone-background: var(--ref-neutral-99);
  --tone-on-background: var(--ref-neutral-10);
  --tone-outline: var(--ref-neutral-variant-50);
  --tone-outline-variant: var(--ref-neutral-variant-80);

  /* Error tone mapping */
  --tone-error: var(--ref-error-40);
  --tone-on-error: var(--ref-error-100);
  --tone-error-container: var(--ref-error-90);
  --tone-on-error-container: var(--ref-error-10);

  /* Inverse tone mapping */
  --tone-inverse-surface: var(--ref-neutral-20);
  --tone-inverse-on-surface: var(--ref-neutral-95);
  --tone-inverse-primary: var(--ref-primary-80);

  /* === SEMANTIC COLORS (reference tone mapping layer) === */
  --color-primary: var(--tone-primary);
  --color-on-primary: var(--tone-on-primary);
  --color-primary-container: var(--tone-primary-container);
  --color-on-primary-container: var(--tone-on-primary-container);

  --color-secondary: var(--tone-secondary);
  --color-on-secondary: var(--tone-on-secondary);
  --color-secondary-container: var(--tone-secondary-container);
  --color-on-secondary-container: var(--tone-on-secondary-container);

  --color-tertiary: var(--tone-tertiary);
  --color-on-tertiary: var(--tone-on-tertiary);
  --color-tertiary-container: var(--tone-tertiary-container);
  --color-on-tertiary-container: var(--tone-on-tertiary-container);

  --color-surface: var(--tone-surface);
  --color-on-surface: var(--tone-on-surface);
  --color-surface-container-lowest: var(--tone-surface-container-lowest);
  --color-surface-container-low: var(--tone-surface-container-low);
  --color-surface-container: var(--tone-surface-container);
  --color-surface-container-high: var(--tone-surface-container-high);
  --color-surface-container-highest: var(--tone-surface-container-highest);

  --color-surface-variant: var(--tone-surface-variant);
  --color-on-surface-variant: var(--tone-on-surface-variant);
  --color-background: var(--tone-background);
  --color-on-background: var(--tone-on-background);
  --color-outline: var(--tone-outline);
  --color-outline-variant: var(--tone-outline-variant);

  --color-error: var(--tone-error);
  --color-on-error: var(--tone-on-error);
  --color-error-container: var(--tone-error-container);
  --color-on-error-container: var(--tone-on-error-container);

  --color-success: oklch(0.55 0.18 145);
  --color-on-success: oklch(0.98 0 0);
  --color-success-container: oklch(0.92 0.08 145);
  --color-on-success-container: oklch(0.25 0.1 145);

  --color-warning: oklch(0.62 0.16 85);
  --color-on-warning: oklch(0.98 0 0);
  --color-warning-container: oklch(0.92 0.08 85);
  --color-on-warning-container: oklch(0.25 0.1 85);

  --color-info: oklch(0.58 0.16 245);
  --color-on-info: oklch(0.98 0 0);
  --color-info-container: oklch(0.92 0.08 245);
  --color-on-info-container: oklch(0.25 0.08 245);

  --color-inverse-surface: var(--tone-inverse-surface);
  --color-inverse-on-surface: var(--tone-inverse-on-surface);
  --color-inverse-primary: var(--tone-inverse-primary);
  --color-scrim: rgba(0, 0, 0, 0.32);

  /* Typography */
  --font-sans: var(--font-inter, system-ui), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
`;

  // M3 Type Scale
  const typeScale = {
    "display-large": { size: 57, line: 64, weight: 400, tracking: "-0.25px" },
    "display-medium": { size: 45, line: 52, weight: 400, tracking: "0" },
    "display-small": { size: 36, line: 44, weight: 400, tracking: "0" },
    "headline-large": { size: 32, line: 40, weight: 400, tracking: "0" },
    "headline-medium": { size: 28, line: 36, weight: 400, tracking: "0" },
    "headline-small": { size: 24, line: 32, weight: 400, tracking: "0" },
    "title-large": { size: 22, line: 28, weight: 400, tracking: "0" },
    "title-medium": { size: 16, line: 24, weight: 500, tracking: "0.15px" },
    "title-small": { size: 14, line: 20, weight: 500, tracking: "0.1px" },
    "body-large": { size: 16, line: 24, weight: 400, tracking: "0.5px" },
    "body-medium": { size: 14, line: 20, weight: 400, tracking: "0.25px" },
    "body-small": { size: 12, line: 16, weight: 400, tracking: "0.4px" },
    "label-large": { size: 14, line: 20, weight: 500, tracking: "0.1px" },
    "label-medium": { size: 12, line: 16, weight: 500, tracking: "0.5px" },
    "label-small": { size: 11, line: 16, weight: 500, tracking: "0.5px" },
  };

  css += `\n  /* === TYPOGRAPHY === */\n`;
  for (const [name, props] of Object.entries(typeScale)) {
    css += `  --type-${name}-font: var(--font-sans);
  --type-${name}-weight: ${props.weight};
  --type-${name}-size: calc(${props.size}px * var(--scale-type));
  --type-${name}-line: calc(${props.line}px * var(--scale-type));
  --type-${name}-tracking: ${props.tracking};
`;
  }

  css += `
  /* === SHAPE (Radius) === */
  --radius-none: 0px;
  --radius-xs: calc(4px * var(--scale-radius));
  --radius-sm: calc(8px * var(--scale-radius));
  --radius-md: calc(12px * var(--scale-radius));
  --radius-lg: calc(20px * var(--scale-radius));
  --radius-xl: calc(32px * var(--scale-radius));
  --radius-2xl: calc(48px * var(--scale-radius));
  --radius-full: 9999px;

  /* === ELEVATION === */
  --shadow-0: none;
  --shadow-1: 0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30);
  --shadow-2: 0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30);
  --shadow-3: 0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.30);
  --shadow-4: 0px 6px 10px 4px rgba(0, 0, 0, 0.15), 0px 2px 3px 0px rgba(0, 0, 0, 0.30);
  --shadow-5: 0px 8px 12px 6px rgba(0, 0, 0, 0.15), 0px 4px 4px 0px rgba(0, 0, 0, 0.30);

  /* === MOTION === */
  --duration-short: 100ms;
  --duration-snappy: 150ms;
  --duration-medium: 250ms;
  --duration-emphasized: 300ms;
  --duration-long: 500ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-accelerate: cubic-bezier(0.3, 0, 1, 1);
  --ease-decelerate: cubic-bezier(0, 0, 0, 1);
  --ease-emphasized: cubic-bezier(0.2, 0, 0, 1);

  /* === OPACITY === */
  --opacity-hover: 0.08;
  --opacity-focus: 0.10;
  --opacity-pressed: 0.10;
  --opacity-dragged: 0.16;
  --opacity-disabled: 0.38;
  --opacity-muted: 0.60;

  /* === ICON SIZES === */
  --icon-xs: calc(16px * var(--scale-space));
  --icon-sm: calc(20px * var(--scale-space));
  --icon-md: calc(24px * var(--scale-space));
  --icon-lg: calc(32px * var(--scale-space));
  --icon-xl: calc(48px * var(--scale-space));

  /* === SPACING (Unit-based) === */
`;

  // Unit spacing (0.5u to 16u, plus larger values)
  const units = [];
  for (let i = 1; i <= 32; i++) units.push(i / 2);
  units.push(20, 24, 28, 32, 36, 38, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96, 100);

  for (const u of units) {
    const key = u.toString().replace(".", "_");
    css += `  --space-${key}u: calc(var(--unit) * ${u});\n`;
  }

  css += `
  /* === LAYOUT === */
  --layout-margin: calc(16px * var(--scale-space));
  --layout-gutter: calc(16px * var(--scale-space));
  --layout-pane-gap: calc(20px * var(--scale-space));
  --layout-pane-list: calc(360px * var(--scale-space));
  --layout-pane-fixed: calc(412px * var(--scale-space));
  --layout-pane-supporting: calc(400px * var(--scale-space));
  --layout-rail: calc(72px * var(--scale-space));
  --layout-drawer: calc(360px * var(--scale-space));

  /* === Z-INDEX === */
  --z-fab: 500;
  --z-header: 1000;
  --z-drawer: 1500;
  --z-popover: 2000;
  --z-modal: 3000;
}

/* ============================================================
   DARK MODE - CSS-only, no JS required!
   Works with: .dark class OR prefers-color-scheme
   Updates the tone mapping layer for dark mode.
   ============================================================ */

/* System preference dark mode */
@media (prefers-color-scheme: dark) {
  :root:not(.light) {
    /* Update tone mapping for dark mode */
    --tone-primary: var(--ref-primary-80);
    --tone-on-primary: var(--ref-primary-20);
    --tone-primary-container: var(--ref-primary-30);
    --tone-on-primary-container: var(--ref-primary-90);

    --tone-secondary: var(--ref-secondary-80);
    --tone-on-secondary: var(--ref-secondary-20);
    --tone-secondary-container: var(--ref-secondary-30);
    --tone-on-secondary-container: var(--ref-secondary-90);

    --tone-tertiary: var(--ref-tertiary-80);
    --tone-on-tertiary: var(--ref-tertiary-20);
    --tone-tertiary-container: var(--ref-tertiary-30);
    --tone-on-tertiary-container: var(--ref-tertiary-90);

    --tone-surface: var(--ref-neutral-6);
    --tone-on-surface: var(--ref-neutral-90);
    --tone-surface-container-lowest: var(--ref-neutral-4);
    --tone-surface-container-low: var(--ref-neutral-10);
    --tone-surface-container: var(--ref-neutral-12);
    --tone-surface-container-high: var(--ref-neutral-17);
    --tone-surface-container-highest: var(--ref-neutral-22);
    --tone-surface-variant: var(--ref-neutral-variant-30);
    --tone-on-surface-variant: var(--ref-neutral-variant-80);

    --tone-background: var(--ref-neutral-6);
    --tone-on-background: var(--ref-neutral-90);
    --tone-outline: var(--ref-neutral-variant-60);
    --tone-outline-variant: var(--ref-neutral-variant-30);

    --tone-error: var(--ref-error-80);
    --tone-on-error: var(--ref-error-20);
    --tone-error-container: var(--ref-error-30);
    --tone-on-error-container: var(--ref-error-90);

    --tone-inverse-surface: var(--ref-neutral-90);
    --tone-inverse-on-surface: var(--ref-neutral-20);
    --tone-inverse-primary: var(--ref-primary-40);

    --color-success: oklch(0.8 0.18 145);
    --color-on-success: oklch(0.2 0.1 145);
    --color-success-container: oklch(0.3 0.1 145);
    --color-on-success-container: oklch(0.9 0.1 145);

    --color-warning: oklch(0.85 0.15 85);
    --color-on-warning: oklch(0.2 0.1 85);
    --color-warning-container: oklch(0.3 0.1 85);
    --color-on-warning-container: oklch(0.9 0.1 85);

    --color-info: oklch(0.8 0.18 245);
    --color-on-info: oklch(0.2 0.1 245);
    --color-info-container: oklch(0.3 0.1 245);
    --color-on-info-container: oklch(0.9 0.1 245);
  }
}

/* Manual .dark class override */
.dark {
  /* Update tone mapping for dark mode */
  --tone-primary: var(--ref-primary-80);
  --tone-on-primary: var(--ref-primary-20);
  --tone-primary-container: var(--ref-primary-30);
  --tone-on-primary-container: var(--ref-primary-90);

  --tone-secondary: var(--ref-secondary-80);
  --tone-on-secondary: var(--ref-secondary-20);
  --tone-secondary-container: var(--ref-secondary-30);
  --tone-on-secondary-container: var(--ref-secondary-90);

  --tone-tertiary: var(--ref-tertiary-80);
  --tone-on-tertiary: var(--ref-tertiary-20);
  --tone-tertiary-container: var(--ref-tertiary-30);
  --tone-on-tertiary-container: var(--ref-tertiary-90);

  --tone-surface: var(--ref-neutral-6);
  --tone-on-surface: var(--ref-neutral-90);
  --tone-surface-container-lowest: var(--ref-neutral-4);
  --tone-surface-container-low: var(--ref-neutral-10);
  --tone-surface-container: var(--ref-neutral-12);
  --tone-surface-container-high: var(--ref-neutral-17);
  --tone-surface-container-highest: var(--ref-neutral-22);
  --tone-surface-variant: var(--ref-neutral-variant-30);
  --tone-on-surface-variant: var(--ref-neutral-variant-80);

  --tone-background: var(--ref-neutral-6);
  --tone-on-background: var(--ref-neutral-90);
  --tone-outline: var(--ref-neutral-variant-60);
  --tone-outline-variant: var(--ref-neutral-variant-30);

  --tone-error: var(--ref-error-80);
  --tone-on-error: var(--ref-error-20);
  --tone-error-container: var(--ref-error-30);
  --tone-on-error-container: var(--ref-error-90);

  --tone-inverse-surface: var(--ref-neutral-90);
  --tone-inverse-on-surface: var(--ref-neutral-20);
  --tone-inverse-primary: var(--ref-primary-40);

  --color-success: oklch(0.8 0.18 145);
  --color-on-success: oklch(0.2 0.1 145);
  --color-success-container: oklch(0.3 0.1 145);
  --color-on-success-container: oklch(0.9 0.1 145);

  --color-warning: oklch(0.85 0.15 85);
  --color-on-warning: oklch(0.2 0.1 85);
  --color-warning-container: oklch(0.3 0.1 85);
  --color-on-warning-container: oklch(0.9 0.1 85);

  --color-info: oklch(0.8 0.18 245);
  --color-on-info: oklch(0.2 0.1 245);
  --color-info-container: oklch(0.3 0.1 245);
  --color-on-info-container: oklch(0.9 0.1 245);
}

/* ============================================================
   COLOR SCHEMES - Color strategy presets
   Usage: <html data-scheme="monochrome">

   Schemes control the COLOR STRATEGY (tonal, monochrome, neutral).
   They affect chroma and tone mapping.

   Available schemes:
   - tonal (default) - Full M3 tonal palette with vibrant colors
   - monochrome      - Pure grayscale, black/white buttons
   - neutral         - Low chroma, subtle color hints (professional)
   ============================================================ */

/* Monochrome scheme - pure grayscale with black primary buttons */
[data-scheme="monochrome"] {
  --chroma: 0;
  --chroma-neutral: 0;

  /* Remap to darker tones for true black buttons */
  --tone-primary: var(--ref-primary-20);
  --tone-on-primary: var(--ref-primary-95);
  --tone-primary-container: var(--ref-primary-90);
  --tone-on-primary-container: var(--ref-primary-10);

  --tone-secondary: var(--ref-secondary-30);
  --tone-on-secondary: var(--ref-secondary-95);
  --tone-secondary-container: var(--ref-secondary-90);
  --tone-on-secondary-container: var(--ref-secondary-10);

  --tone-tertiary: var(--ref-tertiary-30);
  --tone-on-tertiary: var(--ref-tertiary-95);
}

/* Monochrome dark mode */
.dark[data-scheme="monochrome"],
[data-scheme="monochrome"].dark {
  --tone-primary: var(--ref-primary-90);
  --tone-on-primary: var(--ref-primary-10);
  --tone-primary-container: var(--ref-primary-20);
  --tone-on-primary-container: var(--ref-primary-90);

  --tone-secondary: var(--ref-secondary-80);
  --tone-on-secondary: var(--ref-secondary-10);
  --tone-secondary-container: var(--ref-secondary-20);
  --tone-on-secondary-container: var(--ref-secondary-90);

  --tone-tertiary: var(--ref-tertiary-80);
  --tone-on-tertiary: var(--ref-tertiary-10);
}

/* Neutral scheme - low saturation, subtle color hints */
[data-scheme="neutral"] {
  --chroma: 0.04;
  --chroma-neutral: 0.01;
}

/* ============================================================
   CONTRAST LEVELS - Accessibility modifier
   Usage: <html data-contrast="high">

   Contrast controls TONE EXTREMITY for accessibility.
   Can be combined with any scheme.

   Available levels:
   - standard (default) - M3 baseline contrast
   - medium             - Slightly boosted for better readability
   - high               - Maximum contrast for accessibility (WCAG AAA)
   ============================================================ */

/* Medium contrast - boosted readability */
[data-contrast="medium"] {
  --tone-primary: var(--ref-primary-30);
  --tone-on-primary: var(--ref-primary-100);
  --tone-primary-container: var(--ref-primary-95);
  --tone-on-primary-container: var(--ref-primary-5, var(--ref-primary-10));

  --tone-secondary: var(--ref-secondary-30);
  --tone-on-secondary: var(--ref-secondary-100);

  --tone-on-surface: var(--ref-neutral-5, var(--ref-neutral-10));
  --tone-outline: var(--ref-neutral-variant-40);
}

.dark[data-contrast="medium"],
[data-contrast="medium"].dark {
  --tone-primary: var(--ref-primary-85, var(--ref-primary-80));
  --tone-on-primary: var(--ref-primary-10);
  --tone-primary-container: var(--ref-primary-25, var(--ref-primary-30));
  --tone-on-primary-container: var(--ref-primary-95);

  --tone-secondary: var(--ref-secondary-85, var(--ref-secondary-80));
  --tone-on-secondary: var(--ref-secondary-10);

  --tone-on-surface: var(--ref-neutral-95);
  --tone-outline: var(--ref-neutral-variant-70);
}

/* High contrast - maximum accessibility (WCAG AAA) */
[data-contrast="high"] {
  --tone-primary: var(--ref-primary-20);
  --tone-on-primary: var(--ref-primary-100);
  --tone-primary-container: var(--ref-primary-95);
  --tone-on-primary-container: var(--ref-primary-0);

  --tone-secondary: var(--ref-secondary-20);
  --tone-on-secondary: var(--ref-secondary-100);
  --tone-secondary-container: var(--ref-secondary-95);
  --tone-on-secondary-container: var(--ref-secondary-0);

  --tone-tertiary: var(--ref-tertiary-20);
  --tone-on-tertiary: var(--ref-tertiary-100);

  --tone-surface: var(--ref-neutral-100);
  --tone-on-surface: var(--ref-neutral-0);
  --tone-background: var(--ref-neutral-100);
  --tone-on-background: var(--ref-neutral-0);
  --tone-outline: var(--ref-neutral-variant-20);

  --tone-error: var(--ref-error-20);
  --tone-on-error: var(--ref-error-100);
}

.dark[data-contrast="high"],
[data-contrast="high"].dark {
  --tone-primary: var(--ref-primary-95);
  --tone-on-primary: var(--ref-primary-0);
  --tone-primary-container: var(--ref-primary-10);
  --tone-on-primary-container: var(--ref-primary-100);

  --tone-secondary: var(--ref-secondary-95);
  --tone-on-secondary: var(--ref-secondary-0);
  --tone-secondary-container: var(--ref-secondary-10);
  --tone-on-secondary-container: var(--ref-secondary-100);

  --tone-tertiary: var(--ref-tertiary-95);
  --tone-on-tertiary: var(--ref-tertiary-0);

  --tone-surface: var(--ref-neutral-0);
  --tone-on-surface: var(--ref-neutral-100);
  --tone-background: var(--ref-neutral-0);
  --tone-on-background: var(--ref-neutral-100);
  --tone-outline: var(--ref-neutral-variant-80);

  --tone-error: var(--ref-error-95);
  --tone-on-error: var(--ref-error-0);
}

/* ============================================================
   DENSITY - CSS-only via data attribute
   Usage: <html data-density="compact">
   ============================================================ */

[data-density="compact"] {
  --scale-space: 0.875;
  --scale-type: 0.9;
  --scale-radius: 0.8;
}

[data-density="dense"] {
  --scale-space: 0.75;
  --scale-type: 0.85;
  --scale-radius: 0.75;
}

[data-density="comfortable"] {
  --scale-space: 1.1;
  --scale-type: 1.0;
  --scale-radius: 1.0;
}

/* ============================================================
   RADIUS THEME - CSS-only via data attribute
   Usage: <html data-radius="soft">
   Values must match ThemeProvider RADIUS_PRESETS
   ============================================================ */

[data-radius="none"] {
  --scale-radius: 0;
}

[data-radius="minimal"] {
  --scale-radius: 0.25;
}

[data-radius="sharp"] {
  --scale-radius: 0.5;
}

[data-radius="standard"] {
  --scale-radius: 1.0;
}

[data-radius="soft"] {
  --scale-radius: 1.25;
}

/* ============================================================
   SCROLLBAR STYLING
   Consistent scrollbars for all modes
   ============================================================ */

/* Webkit scrollbar (Chrome, Safari, Edge) */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--color-surface-container-low);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: var(--color-outline-variant);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-outline);
}

/* Firefox scrollbar */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--color-outline-variant) var(--color-surface-container-low);
}

/* Dark mode scrollbar adjustments */
.dark ::-webkit-scrollbar-track,
:root:not(.light) ::-webkit-scrollbar-track {
  background: var(--color-surface-container);
}

.dark ::-webkit-scrollbar-thumb,
:root:not(.light) ::-webkit-scrollbar-thumb {
  background: var(--color-outline-variant);
}

.dark ::-webkit-scrollbar-thumb:hover,
:root:not(.light) ::-webkit-scrollbar-thumb:hover {
  background: var(--color-outline);
}

@media (prefers-color-scheme: dark) {
  :root:not(.light) {
    scrollbar-color: var(--color-outline-variant) var(--color-surface-container);
  }
}

.dark {
  scrollbar-color: var(--color-outline-variant) var(--color-surface-container);
}
`;

  return css;
}

/**
 * Generate Tailwind v4 @theme mapping
 * References the simplified CSS variables
 */
function generateTailwindTheme() {
  let css = `
/* ============================================================
   TAILWIND v4 THEME MAPPING
   Maps CSS variables to Tailwind utilities
   ============================================================ */

@theme {
  /* Breakpoints */
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
  --breakpoint-compact: 0px;
  --breakpoint-medium: 600px;
  --breakpoint-expanded: 840px;

  /* Colors - Direct reference to CSS vars */
  --color-primary: var(--color-primary);
  --color-on-primary: var(--color-on-primary);
  --color-primary-container: var(--color-primary-container);
  --color-on-primary-container: var(--color-on-primary-container);
  --color-secondary: var(--color-secondary);
  --color-on-secondary: var(--color-on-secondary);
  --color-secondary-container: var(--color-secondary-container);
  --color-on-secondary-container: var(--color-on-secondary-container);
  --color-tertiary: var(--color-tertiary);
  --color-on-tertiary: var(--color-on-tertiary);
  --color-tertiary-container: var(--color-tertiary-container);
  --color-on-tertiary-container: var(--color-on-tertiary-container);
  --color-surface: var(--color-surface);
  --color-on-surface: var(--color-on-surface);
  --color-surface-container-lowest: var(--color-surface-container-lowest);
  --color-surface-container-low: var(--color-surface-container-low);
  --color-surface-container: var(--color-surface-container);
  --color-surface-container-high: var(--color-surface-container-high);
  --color-surface-container-highest: var(--color-surface-container-highest);
  --color-surface-variant: var(--color-surface-variant);
  --color-on-surface-variant: var(--color-on-surface-variant);
  --color-background: var(--color-background);
  --color-on-background: var(--color-on-background);
  --color-outline: var(--color-outline);
  --color-outline-variant: var(--color-outline-variant);
  --color-error: var(--color-error);
  --color-on-error: var(--color-on-error);
  --color-error-container: var(--color-error-container);
  --color-on-error-container: var(--color-on-error-container);
  --color-success: var(--color-success);
  --color-on-success: var(--color-on-success);
  --color-success-container: var(--color-success-container);
  --color-on-success-container: var(--color-on-success-container);
  --color-warning: var(--color-warning);
  --color-on-warning: var(--color-on-warning);
  --color-warning-container: var(--color-warning-container);
  --color-on-warning-container: var(--color-on-warning-container);
  --color-info: var(--color-info);
  --color-on-info: var(--color-on-info);
  --color-info-container: var(--color-info-container);
  --color-on-info-container: var(--color-on-info-container);
  --color-inverse-surface: var(--color-inverse-surface);
  --color-inverse-on-surface: var(--color-inverse-on-surface);
  --color-inverse-primary: var(--color-inverse-primary);
  --color-scrim: var(--color-scrim);

  /* Radius */
  --radius-none: var(--radius-none);
  --radius-xs: var(--radius-xs);
  --radius-sm: var(--radius-sm);
  --radius-md: var(--radius-md);
  --radius-lg: var(--radius-lg);
  --radius-xl: var(--radius-xl);
  --radius-2xl: var(--radius-2xl);
  --radius-full: var(--radius-full);

  /* Shadows */
  --shadow-0: var(--shadow-0);
  --shadow-1: var(--shadow-1);
  --shadow-2: var(--shadow-2);
  --shadow-3: var(--shadow-3);
  --shadow-4: var(--shadow-4);
  --shadow-5: var(--shadow-5);

  /* Motion */
  --duration-short: var(--duration-short);
  --duration-snappy: var(--duration-snappy);
  --duration-medium: var(--duration-medium);
  --duration-emphasized: var(--duration-emphasized);
  --duration-long: var(--duration-long);
  --ease-standard: var(--ease-standard);
  --ease-emphasized: var(--ease-emphasized);
  --ease-decelerate: var(--ease-decelerate);
  --ease-accelerate: var(--ease-accelerate);

  /* Typography - using --text-* for Tailwind v4 text-* utilities */
  --font-sans: var(--font-sans);
`;

  // Typography scale - Tailwind v4 uses --text-* to generate text-* utilities
  // The --text-*--line-height, --text-*--letter-spacing, --text-*--font-weight suffixes
  // are automatically applied when using the text-* utility
  const typeNames = [
    "display-large", "display-medium", "display-small",
    "headline-large", "headline-medium", "headline-small",
    "title-large", "title-medium", "title-small",
    "body-large", "body-medium", "body-small",
    "label-large", "label-medium", "label-small",
  ];

  for (const name of typeNames) {
    css += `  --text-${name}: var(--type-${name}-size);
  --text-${name}--line-height: var(--type-${name}-line);
  --text-${name}--letter-spacing: var(--type-${name}-tracking);
  --text-${name}--font-weight: var(--type-${name}-weight);
`;
  }

  css += `
  /* Spacing - Standard Tailwind keys mapped to density-scaled values */
  /* These override Tailwind defaults so p-4, gap-2, etc. scale with density */
`;

  // Standard Tailwind spacing scale mapped to our unit system
  // Tailwind: 0.5 = 2px, 1 = 4px, 2 = 8px, etc. (0.25rem base)
  // Our system: 1u = 4px * scale, so p-4 = 4u = 16px * scale
  const tailwindSpacing = [
    [0, 0],           // 0 = 0px
    [0.5, 0.5],       // 0.5 = 2px = 0.5u
    [1, 1],           // 1 = 4px = 1u
    [1.5, 1.5],       // 1.5 = 6px = 1.5u
    [2, 2],           // 2 = 8px = 2u
    [2.5, 2.5],       // 2.5 = 10px = 2.5u
    [3, 3],           // 3 = 12px = 3u
    [3.5, 3.5],       // 3.5 = 14px = 3.5u
    [4, 4],           // 4 = 16px = 4u
    [5, 5],           // 5 = 20px = 5u
    [6, 6],           // 6 = 24px = 6u
    [7, 7],           // 7 = 28px = 7u
    [8, 8],           // 8 = 32px = 8u
    [9, 9],           // 9 = 36px = 9u
    [10, 10],         // 10 = 40px = 10u
    [11, 11],         // 11 = 44px = 11u
    [12, 12],         // 12 = 48px = 12u
    [14, 14],         // 14 = 56px = 14u
    [16, 16],         // 16 = 64px = 16u
    [20, 20],         // 20 = 80px = 20u
    [24, 24],         // 24 = 96px = 24u
    [28, 28],         // 28 = 112px = 28u
    [32, 32],         // 32 = 128px - not in our scale, use calc
    [36, 36],         // 36 = 144px
    [38, 38],         // 38 = 152px = 38u (our custom)
    [40, 40],         // 40 = 160px
    [44, 44],         // 44 = 176px
    [48, 48],         // 48 = 192px
    [52, 52],         // 52 = 208px
    [56, 56],         // 56 = 224px
    [60, 60],         // 60 = 240px
    [64, 64],         // 64 = 256px
    [72, 72],         // 72 = 288px = 72u (our custom)
    [80, 80],         // 80 = 320px
    [96, 96],         // 96 = 384px
    [100, 100],       // 100 = 400px = 100u (our custom)
  ];

  for (const [twKey, unitMultiplier] of tailwindSpacing) {
    if (twKey === 0) {
      css += `  --spacing-0: 0px;\n`;
    } else {
      // Use calc for dynamic scaling with --unit
      css += `  --spacing-${twKey.toString().replace(".", "_")}: calc(var(--unit) * ${unitMultiplier});\n`;
    }
  }

  // Keep legacy *u keys for backwards compatibility during migration
  css += `\n  /* Legacy unit-based spacing (deprecated - use standard keys above) */\n`;
  const units = [];
  for (let i = 1; i <= 32; i++) units.push(i / 2);
  units.push(20, 24, 28, 38, 72, 100);

  for (const u of units) {
    const key = u.toString().replace(".", "_");
    css += `  --spacing-${key}u: var(--space-${key}u);\n`;
  }

  css += `
  /* Layout */
  --spacing-layout-margin: var(--layout-margin);
  --spacing-layout-gutter: var(--layout-gutter);
  --width-pane-list: var(--layout-pane-list);
  --width-pane-fixed: var(--layout-pane-fixed);
  --width-pane-supporting: var(--layout-pane-supporting);
  --width-rail: var(--layout-rail);
  --width-drawer: var(--layout-drawer);

  /* Z-Index */
  --z-fab: var(--z-fab);
  --z-header: var(--z-header);
  --z-drawer: var(--z-drawer);
  --z-popover: var(--z-popover);
  --z-modal: var(--z-modal);

  /* Icons */
  --spacing-icon-xs: var(--icon-xs);
  --spacing-icon-sm: var(--icon-sm);
  --spacing-icon-md: var(--icon-md);
  --spacing-icon-lg: var(--icon-lg);
  --spacing-icon-xl: var(--icon-xl);

  /* Opacity */
  --opacity-hover: var(--opacity-hover);
  --opacity-focus: var(--opacity-focus);
  --opacity-pressed: var(--opacity-pressed);
  --opacity-dragged: var(--opacity-dragged);
  --opacity-disabled: var(--opacity-disabled);
  --opacity-muted: var(--opacity-muted);
}
`;

  return css;
}

/**
 * Generate base styles (animations, focus rings, utilities)
 */
function generateBaseStyles() {
  return `
/* ============================================================
   BASE STYLES - Animations, Focus Rings, Utilities
   ============================================================ */

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
  /* Global box-sizing */
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

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

  /* Base document styles */
  html,
  body {
    height: 100%;
    margin: 0;
    padding: 0;
  }

  body {
    background-color: var(--color-background);
    color: var(--color-on-background);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
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
}

// Build
function build() {
  console.log(`Building Unisane tokens for "${config.name}" theme...`);
  console.log(`  Primary: hue=${config.primary.hue}°, chroma=${config.primary.chroma}`);

  // Generate all parts
  const tokensCss = generateUniTokens();
  const tailwindTheme = generateTailwindTheme();
  const baseStyles = generateBaseStyles();

  // Merge into single file: unisane.css
  const mergedCss = tokensCss + tailwindTheme + baseStyles;
  writeFileSync(join(distDir, "unisane.css"), mergedCss);
  console.log("✓ Generated unisane.css (merged: tokens + theme + base)");

  // Add deprecation notice to individual files
  const deprecationNotice = `/*
 * DEPRECATED: This file will be removed in a future version.
 * Please use the merged file instead:
 *   @import "@unisane/tokens/unisane.css";
 */

`;

  // Output individual files with deprecation notice (for backwards compatibility)
  writeFileSync(join(distDir, "uni-tokens.css"), deprecationNotice + tokensCss);
  writeFileSync(join(distDir, "uni-theme.css"), deprecationNotice + tailwindTheme);
  writeFileSync(join(distDir, "uni-base.css"), deprecationNotice + baseStyles);
  console.log("✓ Generated individual files with deprecation notice");

  console.log("\nDone! Use the single merged import:");
  console.log('  @import "@unisane/tokens/unisane.css";');
}

build();

// Watch mode
if (process.argv.includes("--watch")) {
  console.log("Watching for changes...");
  const chokidar = await import("chokidar");
  const watcher = chokidar.watch([join(srcDir, "**/*.json")]);

  watcher.on("change", (path) => {
    console.log(`File changed: ${path}`);
    build();
  });
}
