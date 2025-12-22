#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const srcDir = join(rootDir, "src");
const distDir = join(rootDir, "dist");

// Ensure dist directory exists
mkdirSync(distDir, { recursive: true });

// Load reference tokens
const refTokens = JSON.parse(readFileSync(join(srcDir, "ref.json"), "utf-8"));

// Generate uni-tokens.css
function generateUniTokens() {
  let css = "/* Unisane UI Tokens - Reference and System Tokens */\n\n";

  // Reference tokens - wrapped in :root
  css += "/* Reference Tokens */\n";
  css += ":root {\n";
  for (const [palette, shades] of Object.entries(refTokens)) {
    css += `  /* ${palette} palette */\n`;
    for (const [shade, value] of Object.entries(shades)) {
      css += `  --uni-ref-${palette}-${shade}: ${value};\n`;
    }
    css += "\n";
  }
  css += "}\n\n";

  // System tokens - Light mode
  css += "/* System Tokens - Light Mode */\n";
  css += ":root {\n";

  // Scaling Knobs FIRST (before any tokens that use them)
  css += "  /* Scaling Knobs (SSOT) - Defined first for calc() usage */\n";
  css += "  --uni-sys-space-scale: 1;\n";
  css += "  --uni-sys-type-scale: 1;\n";
  css += "  --uni-sys-radius-scale: 0.85;\n";
  css += "  --uni-sys-u: calc(4px * var(--uni-sys-space-scale));\n";
  css += "\n";

  // Pane Width Tokens (M3 Specs)
  css += "  /* Pane Widths */\n";
  css += "  --width-pane-list: 360px;\n";
  css += "  --width-pane-fixed: 412px;\n";
  css += "  --width-pane-supporting: 400px;\n";
  css += "  --width-rail-collapsed: 96px;\n";
  css += "  --width-drawer-compact: 360px;\n";
  css += "\n";

  // Color roles
  css += "  /* Color roles */\n";
  css += "  --uni-sys-color-primary: var(--uni-ref-primary-40);\n";
  css += "  --uni-sys-color-on-primary: var(--uni-ref-primary-100);\n";
  css += "  --uni-sys-color-primary-container: var(--uni-ref-primary-90);\n";
  css += "  --uni-sys-color-on-primary-container: var(--uni-ref-primary-10);\n";
  css += "\n";
  css += "  --uni-sys-color-secondary: var(--uni-ref-secondary-40);\n";
  css += "  --uni-sys-color-on-secondary: var(--uni-ref-secondary-100);\n";
  css +=
    "  --uni-sys-color-secondary-container: var(--uni-ref-secondary-90);\n";
  css +=
    "  --uni-sys-color-on-secondary-container: var(--uni-ref-secondary-10);\n";
  css += "\n";
  css += "  --uni-sys-color-tertiary: var(--uni-ref-tertiary-40);\n";
  css += "  --uni-sys-color-on-tertiary: var(--uni-ref-tertiary-100);\n";
  css += "  --uni-sys-color-tertiary-container: var(--uni-ref-tertiary-90);\n";
  css +=
    "  --uni-sys-color-on-tertiary-container: var(--uni-ref-tertiary-10);\n";
  css += "\n";
  css += "  --uni-sys-color-surface: var(--uni-ref-neutral-99);\n";
  css += "  --uni-sys-color-on-surface: var(--uni-ref-neutral-10);\n";
  css +=
    "  --uni-sys-color-surface-container-lowest: var(--uni-ref-neutral-100);\n";
  css +=
    "  --uni-sys-color-surface-container-low: var(--uni-ref-neutral-95);\n";
  css += "  --uni-sys-color-surface-container: var(--uni-ref-neutral-90);\n";
  css +=
    "  --uni-sys-color-surface-container-high: var(--uni-ref-neutral-80);\n";
  css +=
    "  --uni-sys-color-surface-container-highest: var(--uni-ref-neutral-70);\n";
  css += "\n";
  css +=
    "  --uni-sys-color-surface-variant: var(--uni-ref-neutral-variant-90);\n";
  css +=
    "  --uni-sys-color-on-surface-variant: var(--uni-ref-neutral-variant-30);\n";
  css += "  --uni-sys-color-background: var(--uni-ref-neutral-99);\n";
  css += "  --uni-sys-color-on-background: var(--uni-ref-neutral-10);\n";
  css += "  --uni-sys-color-outline: var(--uni-ref-neutral-variant-50);\n";
  css +=
    "  --uni-sys-color-outline-variant: var(--uni-ref-neutral-variant-80);\n";
  css += "  --uni-sys-color-error: var(--uni-ref-error-40);\n";
  css += "  --uni-sys-color-on-error: var(--uni-ref-error-100);\n";
  css += "  --uni-sys-color-error-container: var(--uni-ref-error-90);\n";
  css += "  --uni-sys-color-on-error-container: var(--uni-ref-error-10);\n";
  css += "\n";
  css += "  --uni-sys-color-success: oklch(0.55 0.18 145);\n";
  css += "  --uni-sys-color-on-success: oklch(0.98 0 0);\n";
  css += "  --uni-sys-color-success-container: oklch(0.92 0.08 145);\n";
  css += "  --uni-sys-color-on-success-container: oklch(0.25 0.1 145);\n";
  css += "\n";
  css += "  --uni-sys-color-warning: oklch(0.62 0.16 85);\n";
  css += "  --uni-sys-color-on-warning: oklch(0.98 0 0);\n";
  css += "  --uni-sys-color-warning-container: oklch(0.92 0.08 85);\n";
  css += "  --uni-sys-color-on-warning-container: oklch(0.25 0.1 85);\n";
  css += "\n";
  css += "  --uni-sys-color-info: oklch(0.58 0.16 245);\n";
  css += "  --uni-sys-color-on-info: oklch(0.98 0 0);\n";
  css += "  --uni-sys-color-info-container: oklch(0.92 0.08 245);\n";
  css += "  --uni-sys-color-on-info-container: oklch(0.25 0.08 245);\n";
  css += "\n";
  css += "  --uni-sys-color-inverse-surface: var(--uni-ref-neutral-20);\n";
  css += "  --uni-sys-color-inverse-on-surface: var(--uni-ref-neutral-95);\n";
  css += "  --uni-sys-color-inverse-primary: var(--uni-ref-primary-80);\n";
  css += "  --uni-sys-color-scrim: rgba(0, 0, 0, 0.32);\n";
  css += "\n";

  // Typography tokens
  css += "  /* Typography tokens */\n";
  const fontSans =
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  css += `  --uni-ref-font-sans: ${fontSans};\n`;

  // Type scale
  const typeScale = {
    "display-large": {
      size: "3.5rem",
      line: "4rem",
      weight: "400",
      tracking: "-0.015em",
    },
    "display-medium": {
      size: "2.8125rem",
      line: "3.25rem",
      weight: "400",
      tracking: "-0.005em",
    },
    "display-small": {
      size: "2.25rem",
      line: "2.75rem",
      weight: "400",
      tracking: "0",
    },
    "headline-large": {
      size: "2rem",
      line: "2.5rem",
      weight: "400",
      tracking: "0",
    },
    "headline-medium": {
      size: "1.75rem",
      line: "2.25rem",
      weight: "400",
      tracking: "0",
    },
    "headline-small": {
      size: "1.5rem",
      line: "2rem",
      weight: "400",
      tracking: "0",
    },
    "title-large": {
      size: "1.375rem",
      line: "1.75rem",
      weight: "400",
      tracking: "0",
    },
    "title-medium": {
      size: "1rem",
      line: "1.5rem",
      weight: "600",
      tracking: "0.01em",
    },
    "title-small": {
      size: "0.875rem",
      line: "1.25rem",
      weight: "600",
      tracking: "0.005em",
    },
    "body-large": {
      size: "1rem",
      line: "1.5rem",
      weight: "400",
      tracking: "0.01em",
    },
    "body-medium": {
      size: "0.875rem",
      line: "1.25rem",
      weight: "400",
      tracking: "0.01em",
    },
    "body-small": {
      size: "0.75rem",
      line: "1rem",
      weight: "400",
      tracking: "0.01em",
    },
    "label-large": {
      size: "0.875rem",
      line: "1.25rem",
      weight: "500",
      tracking: "0.01em",
    },
    "label-medium": {
      size: "0.75rem",
      line: "1rem",
      weight: "500",
      tracking: "0.01em",
    },
    "label-small": {
      size: "0.6875rem",
      line: "1rem",
      weight: "500",
      tracking: "0.01em",
    },
  };

  for (const [name, props] of Object.entries(typeScale)) {
    css += `  --uni-sys-type-${name}-font: var(--uni-ref-font-sans);\n`;
    css += `  --uni-sys-type-${name}-weight: ${props.weight};\n`;
    css += `  --uni-sys-type-${name}-size: ${props.size};\n`;
    css += `  --uni-sys-type-${name}-line: ${props.line};\n`;
    css += `  --uni-sys-type-${name}-tracking: ${props.tracking};\n`;
  }
  css += "\n";

  // Shape tokens
  css += "  /* Shape tokens */\n";
  css += "  --uni-sys-shape-corner-none: 0px;\n";
  css +=
    "  --uni-sys-shape-corner-extra-small: calc(4px * var(--uni-sys-radius-scale));\n";
  css +=
    "  --uni-sys-shape-corner-small: calc(8px * var(--uni-sys-radius-scale));\n";
  css +=
    "  --uni-sys-shape-corner-medium: calc(12px * var(--uni-sys-radius-scale));\n";
  css +=
    "  --uni-sys-shape-corner-large: calc(20px * var(--uni-sys-radius-scale));\n";
  css +=
    "  --uni-sys-shape-corner-extra-large: calc(32px * var(--uni-sys-radius-scale));\n";
  css +=
    "  --uni-sys-shape-corner-extra-extra-large: calc(48px * var(--uni-sys-radius-scale));\n";
  css += "  --uni-sys-shape-corner-full: 9999px;\n";
  css += "\n";

  // Elevation tokens
  css += "  /* Elevation tokens */\n";
  css += "  --uni-sys-elevation-0: none;\n";
  css +=
    "  --uni-sys-elevation-1: 0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30);\n";
  css +=
    "  --uni-sys-elevation-2: 0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30);\n";
  css +=
    "  --uni-sys-elevation-3: 0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.30);\n";
  css +=
    "  --uni-sys-elevation-4: 0px 6px 10px 4px rgba(0, 0, 0, 0.15), 0px 2px 3px 0px rgba(0, 0, 0, 0.30);\n";
  css +=
    "  --uni-sys-elevation-5: 0px 8px 12px 6px rgba(0, 0, 0, 0.15), 0px 4px 4px 0px rgba(0, 0, 0, 0.30);\n";
  css += "\n";

  // Motion tokens
  css += "  /* Motion tokens */\n";
  css += "  --uni-sys-motion-duration-short-1: 50ms;\n";
  css += "  --uni-sys-motion-duration-short-2: 100ms;\n";
  css += "  --uni-sys-motion-duration-snappy: 150ms;\n";
  css += "  --uni-sys-motion-duration-medium-1: 200ms;\n";
  css += "  --uni-sys-motion-duration-medium-2: 250ms;\n";
  css += "  --uni-sys-motion-duration-emphasized: 300ms;\n";
  css += "  --uni-sys-motion-duration-long-1: 400ms;\n";
  css += "  --uni-sys-motion-duration-long-2: 500ms;\n";
  css += "  --uni-sys-motion-ease-standard: cubic-bezier(0.2, 0, 0, 1);\n";
  css +=
    "  --uni-sys-motion-ease-standard-accelerate: cubic-bezier(0.3, 0, 1, 1);\n";
  css +=
    "  --uni-sys-motion-ease-standard-decelerate: cubic-bezier(0, 0, 0, 1);\n";
  css += "  --uni-sys-motion-ease-emphasized: cubic-bezier(0.2, 0, 0, 1);\n";
  css += "  --uni-sys-motion-ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);\n";
  css += "\n";

  // State layer tokens
  css += "  /* State layer tokens */\n";
  css += "  --uni-sys-state-hover-opacity: var(--uni-sys-opacity-hover);\n";
  css += "  --uni-sys-state-pressed-opacity: var(--uni-sys-opacity-pressed);\n";
  css += "  --uni-sys-state-focus-opacity: var(--uni-sys-opacity-focus);\n";
  css += "\n";

  // Opacity Scale (M3 & Industrial)
  css += "  /* Opacity Scale */\n";
  const opacities = {
    hover: "0.08",
    focus: "0.10",
    pressed: "0.10",
    dragged: "0.16",
    scrim: "0.32",
    disabled: "0.38",
    muted: "0.60",
    subtle: "0.04",
    "5": "0.05",
    "10": "0.10",
    "20": "0.20",
    "25": "0.25",
    "40": "0.40",
    "50": "0.50",
    "60": "0.60",
    "75": "0.75",
    "80": "0.80",
    "90": "0.90",
  };
  for (const [name, val] of Object.entries(opacities)) {
    css += `  --uni-sys-opacity-${name}: ${val};\n`;
  }
  css += "\n";

  // Icon Sizing (Fluid)
  css += "  /* Icon Sizing (Fluid) */\n";
  const iconSizes = { xs: 16, sm: 20, md: 24, lg: 32, xl: 48 };
  for (const [name, px] of Object.entries(iconSizes)) {
    css += `  --uni-sys-icon-size-${name}: calc(${px}px * var(--uni-sys-space-scale));\n`;
  }
  css += "\n";

  // NOTE: Scaling Knobs are now defined at the TOP of :root (before color roles)
  // This ensures all calc() expressions have access to the scale variables

  // Responsive Scaling Logic for "Standard" Density
  css += "  /* Responsive Scaling (Mobile) */\n";
  css += "  @media (max-width: 768px) {\n";
  css +=
    '    :root:not([data-density="compact"]):not([data-density="dense"]) {\n';
  css += "      /* 3.5px / 4px = 0.875 */\n";
  css += "      --uni-sys-space-scale: 0.875;\n";
  css += "      --uni-sys-type-scale: 0.875;\n";
  css += "    }\n";
  css += "  }\n";
  css += "\n";

  // Explicit Density Overrides
  css += "  /* Density Overrides */\n";
  css += '  :root[data-density="compact"] {\n';
  css += "    /* 3.5px / 4px = 0.875 */\n";
  css += "    --uni-sys-space-scale: 0.875;\n";
  css += "    --uni-sys-type-scale: 0.9;\n";
  css += "    --uni-sys-radius-scale: 0.8;\n";
  css += "  }\n";
  css += '  :root[data-density="dense"] {\n';
  css += "    /* 3px / 4px = 0.75 */\n";
  css += "    --uni-sys-space-scale: 0.75;\n";
  css += "    --uni-sys-type-scale: 0.85;\n";
  css += "    --uni-sys-radius-scale: 0.75;\n";
  css += "  }\n";
  css += '  :root[data-density="comfortable"] {\n';
  css += "    /* 4.4px / 4px = 1.1 */\n";
  css += "    --uni-sys-space-scale: 1.1;\n";
  css += "    --uni-sys-type-scale: 1.0;\n";
  css += "    --uni-sys-radius-scale: 1.0;\n";
  css += "  }\n";
  css += "\n";

  // Radius theme helpers
  css += "  /* Radius Theme Overrides */\n";
  css += '  :root[data-radius="sharp"] {\n';
  css += "    --uni-sys-radius-scale: 0.75;\n";
  css += "  }\n";
  css += '  :root[data-radius="standard"] {\n';
  css += "    --uni-sys-radius-scale: 0.85;\n";
  css += "  }\n";
  css += '  :root[data-radius="soft"] {\n';
  css += "    --uni-sys-radius-scale: 1.0;\n";
  css += "  }\n";
  css += "\n";

  // Spacing Units
  css += "  /* Spacing Units */\n";
  const units = [];
  for (let i = 1; i <= 32; i++) {
    units.push(i / 2);
  }
  units.push(20, 24, 28, 38);
  units.forEach((u) => {
    css += `  --uni-sys-space-${u.toString().replace(".", "_")}u: calc(var(--uni-sys-u) * ${u});\n`;
  });
  css += "\n";

  // Legacy Spacing (mapped to scale for compatibility)
  css += "  /* Legacy Spacing Mappings */\n";
  for (let i = 1; i <= 16; i++) {
    css += `  --uni-sys-space-${i}: calc(${i * 4}px * var(--uni-sys-space-scale));\n`;
  }
  css += "\n";

  // Typography Scaling (Stone Edition Fluid SSOT)
  css += "  /* Fluid Typography (15 M3 Roles) */\n";
  const m3Roles = {
    "display-large": 64,
    "display-medium": 48,
    "display-small": 40,
    "headline-large": 36,
    "headline-medium": 32,
    "headline-small": 28,
    "title-large": 22,
    "title-medium": 18,
    "title-small": 16,
    "body-large": 18,
    "body-medium": 16,
    "body-small": 14,
    "label-large": 16,
    "label-medium": 12,
    "label-small": 10,
  };

  for (const [name, px] of Object.entries(m3Roles)) {
    const line = Math.round(px * 1.25); // Standard line height ratio
    css += `  --uni-sys-type-${name}-size: calc(${px}px * var(--uni-sys-type-scale));\n`;
    css += `  --uni-sys-type-${name}-line: calc(${line}px * var(--uni-sys-type-scale));\n`;
  }
  css += "\n";
  css += "\n";

  // Layout tokens
  css += "  /* Layout tokens */\n";
  css +=
    "  --uni-sys-layout-margin: calc(16px * var(--uni-sys-space-scale));\n";
  css +=
    "  --uni-sys-layout-gutter: calc(16px * var(--uni-sys-space-scale));\n";
  css +=
    "  --uni-sys-layout-pane-gap: calc(20px * var(--uni-sys-space-scale));\n";
  css +=
    "  --uni-sys-layout-pane-list-width: calc(360px * var(--uni-sys-space-scale));\n";
  css +=
    "  --uni-sys-layout-pane-fixed-width: calc(412px * var(--uni-sys-space-scale));\n";
  css +=
    "  --uni-sys-layout-pane-supporting-width: calc(400px * var(--uni-sys-space-scale));\n";
  css +=
    "  --uni-sys-layout-rail-collapsed-width: calc(72px * var(--uni-sys-space-scale));\n";
  css +=
    "  --uni-sys-layout-drawer-width: calc(360px * var(--uni-sys-space-scale));\n";
  css += "\n";
  css += "  /* Z-Index Scale */\n";
  css += "  --uni-sys-z-modal: 3000;\n";
  css += "  --uni-sys-z-popover: 2000;\n";
  css += "  --uni-sys-z-drawer: 1500;\n";
  css += "  --uni-sys-z-header: 1000;\n";
  css += "  --uni-sys-z-fab: 500;\n";

  css += "}\n";
  css += "\n";

  // Dark mode
  css += "/* Dark mode */\n";
  css += ".dark {\n";
  css += "  --uni-sys-color-primary: var(--uni-ref-primary-80);\n";
  css += "  --uni-sys-color-on-primary: var(--uni-ref-primary-20);\n";
  css += "  --uni-sys-color-primary-container: var(--uni-ref-primary-30);\n";
  css += "  --uni-sys-color-on-primary-container: var(--uni-ref-primary-90);\n";
  css += "\n";
  css += "  --uni-sys-color-secondary: var(--uni-ref-secondary-80);\n";
  css += "  --uni-sys-color-on-secondary: var(--uni-ref-secondary-20);\n";
  css +=
    "  --uni-sys-color-secondary-container: var(--uni-ref-secondary-30);\n";
  css +=
    "  --uni-sys-color-on-secondary-container: var(--uni-ref-secondary-90);\n";
  css += "\n";
  css += "  --uni-sys-color-tertiary: var(--uni-ref-tertiary-80);\n";
  css += "  --uni-sys-color-on-tertiary: var(--uni-ref-tertiary-20);\n";
  css += "  --uni-sys-color-tertiary-container: var(--uni-ref-tertiary-30);\n";
  css +=
    "  --uni-sys-color-on-tertiary-container: var(--uni-ref-tertiary-90);\n";
  css += "\n";
  css += "  --uni-sys-color-surface: var(--uni-ref-neutral-10);\n";
  css += "  --uni-sys-color-on-surface: var(--uni-ref-neutral-90);\n";
  css +=
    "  --uni-sys-color-surface-container-lowest: var(--uni-ref-neutral-10);\n";
  css +=
    "  --uni-sys-color-surface-container-low: var(--uni-ref-neutral-20);\n";
  css += "  --uni-sys-color-surface-container: var(--uni-ref-neutral-30);\n";
  css +=
    "  --uni-sys-color-surface-container-high: var(--uni-ref-neutral-40);\n";
  css +=
    "  --uni-sys-color-surface-container-highest: var(--uni-ref-neutral-50);\n";
  css += "\n";
  css +=
    "  --uni-sys-color-surface-variant: var(--uni-ref-neutral-variant-30);\n";
  css +=
    "  --uni-sys-color-on-surface-variant: var(--uni-ref-neutral-variant-80);\n";
  css += "  --uni-sys-color-background: var(--uni-ref-neutral-10);\n";
  css += "  --uni-sys-color-on-background: var(--uni-ref-neutral-90);\n";
  css +=
    "  --uni-sys-color-outline: var(--uni-ref-neutral-variant-60);\n  --uni-sys-color-outline-variant: var(--uni-ref-neutral-variant-30);\n\n  --uni-sys-color-error: var(--uni-ref-error-80);\n  --uni-sys-color-on-error: var(--uni-ref-error-20);\n  --uni-sys-color-error-container: var(--uni-ref-error-30);\n  --uni-sys-color-on-error-container: var(--uni-ref-error-90);\n\n  --uni-sys-color-success: oklch(0.8 0.18 145);\n  --uni-sys-color-on-success: oklch(0.2 0.1 145);\n  --uni-sys-color-success-container: oklch(0.3 0.1 145);\n  --uni-sys-color-on-success-container: oklch(0.9 0.1 145);\n\n  --uni-sys-color-warning: oklch(0.85 0.15 85);\n  --uni-sys-color-on-warning: oklch(0.2 0.1 85);\n  --uni-sys-color-warning-container: oklch(0.3 0.1 85);\n  --uni-sys-color-on-warning-container: oklch(0.9 0.1 85);\n\n  --uni-sys-color-info: oklch(0.8 0.18 245);\n  --uni-sys-color-on-info: oklch(0.2 0.1 245);\n  --uni-sys-color-info-container: oklch(0.3 0.1 245);\n  --uni-sys-color-on-info-container: oklch(0.9 0.1 245);\n\n  --uni-sys-color-inverse-surface: var(--uni-ref-neutral-90);\n  --uni-sys-color-inverse-on-surface: var(--uni-ref-neutral-20);\n  --uni-sys-color-inverse-primary: var(--uni-ref-primary-40);\n\n  --uni-sys-color-scrim: rgba(0, 0, 0, 0.32);\n}\n";

  return css;
}

