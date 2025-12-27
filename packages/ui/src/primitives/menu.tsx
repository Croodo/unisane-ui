import React, { isValidElement, cloneElement } from "react";
import { cn, Slot } from "@ui/lib/utils";
import { Text } from "./text";
import { Ripple } from "../components/ripple";

export interface MenuProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Menu: React.FC<MenuProps> = ({
  open = true,
  className,
  children,
  ...props
}) => {
  if (!open) return null;

  return (
    <div
      className={cn(
        "min-w-[calc(var(--unit)*50)] bg-surface rounded-sm shadow-2 py-1u border border-outline-variant/20 overflow-hidden",
        className
      )}
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
  href?: string;
  asChild?: boolean;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  children,
  disabled = false,
  selected = false,
  icon,
  className,
  href,
  asChild,
  ...props
}) => {
  const itemClasses = cn(
    "relative w-full text-left px-4u py-3u flex items-center gap-3u cursor-pointer select-none overflow-hidden",
    "text-on-surface hover:bg-on-surface/8 focus-visible:outline-none focus-visible:bg-on-surface/12",
    disabled && "opacity-38 cursor-not-allowed hover:bg-transparent",
    selected && "bg-primary/8 text-primary",
    className
  );

  const innerContent = (
    <>
      <Ripple disabled={disabled} />
      {icon && <div className="shrink-0 relative z-10">{icon}</div>}
      <Text variant="labelLarge" className="flex-1 relative z-10">
        {asChild ? null : children}
      </Text>
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
      className={cn("h-px bg-outline-variant/40 my-1u", className)}
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
            "w-4u h-4u rounded-xs border-2 border-current",
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
            "w-4u h-4u rounded-full border-2 border-current",
            checked && "bg-primary border-primary"
          )}
        >
          {checked && (
            <div className="w-2u h-2u rounded-full bg-on-primary m-auto" />
          )}
        </div>
      }
      {...props}
    >
      {children}
    </MenuItem>
  );
};
