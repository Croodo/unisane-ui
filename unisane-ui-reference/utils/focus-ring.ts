/**
 * Material Design 3 Focus Ring System
 * Provides consistent focus indicators for keyboard navigation
 */

export const focusRing = {
  // Default focus ring (outline style)
  default: "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",

  // Inner focus ring (for buttons with background)
  inner: "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",

  // No offset (for compact elements)
  compact: "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-0",

  // Custom colors
  primary: "focus-visible:outline-primary",
  secondary: "focus-visible:outline-secondary",
  error: "focus-visible:outline-error",

  // Focus within (for container elements)
  within: "focus-within:outline focus-within:outline-2 focus-within:outline-primary",
} as const;

/**
 * Get focus ring classes
 */
export function getFocusRing(variant: keyof typeof focusRing = "default") {
  return focusRing[variant];
}

/**
 * Hook for focus ring with state
 */
export function useFocusRing(options: {
  variant?: keyof typeof focusRing;
  visible?: boolean;
} = {}) {
  const { variant = "default", visible = true } = options;

  return visible ? getFocusRing(variant) : "focus-visible:outline-none";
}