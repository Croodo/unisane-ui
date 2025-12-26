import { type ReactNode, type HTMLAttributes, forwardRef } from "react";
import { Ripple } from "./ripple";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const chipVariants = cva(
  "inline-flex items-center gap-2u h-8u px-3u rounded-sm text-label-small font-medium border transition-all cursor-pointer select-none relative overflow-hidden group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary leading-none",
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
        className: "bg-primary-container text-on-primary-container border-primary/20"
      },
    ],
    defaultVariants: {
      variant: "assist",
      selected: false,
    },
  }
);

export type ChipProps = Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> &
  VariantProps<typeof chipVariants> & {
    label: string;
    icon?: ReactNode;
    onDelete?: () => void;
    disabled?: boolean;
  };

export const Chip = forwardRef<HTMLDivElement, ChipProps>(
  (
    {
      label,
      variant,
      selected,
      disabled = false,
      onDelete,
      icon,
      className,
      onClick,
      ...props
    },
    ref
  ) => {
    const isInteractive = !disabled && (!!onClick || !!onDelete);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (onClick && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        onClick(e as any);
      }
    };

    return (
      <div
        ref={ref}
        className={cn(chipVariants({ variant, selected, className }), disabled && "opacity-38 cursor-not-allowed pointer-events-none")}
        onClick={!disabled ? onClick : undefined}
        onKeyDown={!disabled ? handleKeyDown : undefined}
        role={isInteractive ? "button" : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        aria-pressed={variant === "filter" ? !!selected : undefined}
        {...props}
      >
        <Ripple disabled={!isInteractive} />

        <div className={cn(
          "absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-hover group-active:opacity-pressed transition-opacity duration-medium ease-standard",
          selected && variant === 'filter' ? "bg-on-primary-container" : "bg-on-surface-variant"
        )} />

        {selected && variant === 'filter' && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="animate-in zoom-in duration-medium ease-emphasized relative z-10" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}

        {icon && !selected && (
          <span className="w-4u h-4u flex items-center justify-center relative z-10 pointer-events-none" aria-hidden="true">
            {icon}
          </span>
        )}

        <span className="relative z-10 truncate leading-none pt-0.5u">{label}</span>

        {onDelete && (
          <button
            type="button"
            className="ml-1u -mr-1u rounded-sm p-0.5 hover:bg-on-surface/10 hover:text-on-surface transition-colors focus-visible:ring-2 focus-visible:ring-primary relative z-10"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label={`Remove ${label}`}
            disabled={disabled}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

Chip.displayName = "Chip";
