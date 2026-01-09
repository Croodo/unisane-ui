"use client";

import React, { useState, useLayoutEffect, useCallback, useEffect } from "react";
import { cn } from "@/src/lib/utils";

export interface RippleProps {
  color?: string;
  center?: boolean;
  disabled?: boolean | undefined;
  className?: string;
}

interface RippleEffect {
  x: number;
  y: number;
  size: number;
  id: number;
}

export const Ripple: React.FC<RippleProps> = ({
  center = false,
  disabled = false,
  className,
}) => {
  const [ripples, setRipples] = useState<RippleEffect[]>([]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for prefers-reduced-motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const addRipple = useCallback(
    (e: React.MouseEvent) => {
      if (disabled || prefersReducedMotion) return;

      const container = e.currentTarget.getBoundingClientRect();
      const size =
        container.width > container.height ? container.width : container.height;

      const x = center ? container.width / 2 : e.clientX - container.left;
      const y = center ? container.height / 2 : e.clientY - container.top;

      const newRipple = { x, y, size, id: Date.now() };
      setRipples((prev) => [...prev, newRipple]);
    },
    [disabled, center, prefersReducedMotion]
  );

  useLayoutEffect(() => {
    if (ripples.length > 0) {
      const timer = setTimeout(() => {
        setRipples([]);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [ripples]);

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden rounded-[inherit] z-0",
        className
      )}
      onMouseDown={addRipple}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-current opacity-pressed animate-ripple pointer-events-none"
          style={{
            top: ripple.y,
            left: ripple.x,
            width: ripple.size * 2,
            height: ripple.size * 2,
            marginTop: -ripple.size,
            marginLeft: -ripple.size,
          }}
        />
      ))}
    </div>
  );
};
