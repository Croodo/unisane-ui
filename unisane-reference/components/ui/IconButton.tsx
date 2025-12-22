import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Ripple } from './Ripple';

const iconButtonVariants = cva(
  "relative inline-flex items-center justify-center rounded-xs transition-all duration-snappy ease-emphasized overflow-hidden disabled:opacity-38 disabled:cursor-not-allowed group active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary select-none",
  {
    variants: {
      variant: {
        filled: "bg-primary text-on-primary shadow-1",
        tonal: "bg-surface-container-high text-on-surface",
        outlined: "border border-outline text-on-surface-variant hover:bg-surface-variant/30",
        standard: "text-on-surface-variant hover:bg-on-surface/5",
      },
      size: {
        sm: "w-8u h-8u",
        md: "w-10u h-10u",
        lg: "w-12u h-12u",
      },
      selected: {
        true: "",
        false: "",
      }
    },
    compoundVariants: [
      { variant: 'filled', selected: true, className: "bg-primary text-on-primary" },
      { variant: 'filled', selected: false, className: "bg-surface-container text-primary" },
      { variant: 'tonal', selected: true, className: "bg-secondary-container text-on-secondary-container" },
      { variant: 'outlined', selected: true, className: "bg-primary/10 border-primary text-primary" },
      { variant: 'standard', selected: true, className: "text-primary" },
    ],
    defaultVariants: {
      variant: "standard",
      size: "md",
      selected: false,
    },
  }
);

export type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof iconButtonVariants> & {
  'aria-label'?: string;
};

export const IconButton: React.FC<IconButtonProps> = ({
  variant,
  size,
  selected,
  className,
  children,
  disabled,
  ...props
}) => {
  return (
    <button 
      className={cn(iconButtonVariants({ variant, size, selected, className }))} 
      disabled={disabled}
      {...props}
    >
       <div className="absolute inset-0 pointer-events-none bg-current opacity-0 transition-opacity group-hover:opacity-[0.08] group-focus-visible:opacity-[0.12] z-0" />
       <Ripple center disabled={disabled} />
      <span className="relative z-10 flex items-center justify-center pointer-events-none">
        {children}
      </span>
    </button>
  );
};