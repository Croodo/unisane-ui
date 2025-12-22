import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Ripple } from './Ripple';

const cardVariants = cva(
  "rounded-xs overflow-hidden flex flex-col transition-all duration-standard ease-emphasized relative group isolate",
  {
    variants: {
      variant: {
        elevated: "bg-surface shadow-1 border border-outline-variant/10", 
        filled: "bg-surface-container border-none shadow-0",
        outlined: "bg-surface border border-outline-variant shadow-0",
        low: "bg-surface-container-low border-none shadow-0",
        high: "bg-surface-container-high border-none shadow-1",
      },
      interactive: {
        true: "cursor-pointer active:scale-[0.99] hover:shadow-2",
        false: "",
      },
      padding: {
        none: "p-0",
        sm: "p-4u",
        md: "p-6u",
        lg: "p-8u",
      }
    },
    compoundVariants: [
      { variant: 'outlined', interactive: true, className: "hover:border-primary/50" },
    ],
    defaultVariants: {
      variant: "filled",
      padding: "none",
      interactive: false,
    },
  }
);

export type CardProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants> & {
  interactive?: boolean;
};

export const Card: React.FC<CardProps> = ({ 
  variant, 
  padding,
  interactive,
  className, 
  children,
  onClick,
  ...props 
}) => {
  const isInteractive = interactive || !!onClick;

  return (
    <div 
      className={cn(cardVariants({ variant, padding, interactive: isInteractive, className }))} 
      onClick={onClick}
      {...props}
    >
      {isInteractive && (
        <>
          <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-5 transition-opacity bg-primary z-0" />
          <Ripple />
        </>
      )}
      <div className="relative z-10 flex flex-col h-full pointer-events-none text-left">
         <div className="pointer-events-auto h-full flex flex-col">
            {children}
         </div>
      </div>
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("p-6u pb-2u flex flex-col gap-1u relative z-10", className)} {...props} />
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("p-6u pt-4u text-on-surface-variant relative z-10 text-[13px] font-medium leading-relaxed", className)} {...props} />
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("p-6u pt-0 mt-auto flex items-center gap-3u relative z-10", className)} {...props} />
);

export const CardMedia: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({ className, ...props }) => (
  <img className={cn("w-full object-cover relative z-10", className)} {...props} />
);