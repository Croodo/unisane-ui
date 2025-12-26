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
 * OKLCH Color Generation System
 *
 * This system generates complete color palettes from a single primary hue.
 * Secondary, tertiary, and neutral colors are derived using color theory.
 *
 * OKLCH (Oklab Lightness Chroma Hue) provides perceptually uniform colors,
 * meaning equal steps in values produce equal perceived differences.
 *
 * RUNTIME THEMING:
 * Users can override colors by setting CSS variables in their globals.css:
 *   :root {
 *     --uni-hue-primary: 145;    // Green theme
 *     --uni-chroma-primary: 0.14;
 *   }
 *
 * To switch build themes: node scripts/build.mjs --theme=green
 * Available themes: blue (default), green, orange, red, purple, teal
 */

// M3-style tonal palette lightness values (0-100 scale mapped to OKLCH 0-1)
const TONAL_LIGHTNESS = {
  0: 0.0,
  10: 0.22,
  20: 0.33,
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
  10: 0.7,
  20: 0.85,
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
 * Now outputs OKLCH colors with CSS variables for runtime theming
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

  let css = `/* Unisane UI Tokens - Reference and System Tokens */
/* Generated from "${config.name}" theme using OKLCH color science */
/* Default: Primary Hue ${primaryHue}° | Chroma ${primaryChroma} */

/* ============================================================
   RUNTIME THEMING - Override these variables to change colors!
   ============================================================

   Example - Switch to green theme:
   :root {
     --uni-hue-primary: 145;
     --uni-chroma-primary: 0.14;
   }

   Example - Switch to purple theme:
   :root {
     --uni-hue-primary: 285;
   }

   Available hue values:
   - Blue: 240    - Green: 145   - Teal: 180
   - Purple: 285  - Orange: 70   - Red: 25
   ============================================================ */

:root {
  /* Theme Configuration Variables - CUSTOMIZE THESE! */
  --uni-hue-primary: ${primaryHue};
  --uni-chroma-primary: ${primaryChroma};
  --uni-hue-secondary: var(--uni-hue-primary);
  --uni-chroma-secondary: calc(var(--uni-chroma-primary) * ${secondaryChromaScale});
  --uni-hue-tertiary: calc(var(--uni-hue-primary) + ${tertiaryHueShift});
  --uni-chroma-tertiary: calc(var(--uni-chroma-primary) * ${tertiaryChromaScale});
  --uni-hue-neutral: var(--uni-hue-primary);
  --uni-chroma-neutral: ${neutralTint};
  --uni-hue-error: ${errorHue};
  --uni-chroma-error: ${errorChroma};
}

/* Reference Tokens - Generated from OKLCH */
:root {
`;

  // Generate OKLCH-based reference tokens
  const paletteConfigs = [
    { name: 'primary', hueVar: '--uni-hue-primary', baseChroma: primaryChroma },
    { name: 'secondary', hueVar: '--uni-hue-secondary', baseChroma: primaryChroma * secondaryChromaScale },
    { name: 'tertiary', hueVar: '--uni-hue-tertiary', baseChroma: primaryChroma * tertiaryChromaScale },
    { name: 'neutral', hueVar: '--uni-hue-neutral', baseChroma: neutralTint },
    { name: 'neutral-variant', hueVar: '--uni-hue-neutral', baseChroma: neutralTint * 1.5 },
    { name: 'error', hueVar: '--uni-hue-error', baseChroma: errorChroma },
  ];

  for (const { name, hueVar, baseChroma } of paletteConfigs) {
    css += `  /* ${name} palette */\n`;

    for (const [tone, lightness] of Object.entries(TONAL_LIGHTNESS)) {
      const chromaMultiplier = CHROMA_SCALE[tone];
      const chroma = (baseChroma * chromaMultiplier).toFixed(4);

      // Pure black and white for extremes
      if (tone === '0') {
        css += `  --uni-ref-${name}-0: #000000;\n`;
      } else if (tone === '100') {
        css += `  --uni-ref-${name}-100: #FFFFFF;\n`;
      } else {
        // OKLCH with CSS variable for hue - enables runtime theming!
        css += `  --uni-ref-${name}-${tone}: oklch(${lightness} ${chroma} var(${hueVar}));\n`;
      }
    }
    css += "\n";
  }

  css += `}

/* System Tokens - Light Mode */
:root {
  /* Scaling Knobs (SSOT) - Defined first for calc() usage */
  --uni-sys-space-scale: 1;
  --uni-sys-type-scale: 1;
  --uni-sys-radius-scale: 1;
  --uni-sys-u: calc(4px * var(--uni-sys-space-scale));

  /* Pane Widths */
  --width-pane-list: 360px;
  --width-pane-fixed: 412px;
  --width-pane-supporting: 400px;
  --width-rail-collapsed: 80px;
  --width-drawer-compact: 360px;

  /* Color roles */
  --uni-sys-color-primary: var(--uni-ref-primary-40);
  --uni-sys-color-on-primary: var(--uni-ref-primary-100);
  --uni-sys-color-primary-container: var(--uni-ref-primary-90);
  --uni-sys-color-on-primary-container: var(--uni-ref-primary-10);

  --uni-sys-color-secondary: var(--uni-ref-secondary-40);
  --uni-sys-color-on-secondary: var(--uni-ref-secondary-100);
  --uni-sys-color-secondary-container: var(--uni-ref-secondary-90);
  --uni-sys-color-on-secondary-container: var(--uni-ref-secondary-10);

  --uni-sys-color-tertiary: var(--uni-ref-tertiary-40);
  --uni-sys-color-on-tertiary: var(--uni-ref-tertiary-100);
  --uni-sys-color-tertiary-container: var(--uni-ref-tertiary-90);
  --uni-sys-color-on-tertiary-container: var(--uni-ref-tertiary-10);

  --uni-sys-color-surface: var(--uni-ref-neutral-99);
  --uni-sys-color-on-surface: var(--uni-ref-neutral-10);
  --uni-sys-color-surface-container-lowest: var(--uni-ref-neutral-100);
  --uni-sys-color-surface-container-low: var(--uni-ref-neutral-95);
  --uni-sys-color-surface-container: var(--uni-ref-neutral-90);
  --uni-sys-color-surface-container-high: var(--uni-ref-neutral-80);
  --uni-sys-color-surface-container-highest: var(--uni-ref-neutral-70);

  --uni-sys-color-surface-variant: var(--uni-ref-neutral-variant-90);
  --uni-sys-color-on-surface-variant: var(--uni-ref-neutral-variant-30);
  --uni-sys-color-background: var(--uni-ref-neutral-99);
  --uni-sys-color-on-background: var(--uni-ref-neutral-10);
  --uni-sys-color-outline: var(--uni-ref-neutral-variant-50);
  --uni-sys-color-outline-variant: var(--uni-ref-neutral-variant-80);
  --uni-sys-color-error: var(--uni-ref-error-40);
  --uni-sys-color-on-error: var(--uni-ref-error-100);
  --uni-sys-color-error-container: var(--uni-ref-error-90);
  --uni-sys-color-on-error-container: var(--uni-ref-error-10);

  --uni-sys-color-success: oklch(0.55 0.18 145);
  --uni-sys-color-on-success: oklch(0.98 0 0);
  --uni-sys-color-success-container: oklch(0.92 0.08 145);
  --uni-sys-color-on-success-container: oklch(0.25 0.1 145);

  --uni-sys-color-warning: oklch(0.62 0.16 85);
  --uni-sys-color-on-warning: oklch(0.98 0 0);
  --uni-sys-color-warning-container: oklch(0.92 0.08 85);
  --uni-sys-color-on-warning-container: oklch(0.25 0.1 85);

  --uni-sys-color-info: oklch(0.58 0.16 245);
  --uni-sys-color-on-info: oklch(0.98 0 0);
  --uni-sys-color-info-container: oklch(0.92 0.08 245);
  --uni-sys-color-on-info-container: oklch(0.25 0.08 245);

  --uni-sys-color-inverse-surface: var(--uni-ref-neutral-20);
  --uni-sys-color-inverse-on-surface: var(--uni-ref-neutral-95);
  --uni-sys-color-inverse-primary: var(--uni-ref-primary-80);
  --uni-sys-color-scrim: rgba(0, 0, 0, 0.32);

  /* Typography tokens */
  --uni-ref-font-sans: var(--font-inter, system-ui), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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

  for (const [name, props] of Object.entries(typeScale)) {
    css += `  --uni-sys-type-${name}-font: var(--uni-ref-font-sans);
  --uni-sys-type-${name}-weight: ${props.weight};
  --uni-sys-type-${name}-size: calc(${props.size}px * var(--uni-sys-type-scale));
  --uni-sys-type-${name}-line: calc(${props.line}px * var(--uni-sys-type-scale));
  --uni-sys-type-${name}-tracking: ${props.tracking};
`;
  }

  css += `
  /* Shape tokens */
  --uni-sys-shape-corner-none: 0px;
  --uni-sys-shape-corner-extra-small: calc(4px * var(--uni-sys-radius-scale));
  --uni-sys-shape-corner-small: calc(8px * var(--uni-sys-radius-scale));
  --uni-sys-shape-corner-medium: calc(12px * var(--uni-sys-radius-scale));
  --uni-sys-shape-corner-large: calc(20px * var(--uni-sys-radius-scale));
  --uni-sys-shape-corner-extra-large: calc(32px * var(--uni-sys-radius-scale));
  --uni-sys-shape-corner-extra-extra-large: calc(48px * var(--uni-sys-radius-scale));
  --uni-sys-shape-corner-full: 9999px;

  /* Elevation tokens */
  --uni-sys-elevation-0: none;
  --uni-sys-elevation-1: 0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30);
  --uni-sys-elevation-2: 0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30);
  --uni-sys-elevation-3: 0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.30);
  --uni-sys-elevation-4: 0px 6px 10px 4px rgba(0, 0, 0, 0.15), 0px 2px 3px 0px rgba(0, 0, 0, 0.30);
  --uni-sys-elevation-5: 0px 8px 12px 6px rgba(0, 0, 0, 0.15), 0px 4px 4px 0px rgba(0, 0, 0, 0.30);

  /* Motion tokens */
  --uni-sys-motion-duration-short-1: 50ms;
  --uni-sys-motion-duration-short-2: 100ms;
  --uni-sys-motion-duration-snappy: 150ms;
  --uni-sys-motion-duration-medium-1: 200ms;
  --uni-sys-motion-duration-medium-2: 250ms;
  --uni-sys-motion-duration-emphasized: 300ms;
  --uni-sys-motion-duration-long-1: 400ms;
  --uni-sys-motion-duration-long-2: 500ms;
  --uni-sys-motion-ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --uni-sys-motion-ease-standard-accelerate: cubic-bezier(0.3, 0, 1, 1);
  --uni-sys-motion-ease-standard-decelerate: cubic-bezier(0, 0, 0, 1);
  --uni-sys-motion-ease-emphasized: cubic-bezier(0.2, 0, 0, 1);
  --uni-sys-motion-ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);

  /* State layer tokens */
  --uni-sys-state-hover-opacity: var(--uni-sys-opacity-hover);
  --uni-sys-state-pressed-opacity: var(--uni-sys-opacity-pressed);
  --uni-sys-state-focus-opacity: var(--uni-sys-opacity-focus);

  /* Opacity Scale */
  --uni-sys-opacity-5: 0.05;
  --uni-sys-opacity-10: 0.10;
  --uni-sys-opacity-20: 0.20;
  --uni-sys-opacity-25: 0.25;
  --uni-sys-opacity-40: 0.40;
  --uni-sys-opacity-50: 0.50;
  --uni-sys-opacity-60: 0.60;
  --uni-sys-opacity-75: 0.75;
  --uni-sys-opacity-80: 0.80;
  --uni-sys-opacity-90: 0.90;
  --uni-sys-opacity-hover: 0.08;
  --uni-sys-opacity-focus: 0.10;
  --uni-sys-opacity-pressed: 0.10;
  --uni-sys-opacity-dragged: 0.16;
  --uni-sys-opacity-scrim: 0.32;
  --uni-sys-opacity-disabled: 0.38;
  --uni-sys-opacity-muted: 0.60;
  --uni-sys-opacity-subtle: 0.04;

  /* Icon Sizing (Fluid) */
  --uni-sys-icon-size-xs: calc(16px * var(--uni-sys-space-scale));
  --uni-sys-icon-size-sm: calc(20px * var(--uni-sys-space-scale));
  --uni-sys-icon-size-md: calc(24px * var(--uni-sys-space-scale));
  --uni-sys-icon-size-lg: calc(32px * var(--uni-sys-space-scale));
  --uni-sys-icon-size-xl: calc(48px * var(--uni-sys-space-scale));

  /* Spacing Units */
