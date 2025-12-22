import React, { useState, useRef } from 'react';
import { cn } from '../../lib/utils';

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  withLabel?: boolean;
  withTicks?: boolean;
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

  const ticks = [];
  if (withTicks && step > 0) {
      const count = Math.floor((max - min) / step);
      if (count < 50) {
          for (let i = 0; i <= count; i++) {
              ticks.push((i / count) * 100);
          }
      }
  }

  return (
    <div 
        className={cn("relative flex items-center h-10u w-full group touch-none select-none", className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
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
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30 disabled:cursor-not-allowed"
        {...props}
      />

      <div className="relative w-full h-1u rounded-full flex items-center">
          <div className={cn(
              "absolute w-full h-full rounded-full transition-colors",
              disabled ? "bg-on-surface/12" : "bg-surface-container-highest"
          )} />

          <div 
            className={cn(
                "absolute h-full rounded-full transition-all duration-snappy",
                disabled ? "bg-on-surface/38" : "bg-primary"
            )}
            style={{ width: `${percentage}%` }}
          />
          
          {withTicks && ticks.map((tick, i) => (
             <div 
                key={i}
                className={cn(
                    "absolute w-0.5u h-0.5u rounded-full z-10",
                    tick <= percentage ? "bg-on-primary/60" : "bg-on-surface-variant/40"
                )}
                style={{ left: `${tick}%` }}
             />
          ))}
      </div>

      <div 
        className="absolute h-full flex items-center justify-center pointer-events-none z-20"
        style={{ left: `${percentage}%`, transform: 'translateX(-50%)' }}
      >
          {!disabled && (
              <div className={cn(
                  "absolute w-10u h-10u rounded-full bg-primary transition-opacity duration-standard",
                  (isHovered || isPressed) ? "opacity-10" : "opacity-0",
                  isPressed && "opacity-20"
              )} />
          )}

          <div className={cn(
              "rounded-full shadow-1 transition-all duration-standard ease-emphasized",
              disabled ? "bg-on-surface/38 w-3u h-3u shadow-none" : "bg-primary w-5u h-5u group-active:scale-125"
          )}>
               {withLabel && !disabled && (
                   <div className={cn(
                       "absolute bottom-8u left-1/2 -translate-x-1/2 min-w-7u h-7u px-2u",
                       "flex items-center justify-center bg-inverse-surface text-inverse-on-surface text-[10px] font-black rounded-full shadow-2",
                       "transition-all duration-standard ease-emphasized origin-bottom",
                       (isHovered || isPressed) ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-50 translate-y-2u"
                   )}>
                       {val}
                       <div className="absolute -bottom-1u left-1/2 -translate-x-1/2 w-2u h-2u bg-inverse-surface rotate-45 rounded-[1px]" />
                   </div>
               )}
          </div>
      </div>
    </div>
  );
};