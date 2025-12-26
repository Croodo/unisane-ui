/**
 * Material Design 3 State Layer Utilities
 * Provides consistent interactive states across all components
 */

export const stateLayers = {
  // Base state layers (apply to surface color)
  hover: "hover:bg-on-surface/8",
  focus: "focus:bg-on-surface/12",
  pressed: "active:bg-on-surface/12",
  dragged: "data-[dragged=true]:bg-on-surface/16",

  // Disabled state
  disabled: "disabled:opacity-38 disabled:cursor-not-allowed disabled:pointer-events-none",

  // Primary variant state layers
  primary: {
    hover: "hover:bg-primary/8",
    focus: "focus:bg-primary/12",
    pressed: "active:bg-primary/12",
  },

  // Secondary variant state layers
  secondary: {
    hover: "hover:bg-secondary/8",
    focus: "focus:bg-secondary/12",
    pressed: "active:bg-secondary/12",
  },

  // Tertiary variant state layers
  tertiary: {
    hover: "hover:bg-tertiary/8",
    focus: "focus:bg-tertiary/12",
    pressed: "active:bg-tertiary/12",
  },

  // Error variant state layers
  error: {
    hover: "hover:bg-error/8",
    focus: "focus:bg-error/12",
    pressed: "active:bg-error/12",
  },
} as const;

/**
 * Get state layer classes for a specific variant
 */
export function getStateLayer(variant?: "default" | "primary" | "secondary" | "tertiary" | "error") {
  if (!variant || variant === "default") {
    return `${stateLayers.hover} ${stateLayers.focus} ${stateLayers.pressed}`;
  }

  const layer = stateLayers[variant];
  return `${layer.hover} ${layer.focus} ${layer.pressed}`;
}

/**
 * Hook for state layer classes
 */
export function useStateLayer(variant?: "default" | "primary" | "secondary" | "tertiary" | "error", disabled = false) {
  const stateClasses = getStateLayer(variant);
  const disabledClass = disabled ? stateLayers.disabled : "";

  return `${stateClasses} ${disabledClass}`;
}