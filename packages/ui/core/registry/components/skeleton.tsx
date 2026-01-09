import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const skeletonVariants = cva(
  "relative overflow-hidden bg-surface-container-highest animate-pulse",
  {
    variants: {
      variant: {
        text: "rounded-sm",
      circular: "rounded-full",
      rectangular: "rounded-sm",
      rounded: "rounded-sm",
    },
    },
    defaultVariants: {
      variant: "rectangular",
    },
  }
);

export type SkeletonProps = VariantProps<typeof skeletonVariants> & {
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
};

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = "rectangular",
  width,
  height,
  className,
  style,
}) => {
  const skeletonStyle: React.CSSProperties = {
    width,
    height,
    ...style,
  };

  return (
    <div
      className={cn(skeletonVariants({ variant, className }))}
      style={skeletonStyle}
      aria-hidden="true"
    />
  );
};

export const SkeletonText: React.FC<{
  lines?: number;
  width?: number | string;
  className?: string;
}> = ({ lines = 3, width = "100%", className }) => {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? "60%" : width}
          height="4u"
        />
      ))}
    </div>
  );
};

export const SkeletonAvatar: React.FC<{
  size?: number | string;
  className?: string;
}> = ({ size = "10u", className }) => {
  return (
    <Skeleton
      variant="circular"
      width={size}
      height={size}
      className={className}
    />
  );
};

export const SkeletonCard: React.FC<{
  className?: string;
}> = ({ className }) => {
  return (
    <div className={cn("p-4 space-y-4", className)}>
      <div className="flex items-center gap-3">
        <SkeletonAvatar size="10u" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" height="4u" />
          <Skeleton variant="text" width="40%" height="3u" />
        </div>
      </div>
      <Skeleton variant="rectangular" width="100%" height="38u" />
      <SkeletonText lines={2} />
    </div>
  );
};
