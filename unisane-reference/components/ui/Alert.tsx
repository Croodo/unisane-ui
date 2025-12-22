import React from 'react';
import { cn } from '../../lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Icon } from './Icon';
import { Typography } from './Typography';

const alertVariants = cva(
  "relative w-full rounded-xs p-5u flex items-start gap-4u border-l-4 shadow-sm",
  {
    variants: {
      variant: {
        info: "bg-secondary-container border-secondary text-on-secondary-container",
        error: "bg-error-container border-error text-on-error-container",
        warning: "bg-tertiary-container border-tertiary text-on-tertiary-container",
        success: "bg-primary-container border-primary text-on-primary-container",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

export type AlertProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants> & {
  icon?: string;
  title?: string;
};

export const Alert: React.FC<AlertProps> = ({ variant, icon, title, children, className, ...props }) => {
  const defaultIcons: Record<string, string> = {
    info: 'info',
    error: 'error',
    warning: 'warning',
    success: 'check_circle'
  };

  return (
    <div className={cn(alertVariants({ variant, className }))} role="alert" {...props}>
      <div className="shrink-0 pt-0.5u">
        <Icon symbol={icon || defaultIcons[variant || 'info']} size={22} className="opacity-80" />
      </div>
      <div className="flex-1 flex flex-col gap-1u">
        {title && (
            <Typography variant="labelSmall" className="font-black uppercase tracking-widest leading-none">
                {title}
            </Typography>
        )}
        <div className="text-[13px] font-bold uppercase tracking-tight opacity-90 leading-snug">
          {children}
        </div>
      </div>
    </div>
  );
};