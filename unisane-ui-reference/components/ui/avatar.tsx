import React, { forwardRef, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const avatarVariants = cva(
  "flex items-center justify-center overflow-hidden bg-surface-container-high text-on-surface-variant font-medium",
  {
    variants: {
      size: {
        sm: "w-8u h-8u text-label-medium",
        md: "w-10u h-10u text-label-large",
        lg: "w-12u h-12u text-title-medium",
        xl: "w-16u h-16u text-title-large",
      },
      shape: {
        circle: "rounded-full",
        rounded: "rounded-lg",
        square: "rounded-none",
      },
    },
    defaultVariants: {
      size: "md",
      shape: "circle",
    },
  }
);

interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  fallback?: string;
}

const getInitials = (name?: string) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt = "", fallback, size = "md", shape = "circle", className, ...props }, ref) => {
    const [imageError, setImageError] = useState(false);
    const showFallback = !src || imageError;

    return (
      <div
        ref={ref}
        className={cn(
          avatarVariants({ size, shape }),
          showFallback && "bg-primary-container text-on-primary-container",
          className
        )}
        {...props}
      >
        {showFallback ? (
          <span>{getInitials(fallback || alt)}</span>
        ) : (
          <img
            src={src}
            alt={alt}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";

// Avatar Group for showing multiple avatars
interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  className?: string;
}

export const AvatarGroup = ({ children, max = 5, className }: AvatarGroupProps) => {
  const childArray = React.Children.toArray(children);
  const visible = childArray.slice(0, max);
  const excess = childArray.length - max;

  return (
    <div className={cn("flex items-center -space-x-2u", className)}>
      {visible.map((child, index) => (
        <div key={index} className="ring-2 ring-surface rounded-full">
          {child}
        </div>
      ))}
      {excess > 0 && (
        <div className="w-10u h-10u rounded-full bg-surface-container-high text-on-surface flex items-center justify-center text-label-large font-medium ring-2 ring-surface">
          +{excess}
        </div>
      )}
    </div>
  );
};