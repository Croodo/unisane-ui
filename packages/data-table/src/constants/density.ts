// ─── DENSITY CONSTANTS ───────────────────────────────────────────────────────
// Configuration for different density levels including styles and dimensions.

import { DensityLevel, type DensityLevelValue } from "./enums";

/**
 * Padding classes for different density levels.
 * Uses standard Tailwind spacing which scales automatically with global theme density
 * via CSS custom properties (--scale-space).
 *
 * When data-density="compact" is set on <html>, spacing tokens scale to 87.5%
 * When data-density="comfortable" is set on <html>, spacing tokens scale to 110%
 *
 * The component-level density prop provides additional fine-tuning on top of global density.
 */
export const DENSITY_STYLES: Record<DensityLevelValue, string> = {
  [DensityLevel.COMPACT]: "py-1.5 px-3",
  [DensityLevel.DENSE]: "py-2 px-3",
  [DensityLevel.STANDARD]: "py-3 px-4",
  [DensityLevel.COMFORTABLE]: "py-4 px-4",
};

/**
 * Configuration for each density level including base row heights.
 * These values represent the base height at standard density (--scale-space: 1).
 *
 * In components, these should be multiplied by the density scale factor
 * or used as CSS calc() with var(--scale-space) for dynamic scaling.
 */
export const DENSITY_CONFIG: Record<DensityLevelValue, { rowHeight: number; label: string }> = {
  [DensityLevel.COMPACT]: { rowHeight: 36, label: "Compact" },
  [DensityLevel.DENSE]: { rowHeight: 44, label: "Dense" },
  [DensityLevel.STANDARD]: { rowHeight: 52, label: "Standard" },
  [DensityLevel.COMFORTABLE]: { rowHeight: 64, label: "Comfortable" },
};

/**
 * CSS variable-based row height for use in inline styles.
 * This allows row heights to scale with global theme density.
 *
 * Usage: style={{ height: `calc(${ROW_HEIGHT_BASE[density]} * var(--scale-space, 1))` }}
 */
export const ROW_HEIGHT_BASE: Record<DensityLevelValue, string> = {
  [DensityLevel.COMPACT]: "36px",
  [DensityLevel.DENSE]: "44px",
  [DensityLevel.STANDARD]: "52px",
  [DensityLevel.COMFORTABLE]: "64px",
};

/**
 * Default density level
 */
export const DEFAULT_DENSITY = DensityLevel.STANDARD;
