"use client";

import React, { useState, useLayoutEffect, useCallback } from "react";
import { cn } from "@ui/lib/utils";

interface RippleProps {
  color?: string; // Optional color override, defaults to currentColor
  center?: boolean; // For icon buttons, ripple starts from center
  disabled?: boolean;
  className?: string;
}

interface RippleEffect {
  x: number;
  y: number;
  size: number;
  id: number;
}

export const Ripple: React.FC<RippleProps> = ({
  color = "currentColor",
  center = false,
  disabled = false,
  className,
}) => {
  const [ripples, setRipples] = useState<RippleEffect[]>([]);

  const addRipple = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;

      const container = e.currentTarget.getBoundingClientRect();
      const size =
        container.width > container.height ? container.width : container.height;

      // If centered (e.g. icon buttons), ignore click coords
      const x = center ? container.width / 2 : e.clientX - container.left;
      const y = center ? container.height / 2 : e.clientY - container.top;

      const newRipple = { x, y, size, id: Date.now() };
      setRipples((prev) => [...prev, newRipple]);
    },
    [disabled, center]
  );

  useLayoutEffect(() => {
    if (ripples.length > 0) {
      const timer = setTimeout(() => {
        setRipples([]);
      }, 600); // Matches CSS animation duration
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
          className="absolute rounded-full bg-current opacity-25 animate-ripple pointer-events-none"
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
