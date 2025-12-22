import React, { useRef } from 'react';
import { cn } from '../../lib/utils';
import { Icon } from './Icon';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  label,
  className,
  disabled,
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const increment = () => {
    if (disabled) return;
    const newValue = Math.min(value + step, max);
    onChange(newValue);
  };

  const decrement = () => {
    if (disabled) return;
    const newValue = Math.max(value - step, min);
    onChange(newValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
        onChange(val);
    }
  };

  return (
    <div className={cn("inline-flex flex-col gap-1.5u", className)}>
      {label && <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">{label}</span>}
      <div className={cn(
          "flex items-center border border-outline-variant rounded-xs bg-surface overflow-hidden transition-all h-10u w-fit",
          "focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20",
          disabled && "opacity-50 cursor-not-allowed bg-surface-container-low"
      )}>
        <button
            type="button"
            onClick={decrement}
            disabled={disabled || value <= min}
            className="w-10u h-full flex items-center justify-center hover:bg-surface-container-high active:bg-surface-container-highest border-r border-outline-variant text-on-surface-variant disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
            <Icon symbol="remove" size={16} strokeWidth={2} />
        </button>
        
        <input
            ref={inputRef}
            type="number"
            value={value}
            onChange={handleChange}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className="w-16u h-full text-center text-sm font-black text-on-surface border-none outline-none focus:ring-0 tabular-nums bg-transparent appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            {...props}
        />

        <button
            type="button"
            onClick={increment}
            disabled={disabled || value >= max}
            className="w-10u h-full flex items-center justify-center hover:bg-surface-container-high active:bg-surface-container-highest border-l border-outline-variant text-on-surface-variant disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
            <Icon symbol="add" size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};