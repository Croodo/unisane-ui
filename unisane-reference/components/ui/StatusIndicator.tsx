import React from 'react';
import { cn } from '../../lib/utils';

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'busy' | 'syncing';
  label?: string;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, label, className }) => {
  const colors = {
    online: 'bg-emerald-500',
    offline: 'bg-outline-variant',
    busy: 'bg-error',
    syncing: 'bg-primary animate-pulse'
  };

  return (
    <div className={cn("inline-flex items-center gap-2u", className)}>
      <div className="relative flex items-center justify-center">
        {status === 'online' && (
            <div className="absolute inset-0 rounded-full bg-emerald-500/40 animate-ping" />
        )}
        <div className={cn("w-2u h-2u rounded-full relative z-10", colors[status])} />
      </div>
      {label && (
        <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
            {label}
        </span>
      )}
    </div>
  );
};