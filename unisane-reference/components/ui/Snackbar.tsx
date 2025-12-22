import React, { useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

interface SnackbarProps {
  open: boolean;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
  autoHideDuration?: number;
  className?: string;
  withCloseIcon?: boolean;
}

export const Snackbar: React.FC<SnackbarProps> = ({
  open,
  message,
  actionLabel,
  onAction,
  onClose,
  autoHideDuration = 5000,
  className,
  withCloseIcon = false,
}) => {
  useEffect(() => {
    if (open && autoHideDuration > 0) {
      const timer = setTimeout(onClose, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [open, autoHideDuration, onClose]);

  if (!open) return null;

  return (
    <div className="fixed bottom-6u left-6u right-6u md:left-auto md:right-8u md:min-w-[344px] z-[5000] flex justify-center pointer-events-none">
      <div 
        className={cn(
          "pointer-events-auto bg-inverse-surface text-inverse-on-surface rounded-xs shadow-4 px-4u py-3u flex items-center gap-4u w-full md:w-auto min-h-12u border border-outline-variant/10",
          "animate-in slide-in-from-bottom-5 fade-in duration-standard ease-emphasized",
          className
        )}
        role="alert"
      >
        <span className="flex-1 text-[13px] font-bold uppercase tracking-tight py-1">{message}</span>
        
        {actionLabel && (
          <Button 
            variant="text" 
            size="sm"
            onClick={onAction}
            className="text-inverse-primary hover:bg-inverse-primary/10 h-8u px-3u font-black"
          >
            {actionLabel}
          </Button>
        )}

        {withCloseIcon && (
           <button 
             onClick={onClose}
             className="p-1u rounded-xs hover:bg-white/10 transition-colors text-inverse-on-surface/50 hover:text-inverse-on-surface"
             aria-label="Close"
           >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
           </button>
        )}
      </div>
    </div>
  );
};