`;

  // Unit spacing (0.5u to 16u, plus larger values)
  const units = [];
  for (let i = 1; i <= 32; i++) units.push(i / 2);
  units.push(20, 24, 28, 38);

  for (const u of units) {
    const key = u.toString().replace(".", "_");
    css += `  --uni-sys-space-${key}u: calc(var(--uni-sys-u) * ${u});\n`;
  }

  css += `
  /* Legacy Spacing Mappings */
  --uni-sys-space-1: calc(4px * var(--uni-sys-space-scale));
  --uni-sys-space-2: calc(8px * var(--uni-sys-space-scale));
  --uni-sys-space-3: calc(12px * var(--uni-sys-space-scale));
  --uni-sys-space-4: calc(16px * var(--uni-sys-space-scale));
  --uni-sys-space-5: calc(20px * var(--uni-sys-space-scale));
  --uni-sys-space-6: calc(24px * var(--uni-sys-space-scale));
  --uni-sys-space-7: calc(28px * var(--uni-sys-space-scale));
  --uni-sys-space-8: calc(32px * var(--uni-sys-space-scale));
  --uni-sys-space-9: calc(36px * var(--uni-sys-space-scale));
  --uni-sys-space-10: calc(40px * var(--uni-sys-space-scale));
  --uni-sys-space-11: calc(44px * var(--uni-sys-space-scale));
  --uni-sys-space-12: calc(48px * var(--uni-sys-space-scale));
  --uni-sys-space-13: calc(52px * var(--uni-sys-space-scale));
  --uni-sys-space-14: calc(56px * var(--uni-sys-space-scale));
  --uni-sys-space-15: calc(60px * var(--uni-sys-space-scale));
  --uni-sys-space-16: calc(64px * var(--uni-sys-space-scale));

  /* Layout tokens */
  --uni-sys-layout-margin: calc(16px * var(--uni-sys-space-scale));
  --uni-sys-layout-gutter: calc(16px * var(--uni-sys-space-scale));
  --uni-sys-layout-pane-gap: calc(20px * var(--uni-sys-space-scale));
  --uni-sys-layout-pane-list-width: calc(360px * var(--uni-sys-space-scale));
  --uni-sys-layout-pane-fixed-width: calc(412px * var(--uni-sys-space-scale));
  --uni-sys-layout-pane-supporting-width: calc(400px * var(--uni-sys-space-scale));
  --uni-sys-layout-rail-collapsed-width: calc(72px * var(--uni-sys-space-scale));
  --uni-sys-layout-drawer-width: calc(360px * var(--uni-sys-space-scale));

  /* Z-Index Scale */
  --uni-sys-z-modal: 3000;
  --uni-sys-z-popover: 2000;
  --uni-sys-z-drawer: 1500;
  --uni-sys-z-header: 1000;
  --uni-sys-z-fab: 500;
}

