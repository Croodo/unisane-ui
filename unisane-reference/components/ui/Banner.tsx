import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';
import { Typography } from './Typography';

interface BannerProps {
  icon?: React.ReactNode;
  children: React.ReactNode;
  actions: React.ReactNode; 
  className?: string;
  variant?: 'centered' | 'fixed';
}

export const Banner: React.FC<BannerProps> = ({ icon, children, actions, className, variant = 'centered' }) => {
  return (
    <div 
      role="banner"
      className={cn(
        "w-full flex flex-col md:flex-row gap-6u p-6u bg-surface-container-low text-on-surface transition-all border-l-4 border-primary shadow-sm",
        variant === 'centered' ? "rounded-xs border border-y border-r border-outline-variant" : "border-b border-outline-variant",
        className
      )}
    >
      <div className="flex gap-4u flex-1 items-start">
        {icon && (
          <div className="text-primary mt-0.5u shrink-0">
            {icon}
          </div>
        )}
        <div className="text-[13px] font-bold uppercase tracking-tight leading-relaxed py-0.5u text-on-surface-variant">
          {children}
        </div>
      </div>
      
      <div className="flex items-center justify-end gap-2u shrink-0 self-end md:self-center">
        {actions}
      </div>
    </div>
  );
};