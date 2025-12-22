import React, { useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Chip } from './Chip';

interface SubNavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface ContextualSubNavProps {
  items: SubNavItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export const ContextualSubNav: React.FC<ContextualSubNavProps> = ({
  items,
  activeId,
  onChange,
  className
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Manual scroll centering to avoid "layout shift" caused by native scrollIntoView
  useEffect(() => {
    if (!scrollRef.current) return;

    const container = scrollRef.current;
    const activeElement = container.querySelector(`[data-active="true"]`) as HTMLElement;

    if (activeElement) {
      const containerWidth = container.offsetWidth;
      const elementOffset = activeElement.offsetLeft;
      const elementWidth = activeElement.offsetWidth;

      // Calculate the scroll position to center the chip
      const scrollTarget = elementOffset - (containerWidth / 2) + (elementWidth / 2);

      container.scrollTo({
        left: scrollTarget,
        behavior: 'smooth'
      });
    }
  }, [activeId]);

  if (items.length <= 1) return null;

  return (
    <div className={cn(
      "w-full lg:hidden flex flex-col gap-1.5u pb-2u px-4u",
      className
    )}>
      <div 
        ref={scrollRef}
        className="flex items-center gap-2u overflow-x-auto no-scrollbar -mx-4u px-4u scroll-smooth"
      >
        {items.map((item) => (
          <Chip
            key={item.id}
            label={item.label}
            icon={item.icon}
            variant="filter"
            selected={activeId === item.id}
            data-active={activeId === item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              "h-8u shrink-0 text-[10px] font-black uppercase rounded-xs transition-all border-outline-variant",
              activeId === item.id 
                ? "bg-primary text-on-primary border-primary shadow-sm" 
                : "bg-surface text-on-surface-variant hover:border-outline"
            )}
          />
        ))}
      </div>
    </div>
  );
};