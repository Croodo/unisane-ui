import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { Ripple } from "./ripple";

const cardVariants = cva(
  "rounded-lg overflow-hidden transition-all duration-short",
  {
    variants: {
      variant: {
        elevated: "bg-surface shadow-1 hover:shadow-2",
        filled: "bg-surface-container-highest",
        outlined: "bg-surface border border-outline-variant",
      },
      interactive: {
        true: "cursor-pointer hover:shadow-3 active:shadow-1 relative group",
        false: "",
      },
    },
    defaultVariants: {
      variant: "filled",
      interactive: false,
    },
  }
);

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "filled", interactive = false, className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, interactive }), className)}
        {...props}
      >
        {interactive && (
          <>
            <div className="absolute inset-0 pointer-events-none bg-current opacity-0 transition-opacity group-hover:opacity-hover group-focus-visible:opacity-focus group-active:opacity-pressed z-0" />
            <Ripple />
          </>
        )}
        <div className={cn(interactive ? "relative z-10" : "")}>{children}</div>
      </div>
    );
  }
);

Card.displayName = "Card";

// Card Header
export const CardHeader = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn("px-4u py-4u", className)}>{children}</div>;

// Card Title
export const CardTitle = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h3 className={cn("text-title-large font-normal text-on-surface", className)}>
    {children}
  </h3>
);

// Card Description
export const CardDescription = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <p className={cn("text-body-medium text-on-surface-variant mt-1u", className)}>
    {children}
  </p>
);

// Card Content
export const CardContent = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn("px-4u py-3u", className)}>{children}</div>;

// Card Actions
const cardActionsVariants = cva("flex items-center gap-2u px-4u py-3u", {
  variants: {
    align: {
      start: "justify-start",
      end: "justify-end",
      center: "justify-center",
    },
  },
  defaultVariants: {
    align: "end",
  },
});

interface CardActionsProps extends VariantProps<typeof cardActionsVariants> {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "end" | "center";
}

export const CardActions = ({ children, className = "", align = "end" }: CardActionsProps) => {
  return (
    <div className={cn(cardActionsVariants({ align }), className)}>
      {children}
    </div>
  );
};