"use client";

import React, { useState, useEffect, useRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { IconButton } from "./icon-button";

const carouselVariants = cva("relative overflow-hidden rounded-lg group");

const indicatorVariants = cva(
  "h-2u rounded-full transition-all duration-short cursor-pointer",
  {
    variants: {
      active: {
        true: "bg-primary w-6u",
        false: "bg-on-surface/40 hover:bg-on-surface/60 w-2u",
      },
    },
    defaultVariants: {
      active: false,
    },
  }
);

interface CarouselProps {
  children: React.ReactNode[];
  autoPlay?: boolean;
  interval?: number; // in milliseconds
  showIndicators?: boolean;
  showControls?: boolean;
  className?: string;
}

export const Carousel = ({
  children,
  autoPlay = false,
  interval = 5000,
  showIndicators = true,
  showControls = true,
  className,
}: CarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? children.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === children.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    if (!autoPlay || isPaused) return;

    timeoutRef.current = setTimeout(goToNext, interval);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentIndex, autoPlay, isPaused, interval]);

  return (
    <div
      className={cn(carouselVariants(), className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Carousel"
    >
      {/* Slides */}
      <div
        className="flex transition-transform duration-emphasized ease-smooth h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {children.map((child, index) => (
          <div key={index} className="min-w-full flex-shrink-0 h-full">
            {child}
          </div>
        ))}
      </div>

      {/* Controls */}
      {showControls && children.length > 1 && (
        <>
          <div className="absolute left-4u top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-short">
            <IconButton
                variant="filled"
                ariaLabel="Previous"
                onClick={goToPrevious}
                className="bg-surface/50 text-on-surface hover:bg-surface/80 shadow-1"
            >
                <span className="material-symbols-outlined">chevron_left</span>
            </IconButton>
          </div>

          <div className="absolute right-4u top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-short">
            <IconButton
                variant="filled"
                ariaLabel="Next"
                onClick={goToNext}
                className="bg-surface/50 text-on-surface hover:bg-surface/80 shadow-1"
            >
                <span className="material-symbols-outlined">chevron_right</span>
            </IconButton>
          </div>
        </>
      )}

      {/* Indicators */}
      {showIndicators && children.length > 1 && (
        <div className="absolute bottom-4u left-1/2 -translate-x-1/2 flex gap-2u p-2u rounded-full bg-black/20 backdrop-blur-sm">
          {children.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(indicatorVariants({ active: index === currentIndex }))}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};