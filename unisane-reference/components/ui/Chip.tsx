import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Ripple } from './Ripple';

const chipVariants = cva(
  "inline-flex items-center gap-2u h-8u px-3u rounded-xs text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer select-none relative overflow-hidden group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary leading-none",
  {
    variants: {
      variant: {
        assist: "bg-surface border-outline text-on-surface hover:bg-surface-variant",
        filter: "bg-surface border-outline text-on-surface-variant hover:bg-surface-variant",
        input: "bg-surface border-outline text-on-surface hover:bg-surface-variant",
        suggestion: "bg-surface border-outline-variant text-on-surface-variant hover:bg-surface-variant",
      },
      selected: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "filter",
        selected: true,
        className: "bg-primary-container text-on-primary-container border-primary/20 shadow-sm"
      },
    ],
    defaultVariants: {
      variant: "assist",
      selected: false,
    },
  }
);

export type ChipProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof chipVariants> & {
  label: string;
  icon?: React.ReactNode;
  onDelete?: () => void;
  onClick?: () => void;
};

export const Chip: React.FC<ChipProps> = ({
  variant,
  selected,
  label,
  icon,
  onDelete,
  onClick,
  className,
  ...props
}) => {
  const isInteractive = !!onClick || !!onDelete;
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div 
      className={cn(chipVariants({ variant, selected, className }))} 
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-pressed={variant === 'filter' ? selected : undefined}
      {...props}
    >
      <Ripple disabled={!isInteractive} />
      <div className={cn(
        "absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-[0.08] group-active:opacity-[0.12] transition-opacity duration-standard",
        selected && variant === 'filter' ? "bg-on-primary-container" : "bg-on-surface-variant"
      )} />

      {selected && variant === 'filter' && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="animate-in zoom-in duration-standard ease-emphasized relative z-10" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      {icon && !selected && <span className="w-4u h-4u flex items-center justify-center relative z-10 pointer-events-none" aria-hidden="true">{icon}</span>}
      <span className="relative z-10 truncate leading-none pt-0.5u">{label}</span>
      {onDelete && (
         <button 
           onClick={(e) => { e.stopPropagation(); onDelete(); }} 
           className="ml-1u -mr-1u rounded-full p-0.5 hover:bg-on-surface/10 hover:text-on-surface transition-colors focus-visible:ring-2 focus-visible:ring-primary relative z-10"
           aria-label={`Remove ${label}`}
         >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
         </button>
      )}
    </div>
  );
};