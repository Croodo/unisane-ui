import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  open,
  onClose,
  children,
  title,
  className,
}) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      // Basic escape key handling
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      }
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [open, onClose]);

  if (!open) return null;

  const content = (
    <div className="fixed inset-0 z-[3000] flex justify-center items-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-scrim/50 backdrop-blur-[2px] animate-in fade-in duration-400 ease-standard"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Surface */}
      <div 
        className={cn(
          "relative w-full max-w-[640px] bg-surface rounded-t-xl shadow-1 p-6u pb-8u flex flex-col gap-4u animate-in slide-in-from-bottom-full duration-500 ease-emphasized-decelerate",
          "mx-auto border-x border-t border-outline-variant", 
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Drag Handle */}
        <div className="w-8u h-1u bg-outline-variant rounded-full mx-auto mb-2u" />
        
        {title && (
             <div className="text-on-surface text-lg font-black uppercase text-center pb-4u border-b border-outline-variant">
                {title}
             </div>
        )}

        <div className="overflow-y-auto max-h-[70vh] no-scrollbar">
            {children}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};