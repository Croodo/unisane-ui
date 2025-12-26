import React, { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  showValue?: boolean;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ label, showValue = false, min = 0, max = 100, value, className = "", ...props }, ref) => {
    const percentage = ((Number(value) - Number(min)) / (Number(max) - Number(min))) * 100;

    return (
      <div className="w-full">
        {(label || showValue) && (
          <div className="flex justify-between items-center mb-2u">
            {label && (
              <label className="text-body-small font-medium text-on-surface-variant">
                {label}
              </label>
            )}
            {showValue && (
              <span className="text-body-small text-on-surface-variant">
                {value}
              </span>
            )}
          </div>
        )}

        <div className="relative h-11u flex items-center">
          <input
            ref={ref}
            type="range"
            min={min}
            max={max}
            value={value}
            className={cn(
              "w-full h-1u appearance-none bg-transparent cursor-pointer focus:outline-none disabled:opacity-38 disabled:cursor-not-allowed",
              "[&::-webkit-slider-track]:h-1u [&::-webkit-slider-track]:bg-primary-container [&::-webkit-slider-track]:rounded-full",
              "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5u [&::-webkit-slider-thumb]:h-5u [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-1 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110",
              "[&::-moz-range-track]:h-1u [&::-moz-range-track]:bg-primary-container [&::-moz-range-track]:rounded-full",
              "[&::-moz-range-thumb]:w-5u [&::-moz-range-thumb]:h-5u [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-1",
              className
            )}
            style={{
              background: `linear-gradient(to right, var(--uni-sys-color-primary) 0%, var(--uni-sys-color-primary) ${percentage}%, var(--uni-sys-color-primary-container) ${percentage}%, var(--uni-sys-color-primary-container) 100%)`,
            }}
            {...props}
          />
        </div>
      </div>
    );
  }
);

Slider.displayName = "Slider";