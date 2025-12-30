"use client";

import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";

export interface SliderProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange"
  > {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  withLabel?: boolean;
  withTicks?: boolean;
  showValue?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

export const Slider: React.FC<SliderProps> = ({
  min = 0,
  max = 100,
  step = 1,
  value: controlledValue,
  defaultValue = 50,
  onChange,
  className,
  disabled,
  withLabel = false,
  withTicks = false,
  showValue = false,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const val = isControlled ? controlledValue : internalValue;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const percentage = ((val - min) / (max - min)) * 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const ticks: number[] = [];
  if (withTicks && step > 0) {
    const count = Math.floor((max - min) / step);
    if (count < 50) {
      for (let i = 0; i <= count; i++) {
        ticks.push((i / count) * 100);
      }
    }
  }

  const shouldShowLabel = withLabel || showValue;

  return (
    <div
      className={cn(
        "relative flex items-center h-10 w-full group touch-none select-none",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => !disabled && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
    >
      <input
        ref={inputRef}
        type="range"
        min={min}
        max={max}
        step={step}
        value={val}
        disabled={disabled}
        onChange={handleChange}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={val}
        aria-orientation="horizontal"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30 disabled:cursor-not-allowed"
        {...props}
      />

      <div className="relative w-full h-1 rounded-sm flex items-center">
        <div
          className={cn(
            "absolute w-full h-full rounded-sm transition-colors",
            disabled ? "bg-on-surface/12" : "bg-surface-container-highest"
          )}
        />

        <div
          className={cn(
            "absolute h-full rounded-sm transition-all duration-snappy",
            disabled ? "bg-on-surface/38" : "bg-primary"
          )}
          style={{ width: `${percentage}%` }}
        />

        {withTicks &&
          ticks.map((tick, i) => (
            <div
              key={i}
              className={cn(
                "absolute w-0.5 h-0.5 rounded-full z-10",
                tick <= percentage
                  ? "bg-on-primary/60"
                  : "bg-on-surface-variant/40"
              )}
              style={{ left: `${tick}%` }}
            />
          ))}
      </div>

      <div
        className="absolute h-full flex items-center justify-center pointer-events-none z-20"
        style={{ left: `${percentage}%`, transform: "translateX(-50%)" }}
      >
        {!disabled && (
          <div
            className={cn(
              "absolute w-10 h-10 rounded-full bg-primary transition-opacity duration-medium",
              isHovered || isPressed ? "opacity-10" : "opacity-0",
              isPressed && "opacity-20"
            )}
          />
        )}

        <div
          className={cn(
            "rounded-full transition-all duration-medium ease-emphasized",
            disabled
              ? "bg-on-surface/38 w-3 h-3"
              : "bg-primary size-icon-sm group-active:scale-125"
          )}
        >
          {shouldShowLabel && !disabled && (
            <div
              className={cn(
                "absolute bottom-8 left-1/2 -translate-x-1/2 min-w-7 h-7 px-2",
                "flex items-center justify-center bg-inverse-surface text-inverse-on-surface text-label-small font-medium rounded-sm shadow-2",
                "transition-all duration-medium ease-emphasized origin-bottom",
                isHovered || isPressed
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-50 translate-y-2"
              )}
            >
              {val}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-inverse-surface rotate-45 rounded-[calc(var(--unit)/4)]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
