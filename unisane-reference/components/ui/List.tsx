import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Typography } from './Typography';
import { Ripple } from './Ripple';

export const List: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
  return (
    <div className={cn("py-2u flex flex-col bg-surface", className)} role="list" {...props}>
      {children}
    </div>
  );
};

export const ListSubheader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={cn("px-4u py-2u text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/60", className)}>
        {children}
    </div>
);

const listItemVariants = cva(
  "relative flex items-center px-4u py-2u gap-4u text-left transition-all duration-snappy ease-emphasized group overflow-hidden select-none",
  {
    variants: {
      active: {
        true: "bg-primary/5 text-primary",
        false: "text-on-surface hover:bg-on-surface/5",
      },
      disabled: {
        true: "opacity-38 pointer-events-none grayscale",
        false: "",
      }
    },
    defaultVariants: {
      active: false,
      disabled: false,
    },
  }
);

export interface ListItemProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof listItemVariants> {
  headline: string;
  supportingText?: React.ReactNode;
  trailingSupportingText?: React.ReactNode;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  onClick?: () => void;
}

export const ListItem: React.FC<ListItemProps> = ({
  headline,
  supportingText,
  trailingSupportingText,
  leadingIcon,
  trailingIcon,
  active,
  disabled,
  className,
  onClick,
  ...props
}) => {
  const isInteractive = !!onClick && !disabled;

  return (
    <div 
      className={cn(listItemVariants({ active, disabled, className }))}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? "button" : "listitem"}
      tabIndex={isInteractive ? 0 : undefined}
      {...props}
    >
      {isInteractive && <Ripple />}

      {leadingIcon && (
        <div className="text-inherit flex items-center justify-center shrink-0 w-6u h-6u relative z-10">
            {leadingIcon}
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center min-w-0 relative z-10">
        <Typography variant="bodySmall" className="text-inherit font-black uppercase tracking-tight leading-none truncate">
            {headline}
        </Typography>
        {supportingText && (
          <Typography variant="labelSmall" className="text-on-surface-variant leading-none mt-1.5u opacity-60 truncate">
            {supportingText}
          </Typography>
        )}
      </div>

      {(trailingSupportingText || trailingIcon) && (
        <div className="flex items-center gap-2u shrink-0 text-on-surface-variant relative z-10">
           {trailingSupportingText && (
               <Typography variant="labelSmall" className="font-black uppercase text-[10px] tabular-nums">
                   {trailingSupportingText}
               </Typography>
           )}
           {trailingIcon && <div className="w-5u h-5u flex items-center justify-center">{trailingIcon}</div>}
        </div>
      )}
    </div>
  );
};