import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const stateLayerVariants = cva(
  "absolute inset-0 pointer-events-none transition-opacity duration-200 ease-standard opacity-0 z-0",
  {
    variants: {
      color: {
        primary: "bg-primary group-hover:opacity-[0.08] group-active:opacity-[0.12]",
        onPrimary: "bg-on-primary group-hover:opacity-[0.08] group-active:opacity-[0.12]",
        secondary: "bg-secondary group-hover:opacity-[0.08] group-active:opacity-[0.12]",
        onSecondary: "bg-on-secondary-container group-hover:opacity-[0.08] group-active:opacity-[0.12]",
        surface: "bg-on-surface group-hover:opacity-[0.08] group-active:opacity-[0.12]",
        error: "bg-error group-hover:opacity-[0.08] group-active:opacity-[0.12]",
      },
      for: {
        button: "",
        icon: "rounded-full",
        card: "",
        item: "",
      }
    },
    defaultVariants: {
      color: "surface",
    },
  }
);

export type StateLayerProps = VariantProps<typeof stateLayerVariants> & {
  className?: string;
};

export const StateLayer: React.FC<StateLayerProps> = ({ color, className, ...props }) => {
  return <div className={cn(stateLayerVariants({ color, ...props }), className)} aria-hidden="true" />;
};