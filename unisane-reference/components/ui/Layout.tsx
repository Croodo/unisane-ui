import React from 'react';
import { cn } from '../../lib/utils';

// Material 3 Layout Grid with Container Query Support
interface GridProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export const Grid: React.FC<GridProps> = ({ children, className, as: Component = 'div' }) => {
  return (
    <Component 
      className={cn(
        "grid grid-cols-4 @md:grid-cols-12 w-full mx-auto", 
        "gap-x-4u gap-y-4u @md:gap-x-6u @md:gap-y-6u", 
        "px-4u @md:px-6u max-w-[1600px] @container",
        className
      )}
    >
      {children}
    </Component>
  );
};

interface GridColProps {
  children?: React.ReactNode;
  span?: number; 
  spanMd?: number; 
  spanLg?: number; 
  className?: string;
}

export const GridCol: React.FC<GridColProps> = ({ 
  children, 
  span = 4, 
  spanMd, 
  spanLg, 
  className 
}) => {
  return (
    <div 
      className={cn(
        `col-span-${span}`,
        spanMd && `@md:col-span-${spanMd}`,
        spanLg && `@lg:col-span-${spanLg}`,
        className
      )}
    >
      {children}
    </div>
  );
};

export const Section: React.FC<{ title: string; description?: string; children: React.ReactNode; className?: string }> = ({ 
  title, 
  description, 
  children, 
  className 
}) => (
  <div className={cn("flex flex-col gap-6u py-12u @container", className)}>
    <div className="flex flex-col gap-2u mb-4u px-4u @md:px-6u max-w-[1600px] mx-auto w-full">
      <h2 className="text-[28px] leading-9 text-on-surface font-normal">{title}</h2>
      {description && <p className="text-body-large text-on-surface-variant max-w-3xl">{description}</p>}
    </div>
    {children}
  </div>
);