/* Dark mode */
.dark {
  --uni-sys-color-primary: var(--uni-ref-primary-80);
  --uni-sys-color-on-primary: var(--uni-ref-primary-20);
  --uni-sys-color-primary-container: var(--uni-ref-primary-30);
  --uni-sys-color-on-primary-container: var(--uni-ref-primary-90);

  --uni-sys-color-secondary: var(--uni-ref-secondary-80);
  --uni-sys-color-on-secondary: var(--uni-ref-secondary-20);
  --uni-sys-color-secondary-container: var(--uni-ref-secondary-30);
  --uni-sys-color-on-secondary-container: var(--uni-ref-secondary-90);

  --uni-sys-color-tertiary: var(--uni-ref-tertiary-80);
  --uni-sys-color-on-tertiary: var(--uni-ref-tertiary-20);
  --uni-sys-color-tertiary-container: var(--uni-ref-tertiary-30);
  --uni-sys-color-on-tertiary-container: var(--uni-ref-tertiary-90);

  --uni-sys-color-surface: var(--uni-ref-neutral-10);
  --uni-sys-color-on-surface: var(--uni-ref-neutral-90);
  --uni-sys-color-surface-container-lowest: var(--uni-ref-neutral-10);
  --uni-sys-color-surface-container-low: var(--uni-ref-neutral-20);
  --uni-sys-color-surface-container: var(--uni-ref-neutral-30);
  --uni-sys-color-surface-container-high: var(--uni-ref-neutral-40);
  --uni-sys-color-surface-container-highest: var(--uni-ref-neutral-50);

  --uni-sys-color-surface-variant: var(--uni-ref-neutral-variant-30);
  --uni-sys-color-on-surface-variant: var(--uni-ref-neutral-variant-80);
  --uni-sys-color-background: var(--uni-ref-neutral-10);
  --uni-sys-color-on-background: var(--uni-ref-neutral-90);
  --uni-sys-color-outline: var(--uni-ref-neutral-variant-60);
  --uni-sys-color-outline-variant: var(--uni-ref-neutral-variant-30);

  --uni-sys-color-error: var(--uni-ref-error-80);
  --uni-sys-color-on-error: var(--uni-ref-error-20);
  --uni-sys-color-error-container: var(--uni-ref-error-30);
  --uni-sys-color-on-error-container: var(--uni-ref-error-90);

  --uni-sys-color-success: oklch(0.8 0.18 145);
  --uni-sys-color-on-success: oklch(0.2 0.1 145);
  --uni-sys-color-success-container: oklch(0.3 0.1 145);
  --uni-sys-color-on-success-container: oklch(0.9 0.1 145);

  --uni-sys-color-warning: oklch(0.85 0.15 85);
  --uni-sys-color-on-warning: oklch(0.2 0.1 85);
  --uni-sys-color-warning-container: oklch(0.3 0.1 85);
  --uni-sys-color-on-warning-container: oklch(0.9 0.1 85);

  --uni-sys-color-info: oklch(0.8 0.18 245);
  --uni-sys-color-on-info: oklch(0.2 0.1 245);
  --uni-sys-color-info-container: oklch(0.3 0.1 245);
  --uni-sys-color-on-info-container: oklch(0.9 0.1 245);

  --uni-sys-color-inverse-surface: var(--uni-ref-neutral-90);
  --uni-sys-color-inverse-on-surface: var(--uni-ref-neutral-20);
  --uni-sys-color-inverse-primary: var(--uni-ref-primary-40);

  --uni-sys-color-scrim: rgba(0, 0, 0, 0.32);
}

