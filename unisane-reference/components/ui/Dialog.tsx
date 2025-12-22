import React, { useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { Typography } from './Typography';
import { cn } from '../../lib/utils';
import { Ripple } from './Ripple';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  contentClassName?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  icon,
  contentClassName
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      const timer = setTimeout(() => {
        dialogRef.current?.focus();
      }, 50);
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleKeyDown);
        previousActiveElement.current?.focus();
      };
    }
  }, [open, onClose]);

  if (!open) return null;

  const content = (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-6u sm:p-10u" role="presentation">
      <div className="absolute inset-0 bg-scrim backdrop-blur-[2px] transition-opacity animate-in fade-in duration-standard" onClick={onClose} aria-hidden="true" />
      <div 
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className={cn(
          "relative bg-surface rounded-sm outline-none border border-outline-variant/30", 
          "w-full min-w-[280px] max-w-[312px] md:max-w-[680px] shadow-4 flex flex-col",
          "animate-in fade-in zoom-in-95 duration-standard ease-emphasized overflow-hidden"
        )}
      >
        <div className="px-8u py-6u border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low/50">
            <div className="flex items-center gap-4u">
                {icon && <div className="text-primary flex items-center justify-center" aria-hidden="true">{icon}</div>}
                <Typography variant="titleMedium" id={titleId} className="font-black text-on-surface uppercase tracking-tight leading-none pt-0.5u">
                    {title}
                </Typography>
            </div>
            <button 
              onClick={onClose} 
              className="w-10u h-10u rounded-xs flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-all relative overflow-hidden"
            >
                <Ripple />
                <span className="material-symbols-outlined text-[20px] relative z-10">close</span>
            </button>
        </div>

        <div className={cn("flex-1 overflow-y-auto max-h-[75vh]", contentClassName)}>
             <div className="text-on-surface p-8u">
                {children}
             </div>
        </div>

        {actions && (
          <div className="flex flex-col sm:flex-row justify-end gap-3u w-full p-6u border-t border-outline-variant/10 bg-surface-container-low/30">
            {actions}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};