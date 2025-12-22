import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Fab, FabProps } from './Fab';
import { Icon } from './Icon';

interface FabAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface FabMenuProps {
  mainIcon?: React.ReactNode;
  activeIcon?: React.ReactNode;
  actions: FabAction[];
  className?: string;
}

export const FabMenu: React.FC<FabMenuProps> = ({
  mainIcon = <Icon symbol="add" />,
  activeIcon = <Icon symbol="close" />,
  actions,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
        document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  return (
    <div 
        ref={containerRef}
        className={cn("relative flex flex-col items-end gap-4u z-50", className)}
    >
       {/* Actions List */}
       <div className={cn(
           "flex flex-col items-end gap-3u transition-all duration-200 ease-emphasized",
           isOpen ? "opacity-100 translate-y-0 visible" : "opacity-0 translate-y-10u invisible pointer-events-none"
       )}>
           {actions.map((action, index) => (
               <div key={index} className="flex items-center gap-3u group">
                   {/* Label */}
                   <span className="bg-inverse-surface text-inverse-on-surface text-xs font-medium py-1u px-2u rounded-md shadow-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                       {action.label}
                   </span>
                   {/* Small FAB */}
                   <Fab 
                       size="sm" 
                       variant="secondary" 
                       icon={action.icon} 
                       onClick={(e) => {
                           e.stopPropagation();
                           action.onClick();
                           setIsOpen(false);
                       }}
                       aria-label={action.label}
                   />
               </div>
           ))}
       </div>

       {/* Main Toggle FAB */}
       <Fab 
           variant={isOpen ? "tertiary" : "primary"}
           size="md"
           className={cn("transition-transform duration-300", isOpen ? "rotate-90" : "rotate-0")}
           onClick={() => setIsOpen(!isOpen)}
           icon={isOpen ? activeIcon : mainIcon}
       />
    </div>
  );
};