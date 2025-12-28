import React, { forwardRef, cloneElement, isValidElement } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, Slot } from "@/lib/utils";
import { Ripple } from "./ripple";

const navigationDrawerVariants = cva(
  "flex flex-col h-full bg-surface-container border-r border-outline-variant/30 transition-transform duration-emphasized ease-emphasized overflow-y-auto",
  {
    variants: {
      modal: {
        true: "fixed inset-y-0 left-0 z-[60] shadow-3 rounded-e-[2rem] w-[300px] max-w-[85vw] border-none",
        false: "fixed inset-y-0 left-0 z-[30] w-[300px] rounded-e-none border-r-0",
      },
      open: {
        true: "translate-x-0 visible",
        false: "-translate-x-full invisible",
      },
    },
    defaultVariants: {
      modal: false,
      open: true,
    },
  }
);

interface DrawerProps extends VariantProps<typeof navigationDrawerVariants> {
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const NavigationDrawer = forwardRef<HTMLElement, DrawerProps>(
  (
    {
      open = true,
      onClose,
      children,
      className,
      modal = false,
      style,
      onMouseEnter,
      onMouseLeave,
    },
    ref
  ) => {
    return (
      <aside
        ref={ref}
        className={cn(navigationDrawerVariants({ modal, open }), className)}
        style={style}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onFocus={onMouseEnter}
      >
        {children}
      </aside>
    );
  }
);

NavigationDrawer.displayName = "NavigationDrawer";

// NavigationDrawerItem
const navigationDrawerItemVariants = cva(
  "flex items-center gap-3 w-full min-h-14 py-4 px-5 rounded-xl text-label-large cursor-pointer select-none group relative overflow-hidden shrink-0 outline-none transition-all duration-short mx-auto focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
  {
    variants: {
      active: {
        true: "bg-secondary-container text-primary font-semibold",
        false: "bg-transparent text-on-surface-variant hover:bg-on-surface-variant/8 font-medium",
      },
      disabled: {
        true: "opacity-38 cursor-not-allowed",
        false: "",
      },
    },
    defaultVariants: {
      active: false,
      disabled: false,
    },
  }
);

interface NavigationDrawerItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "disabled"> {
  active?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode | string;
  badge?: string | number | React.ReactNode;
  activeIcon?: React.ReactNode | string;
  href?: string;
  asChild?: boolean;
}

export const NavigationDrawerItem = forwardRef<
  HTMLButtonElement,
  NavigationDrawerItemProps
>(({ active, icon, activeIcon, badge, children, disabled, className, href, asChild, ...props }, ref) => {
  const renderIcon = (iconValue: React.ReactNode | string) => {
    if (typeof iconValue === "string") {
      return (
        <span
          className={cn(
            "material-symbols-outlined text-[24px]! transition-colors",
            active ? "text-primary" : "text-on-surface-variant"
          )}
          style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          {iconValue}
        </span>
      );
    }
    return iconValue;
  };

  const innerContent = (
    <>
      {/* State Layer for active items */}
      <span
        className={cn(
          "absolute inset-0 pointer-events-none transition-opacity duration-short",
          active
            ? "bg-primary opacity-0 group-hover:opacity-[0.08] group-focus-visible:opacity-[0.12] group-active:opacity-[0.12]"
            : ""
        )}
      />
      <Ripple disabled={disabled ?? false} />

      {icon && (
        <span className="relative z-10">
          {active && activeIcon ? renderIcon(activeIcon) : renderIcon(icon)}
        </span>
      )}

      <span className="flex-1 text-left relative z-10 truncate">{children}</span>

      {badge && (
        <span className="relative z-10 ml-auto">
          {typeof badge === "string" || typeof badge === "number" ? (
            <span className="text-label-small font-medium text-on-surface-variant px-1_5 py-0_5 min-w-5 text-center inline-block">
              {badge}
            </span>
          ) : (
            badge
          )}
        </span>
      )}
    </>
  );

  const itemClasses = cn(navigationDrawerItemVariants({ active, disabled }), className);

  // asChild pattern: render user's Link component with merged props
  if (asChild && isValidElement(children)) {
    return (
      <div className="px-4 w-full">
        <Slot className={itemClasses} {...props}>
          {cloneElement(children as React.ReactElement, {}, innerContent)}
        </Slot>
      </div>
    );
  }

  if (href && !disabled) {
    return (
      <div className="px-4 w-full">
        <a
          href={href}
          className={itemClasses}
          aria-current={active ? "page" : undefined}
        >
          {innerContent}
        </a>
      </div>
    );
  }

  return (
    <div className="px-4 w-full">
      <button
        ref={ref}
        disabled={disabled ?? false}
        className={itemClasses}
        {...props}
      >
        {innerContent}
      </button>
    </div>
  );
});

NavigationDrawerItem.displayName = "NavigationDrawerItem";

// NavigationDrawerHeadline
export const NavigationDrawerHeadline = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "px-5 pt-4 pb-2 text-title-small font-semibold text-on-surface-variant",
      className
    )}
  >
    {children}
  </div>
);

// NavigationDrawerDivider
export const NavigationDrawerDivider = ({ className }: { className?: string }) => (
  <div className={cn("h-px bg-outline-variant/30 my-2 mx-4", className)} />
);