/* Density Overrides */
:root[data-density="compact"] {
  --uni-sys-space-scale: 0.875;
  --uni-sys-type-scale: 0.9;
  --uni-sys-radius-scale: 0.8;
}
:root[data-density="dense"] {
  --uni-sys-space-scale: 0.75;
  --uni-sys-type-scale: 0.85;
  --uni-sys-radius-scale: 0.75;
}
:root[data-density="comfortable"] {
  --uni-sys-space-scale: 1.1;
  --uni-sys-type-scale: 1.0;
  --uni-sys-radius-scale: 1.0;
}

/* Radius Theme Overrides */
:root[data-radius="sharp"] {
  --uni-sys-radius-scale: 0.75;
}
:root[data-radius="standard"] {
  --uni-sys-radius-scale: 1.0;
}
:root[data-radius="soft"] {
  --uni-sys-radius-scale: 1.15;
}
`;

  return css;
}

// Generate uni-theme.css - Tailwind v4 @theme mapping
function generateUniTheme() {
  let css = `/* Unisane UI - Tailwind v4 Theme */
/* Generated from "${config.name}" theme using OKLCH color science */
/* Import AFTER @import 'tailwindcss' */

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

  /* Colors - Reference to --uni-sys-color-* variables */
  --color-primary: var(--uni-sys-color-primary);
  --color-on-primary: var(--uni-sys-color-on-primary);
  --color-primary-container: var(--uni-sys-color-primary-container);
  --color-on-primary-container: var(--uni-sys-color-on-primary-container);
  --color-secondary: var(--uni-sys-color-secondary);
  --color-on-secondary: var(--uni-sys-color-on-secondary);
  --color-secondary-container: var(--uni-sys-color-secondary-container);
  --color-on-secondary-container: var(--uni-sys-color-on-secondary-container);
  --color-tertiary: var(--uni-sys-color-tertiary);
  --color-on-tertiary: var(--uni-sys-color-on-tertiary);
  --color-tertiary-container: var(--uni-sys-color-tertiary-container);
  --color-on-tertiary-container: var(--uni-sys-color-on-tertiary-container);
  --color-surface: var(--uni-sys-color-surface);
  --color-on-surface: var(--uni-sys-color-on-surface);
  --color-surface-container-lowest: var(--uni-sys-color-surface-container-lowest);
  --color-surface-container-low: var(--uni-sys-color-surface-container-low);
  --color-surface-container: var(--uni-sys-color-surface-container);
  --color-surface-container-high: var(--uni-sys-color-surface-container-high);
  --color-surface-container-highest: var(--uni-sys-color-surface-container-highest);
  --color-surface-variant: var(--uni-sys-color-surface-variant);
  --color-on-surface-variant: var(--uni-sys-color-on-surface-variant);
  --color-background: var(--uni-sys-color-background);
  --color-on-background: var(--uni-sys-color-on-background);
  --color-outline: var(--uni-sys-color-outline);
  --color-outline-variant: var(--uni-sys-color-outline-variant);
  --color-error: var(--uni-sys-color-error);
  --color-on-error: var(--uni-sys-color-on-error);
  --color-error-container: var(--uni-sys-color-error-container);
  --color-on-error-container: var(--uni-sys-color-on-error-container);
  --color-success: var(--uni-sys-color-success);
  --color-on-success: var(--uni-sys-color-on-success);
  --color-success-container: var(--uni-sys-color-success-container);
  --color-on-success-container: var(--uni-sys-color-on-success-container);
  --color-warning: var(--uni-sys-color-warning);
  --color-on-warning: var(--uni-sys-color-on-warning);
  --color-warning-container: var(--uni-sys-color-warning-container);
  --color-on-warning-container: var(--uni-sys-color-on-warning-container);
  --color-info: var(--uni-sys-color-info);
  --color-on-info: var(--uni-sys-color-on-info);
  --color-info-container: var(--uni-sys-color-info-container);
  --color-on-info-container: var(--uni-sys-color-on-info-container);
  --color-inverse-surface: var(--uni-sys-color-inverse-surface);
  --color-inverse-on-surface: var(--uni-sys-color-inverse-on-surface);
  --color-inverse-primary: var(--uni-sys-color-inverse-primary);
  --color-scrim: var(--uni-sys-color-scrim);

  /* Radius */
  --radius-none: var(--uni-sys-shape-corner-none);
  --radius-extra-small: var(--uni-sys-shape-corner-extra-small);
  --radius-small: var(--uni-sys-shape-corner-small);
  --radius-medium: var(--uni-sys-shape-corner-medium);
  --radius-large: var(--uni-sys-shape-corner-large);
  --radius-extra-large: var(--uni-sys-shape-corner-extra-large);
  --radius-full: var(--uni-sys-shape-corner-full);

  /* Shadows */
  --shadow-0: var(--uni-sys-elevation-0);
  --shadow-1: var(--uni-sys-elevation-1);
  --shadow-2: var(--uni-sys-elevation-2);
  --shadow-3: var(--uni-sys-elevation-3);
  --shadow-4: var(--uni-sys-elevation-4);
  --shadow-5: var(--uni-sys-elevation-5);

  /* Motion */
  --duration-short: var(--uni-sys-motion-duration-short-2);
  --duration-snappy: var(--uni-sys-motion-duration-snappy);
  --duration-medium: var(--uni-sys-motion-duration-medium-2);
  --duration-emphasized: var(--uni-sys-motion-duration-emphasized);
  --duration-long: var(--uni-sys-motion-duration-long-2);
  --ease-standard: var(--uni-sys-motion-ease-standard);
  --ease-emphasized: var(--uni-sys-motion-ease-emphasized);
  --ease-decelerate: var(--uni-sys-motion-ease-standard-decelerate);
  --ease-accelerate: var(--uni-sys-motion-ease-standard-accelerate);

  /* Typography */
  --font-sans: var(--uni-ref-font-sans);
