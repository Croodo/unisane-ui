import React, { cloneElement, isValidElement } from "react";
import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

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

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export const focusRingInset =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary";

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

export type StateLayerColor = keyof typeof stateLayer;

export const duration = {
  short: "duration-short",
  medium: "duration-medium",
  long: "duration-long",
} as const;

export const easing = {
  standard: "ease-standard",
  emphasized: "ease-emphasized",
  decelerate: "ease-decelerate",
  accelerate: "ease-accelerate",
} as const;

export const transition = {
  fade: "transition-opacity",
  scale: "transition-transform",
  slide: "transition-transform",
  all: "transition-all",
  colors: "transition-colors",
} as const;

export const animation = {
  fadeIn: "animate-fade-in",
  slideUp: "animate-slide-up",
  contentEnter: "animate-content-enter",
  stagger: "animate-stagger",
  ripple: "animate-ripple",
} as const;

// Slot component for asChild pattern - merges props onto child element
export interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export function Slot({ children, ...props }: SlotProps) {
  if (isValidElement(children)) {
    const childProps = children.props as Record<string, unknown>;
    return cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      ...props,
      ...childProps,
      className: cn(props.className as string | undefined, childProps.className as string | undefined),
    });
  }
  return null;
}
