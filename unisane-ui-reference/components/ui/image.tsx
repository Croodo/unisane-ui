"use client";

import React, { useState, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const imageContainerVariants = cva("relative overflow-hidden bg-surface-container-highest", {
  variants: {
    aspectRatio: {
      square: "aspect-square",
      video: "aspect-video",
      portrait: "aspect-[3/4]",
      landscape: "aspect-[4/3]",
      auto: "",
    },
  },
  defaultVariants: {
    aspectRatio: "auto",
  },
});

const imageVariants = cva("w-full h-full transition-opacity duration-short", {
  variants: {
    objectFit: {
      cover: "object-cover",
      contain: "object-contain",
      fill: "object-fill",
      none: "object-none",
    },
    loading: {
      true: "opacity-0",
      false: "opacity-100",
    },
  },
  defaultVariants: {
    objectFit: "cover",
    loading: false,
  },
});

interface ImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "loading">,
    VariantProps<typeof imageContainerVariants>,
    Omit<VariantProps<typeof imageVariants>, "loading"> {
  fallback?: React.ReactNode;
}

export const Image = forwardRef<HTMLImageElement, ImageProps>(
  (
    {
      src,
      alt = "",
      fallback,
      aspectRatio,
      objectFit = "cover",
      className,
      onLoad,
      onError,
      ...props
    },
    ref
  ) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
      setIsLoading(false);
      onLoad?.(e);
    };

    const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
      setIsLoading(false);
      setHasError(true);
      onError?.(e);
    };

    if (hasError && fallback) {
      return (
        <div className={cn(imageContainerVariants({ aspectRatio }), className)}>
          {fallback}
        </div>
      );
    }

    return (
      <div className={cn(imageContainerVariants({ aspectRatio }), className)}>
        {/* Loading skeleton */}
        {isLoading && (
          <div className="absolute inset-0 bg-surface-container-highest animate-pulse z-0" />
        )}

        {/* Image */}
        <img
          ref={ref}
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(imageVariants({ objectFit, loading: isLoading }), "relative z-10")}
          {...props}
        />
      </div>
    );
  }
);

Image.displayName = "Image";