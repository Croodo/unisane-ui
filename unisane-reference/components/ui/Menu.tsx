import React from 'react';
import { cn } from '../../lib/utils';
import { Ripple } from './Ripple';
import { Icon } from './Icon';

interface MenuProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
}

export const Menu: React.FC<MenuProps> = ({ open, className, children, ...props }) => {
  if (!open) return null;
  
  return (
    <div 
      className={cn(
        "min-w-[180px] max-w-[320px] bg-surface rounded-xs py-2u shadow-3 border border-outline-variant overflow-hidden animate-in fade-in zoom-in-95 duration-snappy ease-emphasized z-[700]", 
        className
      )}
      role="menu"
      {...props}
    >
      {children}
    </div>
  );
};

interface MenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  label: string;
}

export const MenuItem: React.FC<MenuItemProps> = ({ 
  leadingIcon, 
  trailingIcon, 
  label, 
  className, 
  disabled,
  ...props 
}) => {
  return (
    <button
      className={cn(
        "w-full h-11u px-4u flex items-center gap-4u text-[12px] font-black uppercase tracking-tight transition-all relative text-on-surface disabled:opacity-30 text-left group overflow-hidden leading-none",
        className
      )}
      role="menuitem"
      disabled={disabled}
      {...props}
    >
       <Ripple disabled={disabled} />
      {leadingIcon && (
        <span className="flex items-center justify-center w-5u h-5u shrink-0 relative z-10 text-on-surface-variant group-hover:text-primary transition-colors">
            {leadingIcon}
        </span>
      )}
      <span className="flex-1 truncate relative z-10 pt-0.5u tracking-tighter">{label}</span>
      {trailingIcon && <span className="text-on-surface-variant text-[9px] font-black flex items-center relative z-10 tabular-nums">{trailingIcon}</span>}
    </button>
  );
};

export const MenuDivider: React.FC<{ className?: string }> = ({ className }) => (
    <div className={cn("h-px bg-surface-container-highest my-1.5u mx-2u", className)} />
);

export const MenuCheckboxItem: React.FC<MenuItemProps & { checked?: boolean }> = ({ checked, leadingIcon, ...props }) => {
  return (
    <MenuItem
      {...props}
      leadingIcon={
        checked ? (
            <Icon symbol="check" className="text-primary" size={18} />
        ) : (
             <div className="w-5u h-5u" /> 
        )
      }
      role="menuitemcheckbox"
      aria-checked={checked}
      className={cn(props.className, checked ? "bg-primary/5 text-primary" : "")}
    />
  );
};

export const MenuRadioItem: React.FC<MenuItemProps & { checked?: boolean }> = ({ checked, leadingIcon, ...props }) => {
  return (
    <MenuItem
      {...props}
      leadingIcon={
        checked ? (
            <div className="w-5u h-5u flex items-center justify-center relative z-10">
                <div className="w-2.5u h-2.5u rounded-full bg-primary" />
            </div>
        ) : (
             <div className="w-5u h-5u" /> 
        )
      }
      role="menuitemradio"
      aria-checked={checked}
      className={cn(props.className, checked ? "bg-primary/5 text-primary" : "")}
    />
  );
};