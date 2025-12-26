"use client";

import React, { useState, useRef, useEffect } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Surface } from "@/primitives/surface";
import { IconButton } from "./icon-button";
import { StateLayer } from "@/primitives/state-layer";

const carouselVariants = cva("relative w-full overflow-hidden", {
  variants: {
    variant: {
      default: "",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export type CarouselProps = VariantProps<typeof carouselVariants> & {
  children: React.ReactNode;
  autoPlay?: boolean;
  interval?: number;
  showControls?: boolean;
  showIndicators?: boolean;
  className?: string;
};

export const Carousel: React.FC<CarouselProps> = ({
  children,
  autoPlay = false,
  interval = 5000,
  showControls = true,
  showIndicators = true,
  className,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const childrenArray = React.Children.toArray(children);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const goToSlide = (index: number) => {
    const newIndex = (index + childrenArray.length) % childrenArray.length;
    setCurrentIndex(newIndex);
  };

  const nextSlide = () => {
    goToSlide(currentIndex + 1);
  };

  const prevSlide = () => {
    goToSlide(currentIndex - 1);
  };

  useEffect(() => {
    if (autoPlay && !isHovered) {
      autoPlayRef.current = setInterval(nextSlide, interval);
    } else {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [autoPlay, interval, isHovered, currentIndex]);

  return (
    <div
      className={cn(carouselVariants({ className }))}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full h-full">
        {childrenArray.map((child, index) => (
          <div
            key={index}
            className={cn(
              "absolute inset-0 w-full h-full transition-opacity duration-long",
              index === currentIndex ? "opacity-100" : "opacity-0"
            )}
            aria-hidden={index !== currentIndex}
          >
            {child}
          </div>
        ))}
      </div>

      {showControls && childrenArray.length > 1 && (
        <>
          <IconButton
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
            }
            onClick={prevSlide}
            ariaLabel="Previous slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-surface/80 backdrop-blur-sm"
          />
          <IconButton
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
              </svg>
            }
            onClick={nextSlide}
            ariaLabel="Next slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-surface/80 backdrop-blur-sm"
          />
        </>
      )}

      {showIndicators && childrenArray.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {childrenArray.map((_, index) => (
            <button
              key={index}
              className={cn(
                "relative w-2 h-2 rounded-full transition-colors",
                index === currentIndex
                  ? "bg-primary"
                  : "bg-on-surface-variant/50"
              )}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            >
              <StateLayer />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export type CarouselSlideProps = {
  children: React.ReactNode;
  className?: string;
};

export const CarouselSlide: React.FC<CarouselSlideProps> = ({
  children,
  className,
}) => {
  return <div className={cn("w-full h-full", className)}>{children}</div>;
};
