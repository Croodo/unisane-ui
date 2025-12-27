import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Typography } from "./typography";
import { Ripple } from "./ripple";

export const List: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn("py-2u flex flex-col bg-surface", className)}
      role="list"
      {...props}
    >
      {children}
    </div>
  );
};

export const ListSubheader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div
    className={cn(
      "px-4u py-2u text-label-small font-black uppercase tracking-[0.3em] text-on-surface-variant/60",
      className
    )}
  >
    {children}
  </div>
);

const listItemVariants = cva(
  "relative flex items-center px-4u py-2u gap-4u text-left transition-all duration-snappy ease-emphasized group overflow-hidden select-none",
  {
    variants: {
      active: {
        true: "bg-primary/8 text-primary",
        false: "text-on-surface hover:bg-on-surface/8",
      },
      disabled: {
        true: "opacity-38 pointer-events-none grayscale",
        false: "",
      },
    },
    defaultVariants: {
      active: false,
      disabled: false,
    },
  }
);

export interface ListItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof listItemVariants> {
  headline?: string;
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
  children,
  ...props
}) => {
  const isInteractive = !!onClick && !disabled;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isInteractive && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick?.();
    }
  };

  if (!headline) {
    return (
      <div
        className={cn(listItemVariants({ active, disabled, className }))}
        onClick={isInteractive ? onClick : undefined}
        onKeyDown={isInteractive ? handleKeyDown : undefined}
        role={isInteractive ? "button" : "listitem"}
        tabIndex={isInteractive ? 0 : undefined}
        {...props}
      >
        {isInteractive && <Ripple />}
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(listItemVariants({ active, disabled, className }))}
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
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
        <Typography
          variant="bodySmall"
          className="text-inherit font-black uppercase tracking-tight leading-none truncate"
        >
          {headline}
        </Typography>
        {supportingText && (
          <Typography
            variant="labelSmall"
            className="text-on-surface-variant leading-none mt-1.5u opacity-60 truncate"
          >
            {supportingText}
          </Typography>
        )}
      </div>

      {(trailingSupportingText || trailingIcon) && (
        <div className="flex items-center gap-2u shrink-0 text-on-surface-variant relative z-10">
          {trailingSupportingText && (
            <Typography
              variant="labelSmall"
              className="font-black uppercase text-label-small tabular-nums"
            >
              {trailingSupportingText}
            </Typography>
          )}
          {trailingIcon && (
            <div className="w-5u h-5u flex items-center justify-center">
              {trailingIcon}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export type ListItemContentProps = {
  leading?: React.ReactNode;
  children: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
};

export const ListItemContent: React.FC<ListItemContentProps> = ({
  leading,
  children,
  trailing,
  className,
}) => {
  return (
    <div className={cn("flex items-center gap-3u flex-1 min-w-0", className)}>
      {leading && (
        <div className="w-6u h-6u flex items-center justify-center">
          {leading}
        </div>
      )}
      <div className="flex-1 min-w-0">{children}</div>
      {trailing && <div className="flex items-center gap-2u">{trailing}</div>}
    </div>
  );
};

export type ListItemTextProps = {
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  className?: string;
};

export const ListItemText: React.FC<ListItemTextProps> = ({
  primary,
  secondary,
  className,
}) => {
  return (
    <div className={cn("flex flex-col", className)}>
      <Typography variant="bodyLarge">{primary}</Typography>
      {secondary && (
        <Typography variant="bodyMedium" className="text-on-surface-variant">
          {secondary}
        </Typography>
      )}
    </div>
  );
};
