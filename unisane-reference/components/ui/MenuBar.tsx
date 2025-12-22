import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Menu, MenuItem, MenuDivider } from './Menu';

interface MenuBarProps {
  children: React.ReactNode;
  className?: string;
}

export const MenuBar: React.FC<MenuBarProps> = ({ children, className }) => {
  return (
    <div className={cn("flex items-center p-1u bg-surface border border-outline-variant/20 rounded-md shadow-sm w-fit", className)}>
      {children}
    </div>
  );
};

interface MenuBarMenuProps {
  trigger: string;
  children: React.ReactNode;
}

export const MenuBarMenu: React.FC<MenuBarMenuProps> = ({ trigger, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={ref}>
      <button 
        className={cn(
            "px-3u py-1.5u text-sm font-medium rounded-sm transition-colors select-none focus-visible:outline-none",
            isOpen ? "bg-secondary-container text-on-secondary-container" : "text-on-surface hover:bg-surface-variant/30"
        )}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => {
            // Optional: Auto-open if another menu is already open (mimics desktop behavior)
        }}
      >
        {trigger}
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 z-50 min-w-[200px]">
           <Menu open={true} className="w-full relative shadow-2 border border-outline-variant/20">
               {children}
           </Menu>
        </div>
      )}
    </div>
  );
};

export const MenuBarItem = MenuItem;
export const MenuBarSeparator = MenuDivider;