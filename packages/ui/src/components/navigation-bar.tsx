import React, { isValidElement, cloneElement } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, Slot } from "@ui/lib/utils";
import { Ripple } from "./ripple";

const navigationBarVariants = cva(
  "absolute bottom-0 left-0 right-0 h-20 bg-surface-container border-t border-outline-variant flex items-center justify-around px-4 pb-4 z-30",
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

export interface NavigationBarProps extends VariantProps<typeof navigationBarVariants> {
  children: React.ReactNode;
  className?: string;
}

const NavigationBarRoot: React.FC<NavigationBarProps> = ({
  variant,
  children,
  className,
}) => {
  return (
    <nav className={cn(navigationBarVariants({ variant, className }))}>
      {children}
    </nav>
  );
};

export interface NavigationBarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  href?: string;
  asChild?: boolean;
  children?: React.ReactNode;
}

const NavigationBarItem: React.FC<NavigationBarItemProps> = ({
  icon,
  label,
  active,
  onClick,
  className,
  href,
  asChild,
  children,
}) => {
  const itemClasses = cn(
    "relative flex flex-col items-center justify-center gap-1 h-full min-w-16u px-2 cursor-pointer select-none group focus-visible:outline-none",
    className
  );

  const innerContent = (
    <>
      <div className="relative h-8 w-16 mb-1">
        <div
          className={cn(
            "absolute inset-0 rounded-sm transition-all duration-medium ease-standard overflow-hidden",
            active ? "bg-secondary-container scale-x-100 opacity-100" : "bg-transparent scale-x-50 opacity-0 group-hover:bg-on-surface/8"
          )}
        >
          <Ripple center />
        </div>
        <div
          className={cn(
            "relative h-full w-full flex items-center justify-center z-10 transition-colors",
            active ? "text-on-secondary-container" : "text-on-surface-variant group-hover:text-on-surface"
          )}
        >
          {icon}
        </div>
      </div>
      <span
        className={cn(
          "text-label-medium transition-colors font-medium",
          active ? "text-on-surface" : "text-on-surface-variant group-hover:text-on-surface"
        )}
      >
        {label}
      </span>
    </>
  );

  // asChild pattern: render user's Link component
  if (asChild && children && isValidElement(children)) {
    return (
      <Slot className={itemClasses} aria-pressed={active}>
        {cloneElement(children as React.ReactElement, {}, innerContent)}
      </Slot>
    );
  }

  if (href) {
    return (
      <a href={href} className={itemClasses} aria-current={active ? "page" : undefined}>
        {innerContent}
      </a>
    );
  }

  return (
    <button className={itemClasses} onClick={onClick} aria-pressed={active}>
      {innerContent}
    </button>
  );
};

export const NavigationBar = Object.assign(NavigationBarRoot, {
  Item: NavigationBarItem,
});
