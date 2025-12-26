/**
 * Material Design 3 Animation Utilities
 * Provides consistent animations across all components
 */

export const animations = {
  // Entrance animations
  fadeIn: "animate-in fade-in duration-short",
  fadeInUp: "animate-in fade-in slide-in-from-bottom-4 duration-short",
  fadeInDown: "animate-in fade-in slide-in-from-top-4 duration-short",
  slideInFromBottom: "animate-in slide-in-from-bottom duration-emphasized",
  slideInFromTop: "animate-in slide-in-from-top duration-emphasized",
  slideInFromLeft: "animate-in slide-in-from-left duration-emphasized",
  slideInFromRight: "animate-in slide-in-from-right duration-emphasized",
  zoomIn: "animate-in zoom-in-95 duration-short",

  // Exit animations
  fadeOut: "animate-out fade-out duration-short",
  fadeOutDown: "animate-out fade-out slide-out-to-bottom-4 duration-short",
  fadeOutUp: "animate-out fade-out slide-out-to-top-4 duration-short",
  slideOutToBottom: "animate-out slide-out-to-bottom duration-emphasized",
  slideOutToTop: "animate-out slide-out-to-top duration-emphasized",
  slideOutToLeft: "animate-out slide-out-to-left duration-emphasized",
  slideOutToRight: "animate-out slide-out-to-right duration-emphasized",
  zoomOut: "animate-out zoom-out-95 duration-short",

  // Combined (entrance + exit)
  dialog: "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-short",
  dropdown: "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 duration-short",
  sheet: "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom duration-emphasized",

  // Loading animations
  spin: "animate-spin",
  pulse: "animate-pulse",
  bounce: "animate-bounce",

  // Transition classes
  transition: {
    all: "transition-all duration-short ease-standard",
    colors: "transition-colors duration-short ease-standard",
    transform: "transition-transform duration-short ease-standard",
    opacity: "transition-opacity duration-short ease-standard",
  },
} as const;

/**
 * Hook for animation classes with state management
 */
export function useAnimations(isOpen: boolean, type: "dialog" | "dropdown" | "sheet" | "fade" = "fade") {
  const animationMap = {
    dialog: animations.dialog,
    dropdown: animations.dropdown,
    sheet: animations.sheet,
    fade: isOpen ? animations.fadeIn : animations.fadeOut,
  };

  return animationMap[type];
}

/**
 * Get entrance animation
 */
export function getEntranceAnimation(type: keyof typeof animations = "fadeIn") {
  return animations[type] || animations.fadeIn;
}

/**
 * Get exit animation
 */
export function getExitAnimation(type: "fadeOut" | "slideOutToBottom" | "zoomOut" = "fadeOut") {
  return animations[type];
}