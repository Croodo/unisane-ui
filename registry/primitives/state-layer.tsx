import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@ui/lib/utils";

const stateLayerVariants = cva(
  "absolute inset-0 pointer-events-none transition-opacity duration-medium ease-standard opacity-0 z-0",
  {
    variants: {
      color: {
        primary:
          "bg-primary group-hover:opacity-hover group-active:opacity-pressed",
        onPrimary:
          "bg-on-primary group-hover:opacity-hover group-active:opacity-pressed",
        secondary:
          "bg-secondary group-hover:opacity-hover group-active:opacity-pressed",
        onSecondary:
          "bg-on-secondary-container group-hover:opacity-hover group-active:opacity-pressed",
        surface:
          "bg-on-surface group-hover:opacity-hover group-active:opacity-pressed",
        error:
          "bg-error group-hover:opacity-hover group-active:opacity-pressed",
      },
      for: {
        button: "",
        icon: "rounded-full",
        card: "",
        item: "",
      },
    },
    defaultVariants: {
      color: "surface",
    },
  }
);

export type StateLayerProps = VariantProps<typeof stateLayerVariants> & {
  className?: string;
};

export const StateLayer: React.FC<StateLayerProps> = ({
  color,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(stateLayerVariants({ color, ...props }), className)}
      aria-hidden="true"
    />
  );
};
