
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Ripple } from './Ripple';

const fabVariants = cva(
  "inline-flex items-center justify-center gap-2u transition-all duration-standard cursor-pointer overflow-hidden relative group shrink-0 z-30 select-none active:scale-95",
  {
    variants: {
      variant: {
        primary: "bg-primary-container text-on-primary-container shadow-3 hover:shadow-4",
        surface: "bg-surface text-primary border border-outline-variant/30 shadow-1 hover:shadow-2",
        secondary: "bg-secondary-container text-on-secondary-container shadow-3 hover:shadow-4",
        tertiary: "bg-tertiary-container text-on-tertiary-container shadow-3 hover:shadow-4",
      },
      size: {
        sm: "w-10u h-10u rounded-xs", 
        md: "w-14u h-14u rounded-xs", 
        lg: "w-24u h-24u rounded-sm", 
        extended: "h-14u px-6u rounded-xs w-auto min-w-[80px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export type FabProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof fabVariants> & {
  icon?: React.ReactNode;
  label?: string;
};

export const Fab: React.FC<FabProps> = ({ 
  variant, 
  size, 
  className, 
  icon, 
  label, 
  children, 
  disabled,
  ...props 
}) => {
  // If label is present, force extended size unless explicitly overridden
  const finalSize = label && size === 'md' ? 'extended' : size;

  return (
    <button 
      className={cn(fabVariants({ variant, size: finalSize, className }))}
      disabled={disabled}
      {...props}
    >
      <Ripple disabled={disabled} />
      <div className="relative z-10 flex items-center justify-center gap-3u pointer-events-none">
        {icon && (
            <span className={cn(
                "flex items-center justify-center transition-transform", 
                finalSize === 'lg' ? "[&>svg]:w-9u [&>svg]:h-9u" : "[&>svg]:w-6u [&>svg]:h-6u"
            )}>
                {icon}
            </span>
        )}
        {label && <span className="text-[12px] font-black uppercase tracking-widest leading-none pt-0.5u">{label}</span>}
        {children}
      </div>
    </button>
  );
};
