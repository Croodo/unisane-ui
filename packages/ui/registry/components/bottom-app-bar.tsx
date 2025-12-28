import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Surface } from "@/primitives/surface";
import { Ripple } from "./ripple";

const bottomAppBarVariants = cva(
  "fixed bottom-0 left-0 right-0 h-20 flex items-center justify-between px-4 z-20",
  {
    variants: {
      variant: {
        default: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type BottomAppBarProps = VariantProps<typeof bottomAppBarVariants> & {
  children: React.ReactNode;
  fab?: React.ReactNode;
  className?: string;
};

export const BottomAppBar: React.FC<BottomAppBarProps> = ({
  children,
  fab,
  className,
}) => {
  return (
    <Surface
      tone="surface"
      elevation={3}
      className={cn(bottomAppBarVariants({ className }))}
      role="toolbar"
      aria-label="Bottom navigation"
    >
      <div className="flex items-center gap-2 flex-1">{children}</div>

      {fab && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-8">{fab}</div>
      )}
    </Surface>
  );
};

const bottomAppBarActionVariants = cva(
  "relative flex items-center justify-center w-12 h-12 rounded-full cursor-pointer select-none transition-colors duration-short overflow-hidden",
  {
    variants: {
      active: {
        true: "text-primary",
        false: "text-on-surface-variant hover:text-primary",
      },
    },
    defaultVariants: {
      active: false,
    },
  }
);

export type BottomAppBarActionProps = VariantProps<
  typeof bottomAppBarActionVariants
> & {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
};

export const BottomAppBarAction: React.FC<BottomAppBarActionProps> = ({
  icon,
  label,
  active,
  onClick,
  className,
}) => {
  return (
    <button
      className={cn(bottomAppBarActionVariants({ active, className }))}
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
    >
      <Ripple />
      <div className="w-6 h-6 flex items-center justify-center relative z-10">{icon}</div>
    </button>
  );
};
