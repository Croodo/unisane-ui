
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Ripple } from './Ripple';

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2u rounded-xs font-black transition-all duration-snappy ease-emphasized overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-40 disabled:cursor-not-allowed group active:scale-[0.98] whitespace-nowrap uppercase tracking-[0.15em] text-[11px] leading-none select-none",
  {
    variants: {
      variant: {
        filled: "bg-primary text-on-primary shadow-1 hover:shadow-3 active:shadow-1",
        tonal: "bg-surface-container-high text-on-surface shadow-0 hover:bg-surface-container-highest active:shadow-0 border border-outline-variant/30",
        // Updated text to text-primary for better visibility and M3 compliance
        outlined: "border border-outline text-primary hover:bg-surface-variant active:bg-surface-container",
        text: "text-primary hover:bg-primary/5 active:bg-primary/10",
        elevated: "bg-surface text-primary shadow-2 hover:shadow-4 active:shadow-1 border border-outline-variant/10",
      },
      size: {
        sm: "h-8u px-4u text-[9px]",
        md: "h-10u px-8u text-[11px]",
        lg: "h-12u px-10u text-[13px]",
      },
    },
    defaultVariants: {
      variant: "filled",
      size: "md",
    },
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & {
  icon?: React.ReactNode;
};

export const Button: React.FC<ButtonProps> = ({ 
  variant, 
  size,
  className, 
  children, 
  icon,
  disabled,
  ...props 
}) => {
  return (
    <button 
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled}
      {...props}
    >
      <Ripple disabled={disabled} />
      {icon && <span className="w-4.5u h-4.5u flex items-center justify-center flex-shrink-0 relative z-10 pointer-events-none">{icon}</span>}
      <span className="relative z-10 pointer-events-none pt-0.5u">{children}</span>
    </button>
  );
};
