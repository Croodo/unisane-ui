import React from 'react';
import { cn } from '../../lib/utils';
import { Typography } from './Typography';
import { Icon } from './Icon';

interface TimelineItemProps {
  title: string;
  time?: string;
  description?: string;
  status?: 'completed' | 'active' | 'pending' | 'error';
  icon?: string;
  isLast?: boolean;
}

export const Timeline: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("flex flex-col", className)}>
    {children}
  </div>
);

export const TimelineItem: React.FC<TimelineItemProps> = ({ title, time, description, status = 'pending', icon, isLast }) => {
  const colors = {
    completed: "bg-primary border-primary text-on-primary",
    active: "bg-primary border-primary text-on-primary shadow-1 animate-pulse",
    pending: "bg-surface border-outline-variant text-on-surface-variant",
    error: "bg-error border-error text-on-error",
  };

  return (
    <div className="flex gap-6u relative">
      {!isLast && (
        <div className="absolute left-[15px] top-8u bottom-0 w-[2px] bg-outline-variant" />
      )}
      
      <div className={cn(
        "w-8u h-8u rounded-xs border-2 flex items-center justify-center shrink-0 z-10 transition-all duration-standard",
        colors[status]
      )}>
        {icon ? <Icon symbol={icon} size={16} /> : (
          status === 'completed' ? <Icon symbol="check" size={16} strokeWidth={4} /> : null
        )}
      </div>

      <div className="flex flex-col pb-8u flex-1">
        <div className="flex justify-between items-baseline gap-4u">
          <Typography variant="labelLarge" className={cn(
            "font-black uppercase tracking-tight leading-none",
            status === 'pending' ? "text-on-surface-variant" : "text-on-surface"
          )}>
            {title}
          </Typography>
          {time && (
            <span className="text-[10px] font-black text-on-surface-variant tabular-nums uppercase whitespace-nowrap">
              {time}
            </span>
          )}
        </div>
        {description && (
          <Typography variant="bodySmall" className="text-on-surface-variant font-bold uppercase mt-1.5u leading-relaxed">
            {description}
          </Typography>
        )}
      </div>
    </div>
  );
};