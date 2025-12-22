import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Icon } from './Icon';

interface RatingProps {
  max?: number;
  value?: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  className?: string;
}

export const Rating: React.FC<RatingProps> = ({ 
  max = 5, 
  value = 0, 
  onChange, 
  readOnly = false,
  className 
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: max }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= displayValue;
        
        return (
          <button
            key={i}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(starValue)}
            onMouseEnter={() => !readOnly && setHoverValue(starValue)}
            onMouseLeave={() => !readOnly && setHoverValue(null)}
            className={cn(
              "text-2xl transition-transform duration-100 p-0.5",
              readOnly ? "cursor-default" : "cursor-pointer hover:scale-110",
              isFilled ? "text-primary" : "text-surface-variant"
            )}
          >
             <Icon 
                viewBox="0 0 24 24" 
                className={cn("w-6 h-6", isFilled ? "fill-current" : "fill-none stroke-current")}
                strokeWidth={isFilled ? 0 : 2}
             >
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
             </Icon>
          </button>
        );
      })}
    </div>
  );
};