import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'text';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  variant = 'rectangular', 
  width, 
  height, 
  className, 
  style, 
  ...props 
}) => {
  return (
    <div
      className={cn(
        "animate-pulse bg-surface-container-highest", 
        variant === 'circular' ? "rounded-full" : "rounded-none",
        variant === 'text' && "h-3u mb-2u w-3/4",
        className
      )}
      style={{ width, height, ...style }}
      {...props}
    />
  );
};