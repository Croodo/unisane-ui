import React from 'react';
import { cn } from '../../lib/utils';

interface IconProps extends React.HTMLAttributes<HTMLElement> {
  size?: number | string;
  filled?: boolean;
  symbol?: string; 
  viewBox?: string;
  strokeWidth?: string | number;
}

export const Icon: React.FC<IconProps> = ({ 
  size = 24, 
  filled = false, 
  symbol, 
  className, 
  children, 
  style,
  viewBox = "0 0 24 24",
  ...props 
}) => {
  const isSymbol = !!symbol;

  // If size is a number, we treat it as pixels. If it's a string, we treat it as a CSS value (e.g. 1.5rem).
  const finalSize = typeof size === 'number' ? `${size}px` : size;

  if (isSymbol) {
    return (
      <span
        className={cn(
          "material-symbols-outlined select-none inline-flex items-center justify-center align-middle flex-shrink-0 transition-[font-variation-settings,color] duration-standard ease-standard", 
          className
        )}
        style={{
          fontSize: finalSize,
          width: finalSize,
          height: finalSize,
          fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
          ...style
        }}
        {...props}
      >
        {symbol}
      </span>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={finalSize}
      height={finalSize}
      viewBox={viewBox}
      fill="currentColor"
      className={cn("inline-block flex-shrink-0 transition-colors duration-standard ease-standard", className)}
      style={style}
      {...props as any}
    >
      {children}
    </svg>
  );
};