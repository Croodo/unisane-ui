import React from "react";
import { cn } from "@/lib/utils";
import { Typography } from "../components/typography";
import { Ripple } from "../components/ripple";

export interface MenuProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
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
        "min-w-[calc(var(--unit)*50)] bg-surface rounded-sm shadow-2 py-2 border border-outline-variant/20 overflow-hidden",
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
  trailingIcon?: React.ReactNode;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  children,
  disabled = false,
  selected = false,
  icon,
  trailingIcon,
  className,
  ...props
}) => {
  return (
    <button
      className={cn(
        "relative w-full text-left px-3 py-2 flex items-center gap-3 cursor-pointer select-none overflow-hidden",
        "text-on-surface transition-colors duration-short ease-standard",
        "hover:bg-on-surface/8 focus-visible:bg-on-surface/12 focus-visible:outline-none",
        disabled && "opacity-38 cursor-not-allowed hover:bg-transparent",
        selected && "bg-secondary-container text-on-secondary-container",
        className
      )}
      role="menuitem"
      disabled={disabled}
      aria-disabled={disabled}
      aria-selected={selected}
      {...props}
    >
      <Ripple disabled={disabled} />
      {icon && <div className="shrink-0 relative z-10 flex items-center justify-center w-6 h-6">{icon}</div>}
      <Typography variant="bodyMedium" className="flex-1 relative z-10">
        {children}
      </Typography>
      {trailingIcon && <div className="shrink-0 relative z-10 text-on-surface-variant flex items-center justify-center">{trailingIcon}</div>}
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
            "w-4 h-4 rounded-xs border-2 border-current",
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
            "w-4 h-4 rounded-full border-2 border-current",
            checked && "bg-primary border-primary"
          )}
        >
          {checked && (
            <div className="w-2 h-2 rounded-full bg-on-primary m-auto" />
          )}
        </div>
      }
      {...props}
    >
      {children}
    </MenuItem>
  );
};
