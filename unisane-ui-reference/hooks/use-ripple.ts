import { useCallback, useRef } from "react";
import React from 'react';

interface RippleOptions {
  color?: string;
  duration?: number;
  disabled?: boolean;
}

export function useRipple(options: RippleOptions = {}) {
  const {
    color = "currentColor",
    duration = 600,
    disabled = false
  } = options;

  const rippleTimeoutRef = useRef<number | null>(null);

  const createRipple = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (disabled) return;

      const element = event.currentTarget;

      // Ensure relative or absolute positioning
      const position = window.getComputedStyle(element).position;
      if (position === 'static') {
        element.style.position = 'relative';
      }

      const ripple = document.createElement("span");
      const rect = element.getBoundingClientRect();
      const diameter = Math.max(element.clientWidth, element.clientHeight);
      const radius = diameter / 2;

      // Calculate ripple position from click point
      const x = event.clientX - rect.left - radius;
      const y = event.clientY - rect.top - radius;

      // Use cssText for better performance
      ripple.style.cssText = `
        position: absolute;
        width: ${diameter}px;
        height: ${diameter}px;
        left: ${x}px;
        top: ${y}px;
        border-radius: 50%;
        background-color: ${color};
        pointer-events: none;
        transform: scale(0);
        opacity: 0.35;
        animation: ripple ${duration}ms ease-out forwards;
      `;
      ripple.className = "ripple-effect";

      // Remove old ripples before adding new one (limit to 1 ripple at a time)
      const oldRipples = element.querySelectorAll(".ripple-effect");
      oldRipples.forEach((r) => r.remove());

      element.appendChild(ripple);

      // Cleanup with ref to prevent memory leaks
      if (rippleTimeoutRef.current) {
        clearTimeout(rippleTimeoutRef.current);
      }

      rippleTimeoutRef.current = window.setTimeout(() => {
        ripple.remove();
      }, duration);
    },
    [color, duration, disabled]
  );

  return createRipple;
}