import React from "react";
import { Typography, cn } from "@unisane/ui";

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn("p-6u pb-2u flex flex-col gap-1u relative z-10", className)}
      {...props}
    />
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => {
  return (
    <Typography
      variant="titleLarge"
      component="h3"
      className={cn("font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "p-6u pt-4u text-on-surface-variant relative z-10 text-[13px] font-medium leading-relaxed",
        className
      )}
      {...props}
    />
  );
};
