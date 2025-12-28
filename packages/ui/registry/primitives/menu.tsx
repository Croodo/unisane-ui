import React, { isValidElement, cloneElement } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, Slot } from "@/lib/utils";
import { Typography } from "../components/typography";
import { Ripple } from "../components/ripple";

const menuVariants = cva(
  "min-w-[calc(var(--unit)*50)] bg-surface shadow-2 border border-outline-variant/20 overflow-hidden",
  {
    variants: {
      rounded: {
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
        "2xl": "rounded-2xl",
      },
    },
    defaultVariants: {
      rounded: "sm",
    },
  }
);

export interface MenuProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof menuVariants> {
  open?: boolean;
  children: React.ReactNode;
}

export const Menu: React.FC<MenuProps> = ({
  open = true,
  rounded,
  className,
  children,
  ...props
}) => {
  if (!open) return null;

  return (
    <div
      className={cn(menuVariants({ rounded }), "py-2", className)}
      role="menu"
      {...props}
    >
      {children}
    </div>
  );
};

export interface MenuItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  disabled?: boolean;
  selected?: boolean;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  href?: string;
  asChild?: boolean;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  children,
  disabled = false,
  selected = false,
  icon,
  trailingIcon,
  className,
  href,
  asChild,
  ...props
}) => {
  const itemClasses = cn(
    "relative w-full text-left px-4 h-12 flex items-center gap-3 cursor-pointer select-none overflow-hidden",
    "text-on-surface transition-colors duration-short ease-standard",
    "hover:bg-on-surface/8 focus-visible:bg-on-surface/12 focus-visible:outline-none",
    disabled && "opacity-38 cursor-not-allowed hover:bg-transparent",
    selected && "bg-secondary-container text-on-secondary-container",
    className
  );

  const innerContent = (
    <>
      <Ripple disabled={disabled} />
      {icon && <div className="shrink-0 relative z-10 flex items-center justify-center w-5 h-5">{icon}</div>}
      <Typography variant="bodyLarge" className="flex-1 relative z-10 font-medium">
        {asChild ? null : children}
      </Typography>
      {trailingIcon && <div className="shrink-0 relative z-10 text-on-surface-variant flex items-center justify-center">{trailingIcon}</div>}
    </>
  );

  // asChild pattern: render user's Link component
  if (asChild && isValidElement(children)) {
    return (
      <Slot className={itemClasses} role="menuitem">
        {cloneElement(children as React.ReactElement, {}, innerContent)}
      </Slot>
    );
  }

  if (href && !disabled) {
    return (
      <a
        href={href}
        className={itemClasses}
        role="menuitem"
        aria-disabled={disabled}
        aria-selected={selected}
      >
        {innerContent}
      </a>
    );
  }

  return (
    <button
      className={itemClasses}
      role="menuitem"
      disabled={disabled}
      aria-disabled={disabled}
      aria-selected={selected}
      {...props}
    >
      {innerContent}
    </button>
  );
};

export interface MenuDividerProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export const MenuDivider: React.FC<MenuDividerProps> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn("h-px bg-outline-variant/40 my-1", className)}
      role="separator"
      {...props}
    />
  );
};

export interface MenuCheckboxItemProps extends Omit<MenuItemProps, "selected"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const MenuCheckboxItem: React.FC<MenuCheckboxItemProps> = ({
  checked = false,
  onCheckedChange,
  children,
  ...props
}) => {
  return (
    <MenuItem
      selected={checked}
      onClick={(e) => {
        onCheckedChange?.(!checked);
        props.onClick?.(e);
      }}
      icon={
        <div
          className={cn(
            "w-5 h-5 rounded-xs border-2 border-current",
            checked && "bg-primary border-primary text-on-primary"
          )}
        >
          {checked && (
            <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      }
      {...props}
    >
      {children}
    </MenuItem>
  );
};

export interface MenuRadioItemProps extends Omit<MenuItemProps, "selected"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const MenuRadioItem: React.FC<MenuRadioItemProps> = ({
  checked = false,
  onCheckedChange,
  children,
  ...props
}) => {
  return (
    <MenuItem
      selected={checked}
      onClick={(e) => {
        onCheckedChange?.(!checked);
        props.onClick?.(e);
      }}
      icon={
        <div
          className={cn(
            "w-5 h-5 rounded-full border-2 border-current flex items-center justify-center",
            checked && "bg-primary border-primary"
          )}
        >
          {checked && (
            <div className="w-2.5 h-2.5 rounded-full bg-on-primary" />
          )}
        </div>
      }
      {...props}
    >
      {children}
    </MenuItem>
  );
};