`;

  // Typography scale
  const typeNames = [
    "display-large", "display-medium", "display-small",
    "headline-large", "headline-medium", "headline-small",
    "title-large", "title-medium", "title-small",
    "body-large", "body-medium", "body-small",
    "label-large", "label-medium", "label-small",
  ];

  for (const name of typeNames) {
    css += `  --font-size-${name}: var(--uni-sys-type-${name}-size);
  --line-height-${name}: var(--uni-sys-type-${name}-line);
`;
  }

  css += `
  /* Spacing */
`;

  // Unit spacing
  const units = [];
  for (let i = 1; i <= 32; i++) units.push(i / 2);
  units.push(20, 24, 28, 38);

  for (const u of units) {
    const key = u.toString().replace(".", "_");
    css += `  --spacing-${key}u: var(--uni-sys-space-${key}u);\n`;
  }

  css += `
  /* Layout */
  --spacing-layout-margin: var(--uni-sys-layout-margin);
  --spacing-layout-gutter: var(--uni-sys-layout-gutter);
  --width-pane-list: var(--uni-sys-layout-pane-list-width);
  --width-pane-fixed: var(--uni-sys-layout-pane-fixed-width);
  --width-pane-supporting: var(--uni-sys-layout-pane-supporting-width);
  --width-rail: var(--uni-sys-layout-rail-collapsed-width);
  --width-drawer: var(--uni-sys-layout-drawer-width);

  /* Z-Index */
  --z-fab: var(--uni-sys-z-fab);
  --z-header: var(--uni-sys-z-header);
  --z-drawer: var(--uni-sys-z-drawer);
  --z-popover: var(--uni-sys-z-popover);
  --z-modal: var(--uni-sys-z-modal);

  /* Icons */
  --spacing-icon-xs: var(--uni-sys-icon-size-xs);
  --spacing-icon-sm: var(--uni-sys-icon-size-sm);
  --spacing-icon-md: var(--uni-sys-icon-size-md);
  --spacing-icon-lg: var(--uni-sys-icon-size-lg);
  --spacing-icon-xl: var(--uni-sys-icon-size-xl);

  /* Opacity */
  --opacity-hover: var(--uni-sys-opacity-hover);
  --opacity-focus: var(--uni-sys-opacity-focus);
  --opacity-pressed: var(--uni-sys-opacity-pressed);
  --opacity-dragged: var(--uni-sys-opacity-dragged);
  --opacity-disabled: var(--uni-sys-opacity-disabled);
  --opacity-muted: var(--uni-sys-opacity-muted);
  --opacity-38: 0.38;
}
`;

  return css;
}

// Build
function build() {
  console.log(`Building Unisane tokens for "${config.name}" theme...`);
  console.log(`  Primary: hue=${config.primary.hue}°, chroma=${config.primary.chroma}`);

  const tokensCss = generateUniTokens();
  writeFileSync(join(distDir, "uni-tokens.css"), tokensCss);
  console.log("✓ Generated uni-tokens.css");

  const themeCss = generateUniTheme();
  writeFileSync(join(distDir, "uni-theme.css"), themeCss);
  console.log("✓ Generated uni-theme.css");

  console.log("Done!");
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
