import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Icon } from './Icon';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  variant?: 'filled' | 'outlined';
  error?: boolean;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  value,
  onChange,
  variant = 'outlined',
  error,
  disabled,
  className,
  labelClassName
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const selectedLabel = options.find(o => o.value === value)?.label || '';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const isFloating = !!value || isOpen;

  return (
    <div 
        ref={containerRef}
        className={cn("relative inline-flex flex-col w-full min-w-[160px]", className)}
    >
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
            "relative flex items-center w-full transition-colors cursor-pointer select-none group h-14u",
            variant === 'outlined' 
                ? "rounded-xs border border-outline-variant bg-surface" 
                : "rounded-t-xs border-b border-outline bg-surface-container-low",
            
            !disabled && !isOpen && (variant === 'outlined' ? "hover:border-outline" : "hover:bg-surface-container hover:border-outline"),
            isOpen && (variant === 'outlined' ? "!border-primary border-2 shadow-sm" : "bg-surface"),
            error && "border-error",
            disabled && "opacity-38 cursor-not-allowed"
        )}
      >
        {variant === 'filled' && (
           <div className={cn(
             "absolute bottom-[-1px] left-0 right-0 h-[2px] scale-x-0 transition-transform duration-snappy ease-out origin-center",
             error ? "bg-error scale-x-100" : "bg-primary",
             isOpen && "scale-x-100"
           )} />
        )}

        <div className="relative w-full h-full flex items-center px-4u">
             <span className={cn(
                 "text-on-surface text-sm font-bold w-full truncate",
                 variant === 'filled' && "pt-5u pb-1u"
             )}>
                {selectedLabel}
             </span>

             <label
                className={cn(
                    "absolute pointer-events-none truncate max-w-[calc(100%-48px)] transition-all duration-snappy ease-emphasized origin-left left-4u",
                    !isFloating && "text-base -translate-y-1/2 top-1/2 text-on-surface-variant",
                    isFloating && [
                        "scale-[0.75] font-black uppercase tracking-widest",
                        variant === 'outlined' && [
                            "top-0 -translate-y-1/2 bg-surface px-1u -ml-1u",
                            labelClassName ? labelClassName : "bg-surface"
                        ],
                        variant === 'filled' && "top-2u -translate-y-0",
                        error ? "text-error" : "text-primary"
                    ],
                    !value && isOpen && "text-primary"
                )}
            >
                {label}
            </label>

            <div className="absolute right-3u text-on-surface-variant">
                <Icon size={20} symbol="keyboard_arrow_down" className={cn("transition-transform duration-snappy", isOpen && "rotate-180")} />
            </div>
        </div>
      </div>

      {isOpen && !disabled && (
          <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-surface border border-outline-variant rounded-xs shadow-3 py-1u max-h-[280px] overflow-y-auto z-[100] animate-in fade-in zoom-in-95 duration-snappy">
              {options.length > 0 ? options.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                        "px-4u h-11u flex items-center text-sm font-bold cursor-pointer transition-colors",
                        option.value === value ? "bg-primary/5 text-primary" : "text-on-surface hover:bg-surface-container-high"
                    )}
                  >
                      {option.label}
                  </div>
              )) : (
                  <div className="px-4u py-3u text-xs text-on-surface-variant font-bold uppercase">No Options Available</div>
              )}
          </div>
      )}
    </div>
  );
};