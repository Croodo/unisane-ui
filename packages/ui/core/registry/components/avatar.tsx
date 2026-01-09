import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Surface } from "@/primitives/surface";
import { Text } from "@/primitives/text";

const avatarVariants = cva(
  "relative inline-flex items-center justify-center overflow-hidden rounded-full",
  {
    variants: {
      size: {
        sm: "w-8 h-8 text-label-small",
        md: "w-10 h-10 text-body-small",
        lg: "w-12 h-12 text-body-medium",
        xl: "w-14 h-14 text-body-large",
      },
      variant: {
        circular: "rounded-full",
        rounded: "rounded-sm",
        square: "rounded-none",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "circular",
    },
  }
);

export type AvatarProps = VariantProps<typeof avatarVariants> & {
  src?: string;
  alt?: string;
  fallback?: string;
  className?: string;
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  fallback,
  size,
  variant,
  className,
}) => {
  const fallbackChar = fallback?.charAt(0).toUpperCase() || "?";
  const fallbackLabel = fallback || alt || "Avatar";

  return (
    <Surface
      tone="surfaceVariant"
      className={cn(avatarVariants({ size, variant, className }))}
      role="img"
      aria-label={src ? alt : fallbackLabel}
    >
      {src ? (
        <img
          src={src}
          alt={alt || "Avatar"}
          className="w-full h-full object-cover"
        />
      ) : (
        <Text variant="labelLarge" className="text-inherit" aria-hidden="true">
          {fallbackChar}
        </Text>
      )}
    </Surface>
  );
};

export const AvatarGroup: React.FC<{
  children: React.ReactNode;
  max?: number;
  className?: string;
}> = ({ children, max = 5, className }) => {
  const childrenArray = React.Children.toArray(children);
  const visibleChildren = childrenArray.slice(0, max);
  const remainingCount = childrenArray.length - max;

  return (
    <div className={cn("flex -space-x-2", className)} role="group" aria-label="Avatar group">
      {visibleChildren}
      {remainingCount > 0 && (
        <Surface
          tone="surfaceVariant"
          className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-surface"
          role="img"
          aria-label={`${remainingCount} more`}
        >
          <Text variant="labelSmall" className="text-on-surface-variant" aria-hidden="true">
            +{remainingCount}
          </Text>
        </Surface>
      )}
    </div>
  );
};
