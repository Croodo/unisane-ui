
import React, { useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Ripple } from './Ripple';
import { Icon } from './Icon';

interface SelectionProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
}

interface CheckboxProps extends SelectionProps {
  indeterminate?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({ 
  label, 
  className, 
  indeterminate, 
  error,
  disabled,
  ...props 
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = !!indeterminate;
    }
  }, [indeterminate]);

  return (
    <label className={cn(
        "inline-flex items-center gap-3u cursor-pointer group select-none relative", 
        disabled && "cursor-not-allowed opacity-40 pointer-events-none",
        className
    )}>
      <div className="relative flex items-center justify-center w-10u h-10u">
        {/* Ripple Container */}
        <div className={cn(
            "absolute inset-0 rounded-full transition-colors z-0 overflow-hidden",
            "group-hover:bg-on-surface/5",
            error && "group-hover:bg-error/5"
        )}>
           <Ripple center disabled={disabled} className={cn(error ? "text-error" : "text-primary")} />
        </div>
        
        <input 
          ref={inputRef}
          type="checkbox" 
          className="peer sr-only" 
          disabled={disabled}
          {...props} 
        />

        {/* Checkbox Box - Changed default border to border-outline for visibility */}
        <div className={cn(
            "relative z-10 w-4.5u h-4.5u rounded-xs border-2 transition-all duration-snappy ease-emphasized flex items-center justify-center pointer-events-none overflow-hidden bg-surface",
            !error && "border-outline group-hover:border-on-surface",
            error && "border-error",
            
            // Checked State
            !error && "peer-checked:bg-primary peer-checked:border-primary",
            error && "peer-checked:bg-error peer-checked:border-error",
            
            // Indeterminate State
            !error && "peer-indeterminate:bg-primary peer-indeterminate:border-primary",
            error && "peer-indeterminate:bg-error peer-indeterminate:border-error",
        )}>
          {/* Check Icon */}
          <svg viewBox="0 0 24 24" className={cn("absolute inset-0 w-full h-full p-0.5 transition-transform duration-snappy opacity-0 scale-50 peer-checked:opacity-100 peer-checked:scale-100", error ? "text-on-error" : "text-on-primary")} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {/* Minus Icon */}
          <svg viewBox="0 0 24 24" className={cn("absolute inset-0 w-full h-full p-0.5 transition-transform duration-snappy opacity-0 scale-50 rotate-90 peer-indeterminate:opacity-100 peer-indeterminate:scale-100 peer-indeterminate:rotate-0", error ? "text-on-error" : "text-on-primary")} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
      </div>
      {label && <span className="text-on-surface text-[13px] font-bold tracking-tight select-none leading-none pt-0.5u">{label}</span>}
    </label>
  );
};

export const Radio: React.FC<SelectionProps> = ({ label, className, disabled, error, ...props }) => {
  return (
    <label className={cn(
        "inline-flex items-center gap-3u cursor-pointer group select-none relative", 
        disabled && "cursor-not-allowed opacity-40 pointer-events-none",
        className
    )}>
      <div className="relative flex items-center justify-center w-10u h-10u">
        <div className={cn(
            "absolute inset-0 rounded-full transition-colors z-0 overflow-hidden",
             "group-hover:bg-on-surface/5",
             error && "group-hover:bg-error/5"
        )}>
             <Ripple center disabled={disabled} className={cn(error ? "text-error" : "text-primary")} />
        </div>
        <input type="radio" className="peer sr-only" disabled={disabled} {...props} />
        {/* Radio Circle - Changed default border to border-outline for visibility */}
        <div className={cn(
            "relative z-10 w-5u h-5u rounded-full border-2 transition-colors duration-snappy ease-emphasized flex items-center justify-center bg-surface",
             !error && "border-outline group-hover:border-on-surface peer-checked:border-primary",
             error && "border-error peer-checked:border-error"
        )}>
            <div className={cn(
                "w-2.5u h-2.5u rounded-full transition-transform duration-snappy ease-emphasized scale-0 peer-checked:scale-100",
                !error && "bg-primary",
                error && "bg-error"
            )} />
        </div>
      </div>
      {label && <span className="text-on-surface text-[13px] font-bold tracking-tight select-none leading-none pt-0.5u">{label}</span>}
    </label>
  );
};

export const Switch: React.FC<SelectionProps & { icons?: boolean }> = ({ label, className, disabled, icons = false, ...props }) => {
  return (
    <label className={cn(
        "inline-flex items-center gap-3u cursor-pointer select-none group relative min-h-[32px]", 
        disabled && "opacity-40 cursor-not-allowed pointer-events-none", 
        className
    )}>
      <div className="relative w-13u h-8u flex-shrink-0">
        <input type="checkbox" role="switch" className="peer sr-only" disabled={disabled} {...props} />
        
        {/* Track */}
        <div className={cn(
          "absolute inset-0 rounded-full transition-colors duration-standard ease-standard border-2",
          "border-outline bg-surface-container-highest",
          "peer-checked:bg-primary peer-checked:border-primary",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30"
        )} />
        
        {/* Thumb */}
        <div className={cn(
          "absolute top-1/2 -translate-y-1/2 rounded-full shadow-1 transition-all duration-emphasized flex items-center justify-center z-10",
          "w-4u h-4u", // Initial unchecked size
          "left-1u bg-outline group-hover:bg-on-surface-variant", // Unchecked colors
          
          // Checked State Transformations
          "peer-checked:translate-x-5u peer-checked:bg-on-primary peer-checked:w-6u peer-checked:h-6u",
          
          // Active Press State
          "group-active:w-7u group-active:translate-x-0 peer-checked:group-active:translate-x-4u"
        )}>
             {icons && (
                 <>
                    <Icon symbol="check" className="w-4u h-4u text-primary opacity-0 peer-checked:opacity-100 transition-opacity absolute duration-snappy" />
                    <Icon symbol="close" className="w-3u h-3u text-surface-container opacity-100 peer-checked:opacity-0 transition-opacity absolute duration-snappy" />
                 </>
             )}
        </div>
      </div>
      {label && <span className="text-on-surface text-[13px] font-bold tracking-tight leading-none pt-0.5u">{label}</span>}
    </label>
  );
};
