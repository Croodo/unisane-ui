import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Typography } from './Typography';

const topAppBarVariants = cva(
  "w-full flex items-center px-4u transition-all duration-emphasized ease-standard bg-surface text-on-surface relative z-[20]", 
  {
    variants: {
      variant: {
        center: "h-16u justify-between border-b border-outline-variant/30",
        small: "h-16u justify-between border-b border-outline-variant/30",
        medium: "h-28u flex-col items-start justify-end pb-6u border-b border-outline-variant/30",
        large: "h-38u flex-col items-start justify-end pb-8u border-b border-outline-variant/30",
      },
      scrolled: {
        true: "bg-surface-container-low shadow-1", 
        false: "",
      }
    },
    defaultVariants: {
      variant: "small",
      scrolled: false,
    },
  }
);

export type TopAppBarProps = VariantProps<typeof topAppBarVariants> & {
  title: string;
  navigationIcon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export const TopAppBar: React.FC<TopAppBarProps> = ({
  variant,
  scrolled,
  title,
  navigationIcon,
  actions,
  className,
}) => {
  const isTall = variant === 'medium' || variant === 'large';
  const isCenter = variant === 'center';

  return (
    <header className={cn(topAppBarVariants({ variant, scrolled, className }))}>
      <div className={cn("w-full flex items-center", isTall ? "h-16u mb-auto" : "h-full", isCenter ? "justify-center relative" : "justify-between")}>
        {navigationIcon && (
          <div className={cn("text-on-surface mr-4u z-10 shrink-0", isCenter ? "absolute left-0" : "")}>
            {navigationIcon}
          </div>
        )}
        {!isTall && (
          <div className={cn("truncate min-w-0 flex-1", isCenter ? "text-center px-12u w-full" : "text-left")}>
            <Typography variant="titleMedium" className="truncate font-black uppercase tracking-tight leading-none text-on-surface">
                {title}
            </Typography>
          </div>
        )}
        <div className={cn("flex items-center gap-1u text-on-surface-variant z-10 shrink-0", isCenter && "absolute right-0")}>
          {actions}
        </div>
      </div>
      {isTall && (
        <div className={cn("px-2u w-full transition-all duration-standard ease-emphasized", scrolled ? "opacity-0 -translate-y-4u pointer-events-none" : "opacity-100 translate-y-0")}>
           <Typography variant={variant === 'large' ? 'headlineLarge' : 'headlineSmall'} className="truncate font-black uppercase tracking-tighter text-on-surface leading-none">
              {title}
           </Typography>
        </div>
      )}
    </header>
  );
};