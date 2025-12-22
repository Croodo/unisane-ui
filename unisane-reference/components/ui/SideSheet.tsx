import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Typography } from './Typography';
import { cn } from '../../lib/utils';
import { IconButton } from './IconButton';

interface SideSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const SideSheet: React.FC<SideSheetProps> = ({
  open,
  onClose,
  title,
  children,
  icon,
  footer,
  className
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [open, onClose]);

  if (!open) return null;

  const content = (
    <div className="fixed inset-0 z-[2000] flex justify-end" role="presentation">
      {/* Scrim */}
      <div 
        className="absolute inset-0 bg-scrim/20 backdrop-blur-[1px] animate-in fade-in duration-300"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Sheet Surface */}
      <div 
        ref={sheetRef}
        className={cn(
          "relative w-full max-w-[520px] h-full bg-surface shadow-5 flex flex-col border-l border-outline-variant",
          "animate-in slide-in-from-right duration-500 ease-emphasized",
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Sticky Header */}
        <header className="px-6u py-4u border-b border-outline-variant flex items-center justify-between bg-surface-container-low shrink-0">
          <div className="flex items-center gap-3u">
            {icon && <div className="text-primary flex items-center justify-center shrink-0">{icon}</div>}
            <Typography variant="titleMedium" className="font-black text-on-surface uppercase tracking-tight truncate">
              {title}
            </Typography>
          </div>
          <IconButton onClick={onClose} className="hover:bg-surface-container-high rounded-xs">
            <span className="material-symbols-outlined">close</span>
          </IconButton>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-surface">
          {children}
        </div>

        {/* Sticky Footer */}
        {footer && (
          <footer className="p-6u border-t border-outline-variant bg-surface-container-low shrink-0">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};