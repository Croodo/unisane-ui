import React from 'react';
import { cn } from '../../lib/utils';
import { Typography } from './Typography';

interface DescriptionListProps {
  children: React.ReactNode;
  className?: string;
  density?: 'default' | 'high';
}

export const DescriptionList: React.FC<DescriptionListProps> = ({ children, className, density = 'default' }) => {
  return (
    <dl className={cn(
      "grid grid-cols-1 gap-y-2u",
      density === 'high' ? "gap-y-1u" : "gap-y-3u",
      className
    )}>
      {children}
    </dl>
  );
};

export const DescriptionItem: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({ label, value, className }) => (
  <div className={cn("flex justify-between items-baseline gap-4u border-b border-stone-50 pb-1.5u last:border-0", className)}>
    <dt className="text-[10px] font-black text-stone-400 uppercase tracking-widest shrink-0 uppercase leading-none">
      {label}
    </dt>
    <dd className="text-right text-[13px] font-bold text-stone-900 truncate uppercase tracking-tight leading-none pt-0.5u">
      {value}
    </dd>
  </div>
);