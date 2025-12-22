import React from 'react';
import { cn } from '../../lib/utils';

interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({ children, max = 4, className, size = 'md' }) => {
  const childrenArray = React.Children.toArray(children);
  const visibleAvatars = childrenArray.slice(0, max);
  const remaining = childrenArray.length - max;

  const sizeMap = {
    sm: "-space-x-1.5u",
    md: "-space-x-2.5u",
    lg: "-space-x-4u"
  };

  return (
    <div className={cn("flex items-center", sizeMap[size], className)}>
      {visibleAvatars.map((child, i) => (
        <div 
            key={i} 
            className="ring-2 ring-surface rounded-xs overflow-hidden relative z-10"
            style={{ zIndex: visibleAvatars.length - i }}
        >
          {child}
        </div>
      ))}
      {remaining > 0 && (
        <div className={cn(
            "flex items-center justify-center bg-on-surface text-surface font-black uppercase ring-2 ring-surface rounded-xs relative z-0",
            size === 'sm' ? "w-8u h-8u text-[8px]" : size === 'md' ? "w-11u h-11u text-[10px]" : "w-16u h-16u text-[12px]"
        )}>
          +{remaining}
        </div>
      )}
    </div>
  );
};