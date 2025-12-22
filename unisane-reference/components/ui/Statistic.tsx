import React from 'react';
import { cn } from '../../lib/utils';
import { Typography } from './Typography';
import { Icon } from './Icon';

interface StatisticProps {
  label: string;
  value: string | number;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  icon?: string;
  className?: string;
  variant?: 'outlined' | 'filled' | 'low';
}

export const Statistic: React.FC<StatisticProps> = ({ 
  label, 
  value, 
  trend, 
  icon, 
  className,
  variant = 'outlined'
}) => {
  const isUp = trend?.direction === 'up';
  const isDown = trend?.direction === 'down';

  return (
    <div className={cn(
      "relative p-6u flex flex-col rounded-xs transition-all duration-standard group overflow-hidden",
      variant === 'outlined' && "bg-white border border-stone-200 hover:border-primary/40 shadow-sm hover:shadow-md",
      variant === 'filled' && "bg-stone-900 text-white border-none shadow-3",
      variant === 'low' && "bg-stone-50 border-none",
      className
    )}>
      <Typography variant="labelSmall" className={cn(
        "font-black uppercase tracking-[0.25em] text-[9px] mb-2 relative z-10",
        variant === 'filled' ? "text-stone-500" : "text-stone-400"
      )}>
        {label}
      </Typography>

      <div className="flex items-baseline gap-2u relative z-10">
        <Typography variant="headlineMedium" className={cn(
          "font-black tabular-nums tracking-tighter leading-none break-all",
          variant === 'filled' ? "text-primary-container" : "text-stone-900"
        )}>
          {value}
        </Typography>
        
        {trend && (
          <div className={cn(
            "flex items-center gap-0.5u text-[10px] font-black uppercase tracking-tight",
            isUp && "text-emerald-500",
            isDown && "text-rose-500",
            !isUp && !isDown && "text-stone-400"
          )}>
            <Icon symbol={isUp ? 'trending_up' : isDown ? 'trending_down' : 'horizontal_rule'} size={14} />
            <span>{trend.value}</span>
          </div>
        )}
      </div>

      {trend?.label && (
        <span className="text-[9px] font-bold text-stone-400 uppercase mt-2 tracking-tight relative z-10">
          {trend.label}
        </span>
      )}

      {icon && (
        <Icon 
          symbol={icon} 
          className={cn(
            "absolute -right-4 -bottom-4 opacity-5 transition-all duration-700 pointer-events-none group-hover:scale-110 group-hover:rotate-6",
            variant === 'filled' ? "text-white" : "text-stone-900"
          )} 
          size={100} 
        />
      )}
    </div>
  );
};