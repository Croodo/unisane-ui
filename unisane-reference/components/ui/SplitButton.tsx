import React from 'react';
import { cn } from '../../lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Ripple } from './Ripple';
import { Icon } from './Icon';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from './DropdownMenu';

const splitButtonVariants = cva(
  "inline-flex rounded-xs transition-all duration-snappy overflow-hidden shadow-1 border border-outline-variant/50",
  {
    variants: {
      variant: {
        filled: "bg-primary text-on-primary border-none",
        tonal: "bg-surface-container-high text-on-surface border-outline-variant",
        outlined: "bg-surface text-on-surface border-outline-variant hover:border-primary/40",
      }
    },
    defaultVariants: {
      variant: "filled",
    }
  }
);

export interface SplitButtonProps extends VariantProps<typeof splitButtonVariants> {
  label: string;
  onClick?: () => void;
  menuContent: React.ReactNode;
  className?: string;
  disabled?: boolean;
  leadingIcon?: React.ReactNode;
}

export const SplitButton: React.FC<SplitButtonProps> = ({ variant, label, onClick, menuContent, className, disabled, leadingIcon }) => {
  return (
    <div className={cn(splitButtonVariants({ variant }), disabled && "opacity-40 pointer-events-none grayscale", className)}>
      <button 
        onClick={onClick}
        className="px-6u h-11u flex items-center justify-center text-[11px] font-black uppercase tracking-widest relative border-r border-white/10 group overflow-hidden gap-2u"
      >
        <Ripple />
        {leadingIcon && <span className="w-4.5u h-4.5u flex items-center justify-center relative z-10 pointer-events-none">{leadingIcon}</span>}
        <span className="relative z-10 pt-0.5u">{label}</span>
      </button>
      
      <DropdownMenu>
        <DropdownMenuTrigger>
          <div className="w-10u h-11u flex items-center justify-center relative group overflow-hidden hover:bg-white/5">
            <Ripple center />
            <Icon symbol="arrow_drop_down" className="relative z-10" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {menuContent}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};