import React from 'react';
import { cn } from '../../lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-xs bg-surface-container-highest text-on-surface-variant font-black items-center justify-center uppercase select-none border border-outline-variant/30 shadow-sm",
  {
    variants: {
      size: {
        sm: "h-8u w-8u text-[10px]",
        md: "h-11u w-11u text-[12px]",
        lg: "h-16u w-16u text-[16px]",
        xl: "h-24u w-24u text-[24px]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export type AvatarProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof avatarVariants> & {
  src?: string;
  alt?: string;
  fallback?: string;
};

export const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  alt, 
  fallback, 
  size, 
  className, 
  ...props 
}) => {
  const [imageError, setImageError] = React.useState(false);

  return (
    <div className={cn(avatarVariants({ size, className }))} {...props}>
      {src && !imageError ? (
        <img 
          src={src} 
          alt={alt || "Avatar"} 
          className="aspect-square h-full w-full object-cover grayscale hover:grayscale-0 transition-all duration-emphasized" 
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="pt-0.5u">{fallback || (alt ? alt.charAt(0) : "?")}</span>
      )}
    </div>
  );
};