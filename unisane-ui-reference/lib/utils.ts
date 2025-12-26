import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Extend tailwind-merge to recognize Material Design 3 custom tokens
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      // Material Design 3 Typography Scale
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
      // Material Design 3 Semantic Colors
      "text-color": [
        {
          text: [
            "primary", "on-primary", "primary-container", "on-primary-container",
            "secondary", "on-secondary", "secondary-container", "on-secondary-container",
            "tertiary", "on-tertiary", "tertiary-container", "on-tertiary-container",
            "surface", "on-surface", "surface-variant", "on-surface-variant",
            "surface-container", "surface-container-high", "surface-container-highest",
            "surface-container-low", "surface-container-lowest",
            "background", "on-background",
            "outline", "outline-variant",
            "error", "on-error", "error-container", "on-error-container",
            "success", "on-success", "success-container", "on-success-container",
            "warning", "on-warning", "warning-container", "on-warning-container",
            "info", "on-info", "info-container", "on-info-container",
            "inverse-surface", "inverse-on-surface", "inverse-primary",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}