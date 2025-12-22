
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  "flex items-center justify-center bg-error text-on-error pointer-events-none tabular-nums transition-all duration-standard ease-emphasized z-[60] select-none shadow-sm ring-2 ring-surface",
  {
    variants: {
      variant: {
        small: "min-w-[8px] h-[8px] rounded-full p-0", 
        large: "h-5u min-w-5u rounded-full px-1.5u text-[10px] font-black leading-none tracking-tight", 
      },
      position: {
        none: "relative ring-0",
        'top-right': "absolute top-0 right-0 translate-x-[25%] -translate-y-[25%]",
        'icon-button': "absolute top-[4px] right-[4px] translate-x-[10%] -translate-y-[10%]",
      }
    },
    defaultVariants: {
      variant: "large",
      position: "top-right",
    },
  }
);

export type BadgeProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants> & {
  value?: string | number;
  max?: number;
  showZero?: boolean;
  invisible?: boolean;
};

export const Badge: React.FC<BadgeProps> = ({ 
  variant, 
  value, 
  max = 99, 
  showZero = false, 
  invisible = false, 
  className, 
  position, 
  children, 
  ...props 
}) => {
  const isStandalone = !children;
  // Auto-detect variant if not provided: if value exists -> large, else -> small (dot)
  const derivedVariant = variant || ( (value !== undefined && value !== null && value !== '') ? 'large' : 'small');
  const derivedPosition = position || (isStandalone ? 'none' : 'top-right');

  let displayValue = value;
  if (typeof value === 'number') {
    if (value === 0 && !showZero && !invisible) return <>{children}</>;
    if (value > max) displayValue = `${max}+`;
  }

  // If invisible is true, just render children without badge
  if (invisible) return <div className="relative inline-flex shrink-0">{children}</div>;

  return (
    <div className={cn("relative inline-flex shrink-0 align-middle w-fit h-fit", className)}>
      {children}
      <span 
        className={cn(badgeVariants({ variant: derivedVariant, position: derivedPosition }))} 
        {...props}
      >
        {derivedVariant === 'large' && displayValue}
      </span>
    </div>
  );
};