// Generate uni-theme.css
function generateUniTheme() {
  let css = "/* Unisane UI Theme - Tailwind v4 Mapping */\n\n";
  css += "@theme inline {\n";

  // Color mapping
  css += "  /* Colors */\n";
  css += "  --color-primary: var(--uni-sys-color-primary);\n";
  css += "  --color-on-primary: var(--uni-sys-color-on-primary);\n";
  css +=
    "  --color-primary-container: var(--uni-sys-color-primary-container);\n";
  css +=
    "  --color-on-primary-container: var(--uni-sys-color-on-primary-container);\n";
  css += "  --color-secondary: var(--uni-sys-color-secondary);\n";
  css += "  --color-on-secondary: var(--uni-sys-color-on-secondary);\n";
  css +=
    "  --color-secondary-container: var(--uni-sys-color-secondary-container);\n";
  css +=
    "  --color-on-secondary-container: var(--uni-sys-color-on-secondary-container);\n";
  css += "  --color-tertiary: var(--uni-sys-color-tertiary);\n";
  css += "  --color-on-tertiary: var(--uni-sys-color-on-tertiary);\n";
  css +=
    "  --color-tertiary-container: var(--uni-sys-color-tertiary-container);\n";
  css +=
    "  --color-on-tertiary-container: var(--uni-sys-color-on-tertiary-container);\n";
  css += "  --color-surface: var(--uni-sys-color-surface);\n";
  css += "  --color-on-surface: var(--uni-sys-color-on-surface);\n";
  css +=
    "  --color-surface-container-low: var(--uni-sys-color-surface-container-low);\n";
  css +=
    "  --color-surface-container: var(--uni-sys-color-surface-container);\n";
  css +=
    "  --color-surface-container-high: var(--uni-sys-color-surface-container-high);\n";
  css +=
    "  --color-surface-container-highest: var(--uni-sys-color-surface-container-highest);\n";
  css +=
    "  --color-surface-container-lowest: var(--uni-sys-color-surface-container-lowest);\n";
  css += "  --color-surface-variant: var(--uni-sys-color-surface-variant);\n";
  css +=
    "  --color-on-surface-variant: var(--uni-sys-color-on-surface-variant);\n";
  css += "  --color-background: var(--uni-sys-color-background);\n";
  css += "  --color-on-background: var(--uni-sys-color-on-background);\n";
  css += "  --color-outline: var(--uni-sys-color-outline);\n";
  css += "  --color-outline-variant: var(--uni-sys-color-outline-variant);\n";
  css += "  --color-error: var(--uni-sys-color-error);\n";
  css += "  --color-on-error: var(--uni-sys-color-on-error);\n";
  css += "  --color-error-container: var(--uni-sys-color-error-container);\n";
  css +=
    "  --color-on-error-container: var(--uni-sys-color-on-error-container);\n";
  css += "  --color-success: var(--uni-sys-color-success);\n";
  css += "  --color-on-success: var(--uni-sys-color-on-success);\n";
  css +=
    "  --color-success-container: var(--uni-sys-color-success-container);\n";
  css +=
    "  --color-on-success-container: var(--uni-sys-color-on-success-container);\n";
  css += "  --color-warning: var(--uni-sys-color-warning);\n";
  css += "  --color-on-warning: var(--uni-sys-color-on-warning);\n";
  css +=
    "  --color-warning-container: var(--uni-sys-color-warning-container);\n";
  css +=
    "  --color-on-warning-container: var(--uni-sys-color-on-warning-container);\n";
  css += "  --color-info: var(--uni-sys-color-info);\n";
  css += "  --color-on-info: var(--uni-sys-color-on-info);\n";
  css += "  --color-info-container: var(--uni-sys-color-info-container);\n";
  css +=
    "  --color-on-info-container: var(--uni-sys-color-on-info-container);\n";
  css += "  --color-inverse-surface: var(--uni-sys-color-inverse-surface);\n";
  css +=
    "  --color-inverse-on-surface: var(--uni-sys-color-inverse-on-surface);\n";
  css += "  --color-inverse-primary: var(--uni-sys-color-inverse-primary);\n";
  css += "  --color-scrim: var(--uni-sys-color-scrim);\n";
  css += "\n";

  // Motion mapping
  css += "  /* Motion */\n";
  css += "  --animate-short: var(--uni-sys-motion-duration-short-2);\n";
  css += "  --animate-medium: var(--uni-sys-motion-duration-medium-2);\n";
  css += "  --animate-long: var(--uni-sys-motion-duration-long-2);\n";
  css += "  --ease-standard: var(--uni-sys-motion-ease-standard);\n";
  css += "  --ease-emphasized: var(--uni-sys-motion-ease-emphasized);\n";
  css += "\n";

  // Icon mapping
  css += "  /* Icons */\n";
  const names = ["xs", "sm", "md", "lg", "xl"];
  for (const n of names) {
    css += `  --size-icon-${n}: var(--uni-sys-icon-size-${n});\n`;
  }
  css += "\n";

  css += "  /* Typography */\n";
  const typeScaleNames = [
    "display-large",
    "display-medium",
    "display-small",
    "headline-large",
    "headline-medium",
    "headline-small",
    "title-large",
    "title-medium",
    "title-small",
    "body-large",
    "body-medium",
    "body-small",
    "label-large",
    "label-medium",
    "label-small",
  ];
  for (const name of typeScaleNames) {
    css += `  --font-size-${name}: var(--uni-sys-type-${name}-size);\n`;
    css += `  --line-height-${name}: var(--uni-sys-type-${name}-line);\n`;
    css += `  --font-weight-${name}: var(--uni-sys-type-${name}-weight);\n`;
    css += `  --letter-spacing-${name}: var(--uni-sys-type-${name}-tracking);\n`;
  }
  css += "\n";

  // Radius mapping
  css += "  /* Radii */\n";
  css += "  --radius-xs: var(--uni-sys-shape-corner-extra-small);\n";
  css += "  --radius-sm: var(--uni-sys-shape-corner-small);\n";
  css += "  --radius-md: var(--uni-sys-shape-corner-medium);\n";
  css += "  --radius-lg: var(--uni-sys-shape-corner-large);\n";
  css += "  --radius-xl: var(--uni-sys-shape-corner-extra-large);\n";
  css += "  --radius-2xl: var(--uni-sys-shape-corner-extra-extra-large);\n";
  css += "\n";

  // Shadow mapping
  css += "  /* Shadows */\n";
  css += "  --shadow-0: var(--uni-sys-elevation-0);\n";
  css += "  --shadow-1: var(--uni-sys-elevation-1);\n";
  css += "  --shadow-2: var(--uni-sys-elevation-2);\n";
  css += "  --shadow-3: var(--uni-sys-elevation-3);\n";
  css += "  --shadow-4: var(--uni-sys-elevation-4);\n";
  css += "  --shadow-5: var(--uni-sys-elevation-5);\n";
  css += "\n";

  // Spacing mapping
  css += "  /* Spacing */\n";
  for (let i = 1; i <= 16; i++) {
    css += `  --spacing-${i}: var(--uni-sys-space-${i});\n`;
  }
  // Industrial Units
  const units = [0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16];
  units.forEach((u) => {
    css += `  --spacing-${u.toString().replace(".", "_")}u: var(--uni-sys-space-${u.toString().replace(".", "_")}u);\n`;
  });

  // Layout specific
  css += "  --spacing-layout-margin: var(--uni-sys-layout-margin);\n";
  css += "  --spacing-layout-gutter: var(--uni-sys-layout-gutter);\n";
  css += "  --width-pane-list: var(--uni-sys-layout-pane-list-width);\n";
  css += "  --width-pane-fixed: var(--uni-sys-layout-pane-fixed-width);\n";
  css +=
    "  --width-pane-supporting: var(--uni-sys-layout-pane-supporting-width);\n";
  css +=
    "  --width-rail-collapsed: var(--uni-sys-layout-rail-collapsed-width);\n";
  css += "  --width-drawer: var(--uni-sys-layout-drawer-width);\n";
  css += "\n";

  css += "}\n";

  return css;
}

// Build function
function build() {
  console.log("Building Unisane tokens...");

  // Generate and write uni-tokens.css
  const uniTokensCss = generateUniTokens();
  writeFileSync(join(distDir, "uni-tokens.css"), uniTokensCss);
  console.log("✓ Generated uni-tokens.css");

  // Generate and write uni-theme.css
  const uniThemeCss = generateUniTheme();
  writeFileSync(join(distDir, "uni-theme.css"), uniThemeCss);
  console.log("✓ Generated uni-theme.css");

  console.log("Token build complete!");
}

// Run build
build();

// Watch mode
if (process.argv.includes("--watch")) {
  console.log("Watching for changes...");
  const chokidar = await import("chokidar");
  const watcher = chokidar.watch(join(srcDir, "**/*.json"));

  watcher.on("change", (path) => {
    console.log(`File changed: ${path}`);
    build();
  });
}
