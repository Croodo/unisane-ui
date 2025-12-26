import React, { useState, useEffect, useRef } from 'react';
import { NavCategory, SubItem } from '../types';
import { NAV_DATA } from '../constants';
import { 
    NavigationDrawerPrimitive, 
    NavigationDrawerItem, 
    NavigationDrawerHeadline 
} from './ui/navigation-drawer';

interface NavigationDrawerProps {
  isOpen: boolean;
  activeCategory: NavCategory | undefined;
  activeSubItemId?: string;
  isOverlay: boolean;
  mobileMode?: boolean; 
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onSelectSubItem: (id: string) => void;
  onSelectCategory?: (id: string) => void;
}

// Helper for Recursive Accordion Logic
const DrawerAccordionItem: React.FC<{ 
    item: SubItem | NavCategory; 
    depth?: number; 
    activeSubItemId?: string;
    isActiveCategory?: boolean;
    onSelect: (id: string) => void;
}> = ({ item, depth = 0, activeSubItemId, isActiveCategory, onSelect }) => {
  const children = (item as NavCategory).items || (item as SubItem).children;
  const hasChildren = children && children.length > 0;
  
  const [isExpanded, setIsExpanded] = useState(false);
  
  useEffect(() => {
     if (hasChildren && children?.some((child: SubItem) => child.id === activeSubItemId || child.children?.some(c => c.id === activeSubItemId))) {
         setIsExpanded(true);
     }
  }, [activeSubItemId, hasChildren, children]);

  useEffect(() => {
    if (depth === 0 && isActiveCategory && hasChildren) {
        setIsExpanded(true);
    }
  }, [isActiveCategory, depth, hasChildren]);

  const isActive = activeSubItemId === item.id || (depth === 0 && isActiveCategory);

  // Section Header
  if ((item as SubItem).isHeader) {
    return <NavigationDrawerHeadline>{item.label}</NavigationDrawerHeadline>;
  }

  const handleClick = () => {
      onSelect(item.id);
      if (hasChildren) {
          setIsExpanded(!isExpanded);
      }
  };

  const badge = (item as NavCategory).badge;
  const icon = (item as NavCategory).icon;

  // Indentation logic for standard M3 drawers
  const paddingClass = depth > 0 ? (depth === 1 ? "ml-3u" : "ml-6u") : "";

  return (
    <div className="flex flex-col w-full">
      <NavigationDrawerItem
        active={isActive}
        onClick={handleClick}
        className={paddingClass}
        icon={depth === 0 && icon ? icon : undefined}
        badge={depth === 0 && badge ? badge : undefined}
      >
        <span className="flex items-center justify-between w-full">
            <span>{item.label}</span>
            {hasChildren && (
                <span className="material-symbols-outlined !text-[20px] text-on-surface-variant transition-transform duration-short" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    expand_more
                </span>
            )}
        </span>
      </NavigationDrawerItem>

      <div 
        className={`
          overflow-hidden transition-[max-height,opacity] duration-emphasized ease-emphasized
          ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        {children?.map((child: any) => (
          <DrawerAccordionItem 
            key={child.id} 
            item={child} 
            depth={depth + 1} 
            activeSubItemId={activeSubItemId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
};

const NavigationDrawer: React.FC<NavigationDrawerProps> = ({ 
    isOpen, 
    activeCategory, 
    activeSubItemId,
    isOverlay,
    mobileMode = false,
    onMouseEnter,
    onMouseLeave,
    onSelectSubItem,
    onSelectCategory
}) => {
  const scrollContainerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [activeCategory?.id, mobileMode]);

  return (
    <NavigationDrawerPrimitive
        ref={scrollContainerRef}
        open={isOpen}
        modal={mobileMode} // True for mobile, False for desktop
        onMouseEnter={!mobileMode ? onMouseEnter : undefined}
        onMouseLeave={!mobileMode ? onMouseLeave : undefined}
        // Add padding left on desktop to account for the rail (80px) + spacing (12px) = 92px
        // IMPORTANT: Hide the desktop variant on mobile screens (hidden md:flex)
        className={`
            ${!mobileMode ? 'hidden md:flex md:pl-[92px]' : ''}
            ${!mobileMode && isOverlay ? 'shadow-3' : ''}
        `}
    >
        {mobileMode ? (
             <div className="animate-content-enter pb-20u pt-4u">
                <h2 className="px-5u mb-4u mt-2u text-title-small font-bold text-on-surface-variant tracking-wide uppercase">
                    Unisane UI
                </h2>
                <nav className="flex flex-col gap-1u" aria-label="Main Navigation">
                    {NAV_DATA.map(category => (
                        <DrawerAccordionItem 
                            key={category.id}
                            item={category}
                            depth={0}
                            isActiveCategory={activeCategory?.id === category.id}
                            activeSubItemId={activeSubItemId}
                            onSelect={(id) => {
                                const isCat = NAV_DATA.some(c => c.id === id);
                                if (isCat && onSelectCategory) {
                                    onSelectCategory(id);
                                } else {
                                    onSelectSubItem(id);
                                }
                            }}
                        />
                    ))}
                </nav>
             </div>
        ) : (
            activeCategory && activeCategory.items && activeCategory.items.length > 0 ? (
                <div className="animate-content-enter pb-20u pt-4u" key={activeCategory.id}>
                    <h2 className="px-5u mb-4u mt-2u text-title-small font-bold text-on-surface-variant tracking-wide uppercase">
                        {activeCategory.label}
                    </h2>
                    
                    <nav className="flex flex-col gap-1u" aria-label="Sub Navigation">
                        {activeCategory.items.map(item => (
                            <DrawerAccordionItem 
                                key={item.id} 
                                item={item} 
                                activeSubItemId={activeSubItemId}
                                onSelect={onSelectSubItem}
                            />
                        ))}
                    </nav>
                </div>
            ) : (
                <div className="p-7u text-on-surface-variant text-body-medium animate-content-enter">
                    Select a category to view items.
                </div>
            )
        )}
    </NavigationDrawerPrimitive>
  );
};

export default NavigationDrawer;