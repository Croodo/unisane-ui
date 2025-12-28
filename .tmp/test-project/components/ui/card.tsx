"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from '@/lib/utils';
import { Ripple } from "./ripple";

const cardVariants = cva(
  "rounded-sm overflow-hidden flex flex-col transition-all duration-medium ease-emphasized relative group isolate",
  {
    variants: {
      variant: {
        elevated:
          "bg-surface shadow-1 border border-outline-variant/10",
        filled: "bg-surface-container border-none shadow-0",
        outlined: "bg-surface border border-outline-variant shadow-0",
        low: "bg-surface-container-low border-none shadow-0",
        high: "bg-surface-container-high border-none shadow-1",
      },
      interactive: {
        true: "cursor-pointer",
        false: "",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
    },
    compoundVariants: [
      {
        variant: "outlined",
        interactive: true,
        className: "hover:border-primary/50",
      },
    ],
    defaultVariants: {
      variant: "filled",
      padding: "none",
      interactive: false,
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  interactive?: boolean;
}

const CardRoot = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, interactive, onClick, children, ...props }, ref) => {
    const isInteractive = interactive || !!onClick;

    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, padding, interactive: isInteractive }),
          className
        )}
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
  }
);
CardRoot.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-6 pb-2 flex flex-col gap-1 relative z-10", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "p-6 pt-4 text-on-surface-variant relative z-10 text-body-small font-medium leading-relaxed",
      className
    )}
    {...props}
  />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-6 pt-0 mt-auto flex items-center gap-3 relative z-10", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

const CardMedia = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, ...props }, ref) => (
  <img
    ref={ref}
    className={cn("w-full object-cover relative z-10", className)}
    {...props}
  />
));
CardMedia.displayName = "CardMedia";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-title-large leading-none",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Content: CardContent,
  Footer: CardFooter,
  Media: CardMedia,
  Title: CardTitle,
});
