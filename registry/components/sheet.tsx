import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Ripple } from './ripple';
import { cn } from '@/lib/utils';

export type SheetSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  footerLeft?: React.ReactNode;
  footerRight?: React.ReactNode;
  className?: string;
  size?: SheetSize;
}

export function Sheet({
  open,
  onClose,
  title,
  children,
  icon,
  footerLeft,
  footerRight,
  className,
  size = 'md'
}: SheetProps) {
  const [shouldRender, setShouldRender] = useState(open);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<number | null>(null);

  const OPEN_DURATION = 600; 
  const CLOSE_DURATION = 250; 

  useEffect(() => {
    if (open) {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      setShouldRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      timerRef.current = window.setTimeout(() => {
        setShouldRender(false);
        document.body.style.overflow = '';
      }, CLOSE_DURATION);
    }
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [open]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        event.preventDefault();
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!shouldRender) return null;
  if (typeof document === "undefined") return null;

  const sizeClasses = {
    sm: "max-w-[calc(var(--unit)*100)]",
    md: "max-w-[calc(var(--unit)*150)]",
    lg: "max-w-[calc(var(--unit)*210)]",
    xl: "max-w-[calc(var(--unit)*280)]",
    full: "max-w-[calc(100vw-(var(--unit)*14))]"
  };

  return createPortal(
    <div className="fixed inset-0 z-modal flex justify-end overflow-hidden" role="presentation">
      <div 
        className={cn(
          "absolute inset-0 bg-scrim/30 backdrop-blur-[calc(var(--unit)/2)] transition-opacity",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        style={{ 
          transitionDuration: `${isVisible ? OPEN_DURATION : CLOSE_DURATION}ms`,
          transitionTimingFunction: isVisible ? 'cubic-bezier(0.05, 0.7, 0.1, 1.0)' : 'cubic-bezier(0.3, 0, 1, 1)'
        }}
        onClick={onClose}
        aria-hidden="true"
      />
      
      <div 
        className={cn(
          "relative w-full h-full bg-surface shadow-5 flex flex-col border-l border-outline-variant transition-all transform-gpu",
          sizeClasses[size],
          isVisible ? "translate-x-0 opacity-100 scale-100" : "translate-x-full opacity-0 scale-[0.98]",
          className
        )}
        style={{ 
          transitionDuration: `${isVisible ? OPEN_DURATION : CLOSE_DURATION}ms`,
          transitionTimingFunction: isVisible ? 'cubic-bezier(0.05, 0.7, 0.1, 1.0)' : 'cubic-bezier(0.3, 0, 1, 1)'
        }}
        role="dialog"
        aria-modal="true"
      >
        <header className="px-6u py-4u border-b border-outline-variant flex items-center justify-between bg-surface shrink-0 z-20">
          <div className="flex items-center gap-3u">
            {icon && (
               <div className="w-10u h-10u rounded-xs bg-inverse-surface text-inverse-on-surface flex items-center justify-center shrink-0 shadow-1 transition-all duration-short ease-standard">
                  {icon}
               </div>
            )}
            <div className="flex flex-col">
              <h2 className="text-title-medium font-black text-on-surface uppercase tracking-tight leading-none">
                {title}
              </h2>
              <div className="text-on-surface-variant font-bold uppercase tracking-widest text-label-small mt-1u flex items-center gap-1.5u">
                <span className="w-1u h-1u rounded-full bg-primary animate-pulse" />
                Active Instance
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10u h-10u rounded-xs flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all relative overflow-hidden"
            aria-label="Close sheet"
          >
            <Ripple />
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 bg-surface">
          {children}
        </div>

        {(footerLeft || footerRight) && (
          <footer className="px-6u py-4u border-t border-outline-variant bg-surface-container-low shrink-0 z-20 shadow-2">
            <div className="flex flex-col medium:flex-row items-center justify-between gap-4u">
               <div className="flex-1 min-w-0 w-full medium:w-auto">
                  {footerLeft}
               </div>
               <div className="flex items-center gap-2u shrink-0 w-full medium:w-auto justify-end">
                  {footerRight}
               </div>
            </div>
          </footer>
        )}
      </div>
    </div>,
    document.body
  );
}
