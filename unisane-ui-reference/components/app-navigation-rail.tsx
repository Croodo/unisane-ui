import React from 'react';
import { NavCategory } from '../types';
import { NavigationRailPrimitive, RailItem } from './ui/navigation-rail';
import { IconButton } from './ui/icon-button';
import { useTheme } from './theme-provider';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

interface NavigationRailProps {
  categories: NavCategory[];
  activeCategoryId: string;
  onSelectCategory: (id: string) => void;
  onHoverCategory: (id: string) => void;
  onLeaveRail: () => void;
  isDrawerOpen: boolean;
}

const NavigationRail: React.FC<NavigationRailProps> = ({
  categories,
  activeCategoryId,
  onSelectCategory,
  onHoverCategory,
  onLeaveRail,
}) => {
  const { setTheme, resolvedTheme } = useTheme();
  
  // Transform domain data (NavCategory) into UI items (RailItem)
  const items: RailItem[] = categories.map(category => ({
    value: category.id,
    label: category.label,
    // Note: In real usage, you might want solid icons for active state
    icon: category.icon, 
    activeIcon: category.icon, 
    badge: category.badge
  }));

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const FooterActions = () => (
    <>
       <Tooltip>
         <TooltipTrigger asChild>
           <IconButton variant="outlined" ariaLabel="Pause animations" className="w-10u h-10u text-on-surface-variant border-outline-variant hover:border-outline">
             <span className="material-symbols-outlined !text-[20px]">pause</span>
           </IconButton>
         </TooltipTrigger>
         <TooltipContent side="right">Pause animations</TooltipContent>
       </Tooltip>

       <Tooltip>
         <TooltipTrigger asChild>
           <IconButton 
             variant="outlined" 
             ariaLabel={resolvedTheme === 'dark' ? "Switch to light mode" : "Switch to dark mode"} 
             className="w-10u h-10u text-on-surface-variant border-outline-variant hover:border-outline"
             onClick={toggleTheme}
           >
             <span className="material-symbols-outlined !text-[20px] transition-transform duration-short rotate-0 dark:-rotate-90">
                {resolvedTheme === 'dark' ? 'light_mode' : 'dark_mode'}
             </span>
           </IconButton>
         </TooltipTrigger>
         <TooltipContent side="right">
            {resolvedTheme === 'dark' ? "Light mode" : "Dark mode"}
         </TooltipContent>
       </Tooltip>
    </>
  );

  return (
    <NavigationRailPrimitive 
        className="hidden md:flex fixed left-0 top-0 h-screen"
        items={items}
        value={activeCategoryId}
        onChange={onSelectCategory}
        onItemHover={onHoverCategory}
        onMouseLeave={onLeaveRail}
        footer={<FooterActions />}
    />
  );
};

export default NavigationRail;