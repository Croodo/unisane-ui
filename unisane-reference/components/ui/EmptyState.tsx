import React from 'react';
import { cn } from '../../lib/utils';
import { Typography } from './Typography';
import { Icon } from './Icon';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon = 'database', title, description, action, className }) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-12u text-center gap-6u animate-in fade-in duration-standard",
      className
    )}>
      <div className="p-10u rounded-full border-2 border-dashed border-stone-100 bg-white/50 text-stone-200 grayscale opacity-40">
        <Icon symbol={icon} size={64} strokeWidth={1} />
      </div>
      
      <div className="flex flex-col gap-1.5u max-w-sm">
        <Typography variant="titleLarge" className="font-black text-stone-300 uppercase tracking-[0.2em] leading-none">
          {title}
        </Typography>
        {description && (
          <Typography variant="bodyMedium" className="text-stone-300 font-bold uppercase text-[10px] tracking-widest opacity-60">
            {description}
          </Typography>
        )}
      </div>

      {action && <div className="mt-2u">{action}</div>}
    </div>
  );
};