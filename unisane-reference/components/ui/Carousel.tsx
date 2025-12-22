import React, { useRef, useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { IconButton } from './IconButton';
import { Icon } from './Icon';

interface CarouselProps {
  children: React.ReactNode;
  className?: string;
  itemClassName?: string;
  showControls?: boolean;
}

export const Carousel: React.FC<CarouselProps> = ({ 
  children, 
  className, 
  itemClassName,
  showControls = true 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10); // Tolerance
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className={cn("relative group", className)}>
      {/* Scroll Container */}
      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex overflow-x-auto snap-x snap-mandatory gap-4u pb-4u px-1u no-scrollbar scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {React.Children.map(children, (child) => (
          <div className={cn("flex-shrink-0 snap-center", itemClassName)}>
            {child}
          </div>
        ))}
      </div>

      {/* Controls - Hidden on mobile, visible on sm+ */}
      {showControls && (
        <>
          <div className={cn(
              "absolute top-1/2 -translate-y-1/2 left-2u z-10 transition-opacity duration-200 hidden sm:block",
              canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"
          )}>
            <IconButton 
                variant="filled" 
                className="bg-surface/80 backdrop-blur-sm shadow-1 hover:shadow-2"
                onClick={() => scroll('left')}
                aria-label="Scroll left"
            >
              <Icon viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></Icon>
            </IconButton>
          </div>

          <div className={cn(
              "absolute top-1/2 -translate-y-1/2 right-2u z-10 transition-opacity duration-200 hidden sm:block",
              canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"
          )}>
             <IconButton 
                variant="filled" 
                className="bg-surface/80 backdrop-blur-sm shadow-1 hover:shadow-2"
                onClick={() => scroll('right')}
                aria-label="Scroll right"
            >
              <Icon viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></Icon>
            </IconButton>
          </div>
        </>
      )}
    </div>
  );
};