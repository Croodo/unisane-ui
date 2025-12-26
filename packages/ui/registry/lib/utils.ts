/**
 * Unisane UI Utilities
 *
 * Core utilities for class name handling and design token integration.
 * @module @unisane/ui/lib/utils
 */

import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Extended Tailwind Merge configuration for Material Design 3 tokens.
 * Handles conflicts between M3 typography, colors, and other custom utilities.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
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
          ],
        },
      ],
      "text-color": [
        {
          text: [
            "primary",
            "on-primary",
            "primary-container",
            "on-primary-container",
            "secondary",
            "on-secondary",
            "secondary-container",
            "on-secondary-container",
            "tertiary",
            "on-tertiary",
            "tertiary-container",
            "on-tertiary-container",
            "surface",
            "on-surface",
            "surface-variant",
            "on-surface-variant",
            "surface-container",
            "surface-container-high",
            "surface-container-highest",
            "surface-container-low",
            "surface-container-lowest",
            "background",
            "on-background",
            "outline",
            "outline-variant",
            "error",
            "on-error",
            "error-container",
            "on-error-container",
            "success",
            "on-success",
            "success-container",
            "on-success-container",
            "warning",
            "on-warning",
            "warning-container",
            "on-warning-container",
            "info",
            "on-info",
            "info-container",
            "on-info-container",
            "inverse-surface",
            "inverse-on-surface",
            "inverse-primary",
          ],
        },
      ],
    },
  },
});

/**
 * Combines class names with intelligent conflict resolution.
 *
 * Uses clsx for conditional classes and tailwind-merge for deduplication.
 * Properly handles M3 design tokens and custom utilities.
 *
 * @param inputs - Class values (strings, objects, arrays, undefined, null)
 * @returns Merged class string with conflicts resolved
 *
 * @example
 * ```tsx
 * cn("bg-primary", "text-on-primary", className)
 * cn("p-4u", isLarge && "p-6u")
 * cn({ "bg-error": hasError }, "rounded-md")
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Standard focus ring utility for keyboard navigation.
 * Applies a visible outline on focus-visible state.
 */
export const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/**
 * Inset focus ring for elements where the ring should be inside the bounds.
 * Used for inputs and other contained elements.
 */
export const focusRingInset =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary";

/**
 * State layer utility classes for hover and pressed states.
 * Following Material Design 3 state layer opacity specifications.
 *
 * @example
 * ```tsx
 * <button className={cn("bg-primary", stateLayer.onPrimary)}>
 *   Click me
 * </button>
 * ```
 */
export const stateLayer = {
  primary: "hover:bg-primary/[0.08] active:bg-primary/[0.12]",
  onPrimary: "hover:bg-on-primary/[0.08] active:bg-on-primary/[0.12]",
  secondary: "hover:bg-secondary/[0.08] active:bg-secondary/[0.12]",
  onSecondary: "hover:bg-on-secondary/[0.08] active:bg-on-secondary/[0.12]",
  surface: "hover:bg-on-surface/[0.08] active:bg-on-surface/[0.12]",
  surfaceVariant:
    "hover:bg-on-surface-variant/[0.08] active:bg-on-surface-variant/[0.12]",
  error: "hover:bg-error/[0.08] active:bg-error/[0.12]",
} as const;

/** Available state layer color keys */
export type StateLayerColor = keyof typeof stateLayer;

/**
 * Duration utility classes following M3 motion specifications.
 */
export const duration = {
  short: "duration-short",
  medium: "duration-medium",
  long: "duration-long",
} as const;

/**
 * Easing utility classes following M3 motion specifications.
 */
export const easing = {
  standard: "ease-standard",
  emphasized: "ease-emphasized",
  decelerate: "ease-decelerate",
  accelerate: "ease-accelerate",
} as const;

/**
 * Transition utility classes for common animation properties.
 */
export const transition = {
  fade: "transition-opacity",
  scale: "transition-transform",
  slide: "transition-transform",
  all: "transition-all",
  colors: "transition-colors",
} as const;

/**
 * Animation utility classes for pre-defined motion patterns.
 */
export const animation = {
  fadeIn: "animate-fade-in",
  slideUp: "animate-slide-up",
  contentEnter: "animate-content-enter",
  stagger: "animate-stagger",
  ripple: "animate-ripple",
} as const;
