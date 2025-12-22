import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { Menu, MenuItem, MenuDivider } from './Menu';

interface ContextMenuProps {
  children: React.ReactNode;
}

interface ContextMenuContextType {
  isOpen: boolean;
  coords: { x: number; y: number };
  openMenu: (e: React.MouseEvent) => void;
  closeMenu: () => void;
}

const ContextMenuContext = React.createContext<ContextMenuContextType | null>(null);

export const ContextMenu: React.FC<ContextMenuProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const openMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(true);
    setCoords({ x: e.clientX, y: e.clientY });
  };

  const closeMenu = () => setIsOpen(false);

  // Close on global click or scroll
  useEffect(() => {
    if (isOpen) {
      const handleClose = () => setIsOpen(false);
      window.addEventListener('click', handleClose);
      window.addEventListener('resize', handleClose);
      window.addEventListener('scroll', handleClose, true);
      return () => {
        window.removeEventListener('click', handleClose);
        window.removeEventListener('resize', handleClose);
        window.removeEventListener('scroll', handleClose, true);
      };
    }
  }, [isOpen]);

  return (
    <ContextMenuContext.Provider value={{ isOpen, coords, openMenu, closeMenu }}>
      {children}
    </ContextMenuContext.Provider>
  );
};

export const ContextMenuTrigger: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const ctx = React.useContext(ContextMenuContext);
  if (!ctx) throw new Error("ContextMenuTrigger must be used within ContextMenu");
  
  return (
    <div onContextMenu={ctx.openMenu} className={className}>
      {children}
    </div>
  );
};

export const ContextMenuContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const ctx = React.useContext(ContextMenuContext);
  if (!ctx) throw new Error("ContextMenuContent must be used within ContextMenu");

  const ref = useRef<HTMLDivElement>(null);
  const [adjustedCoords, setAdjustedCoords] = useState(ctx.coords);

  // Boundary detection
  useEffect(() => {
    if (ctx.isOpen && ref.current) {
        const { offsetWidth, offsetHeight } = ref.current;
        const { innerWidth, innerHeight } = window;
        let { x, y } = ctx.coords;

        if (x + offsetWidth > innerWidth) x = innerWidth - offsetWidth - 8;
        if (y + offsetHeight > innerHeight) y = innerHeight - offsetHeight - 8;

        setAdjustedCoords({ x, y });
    }
  }, [ctx.isOpen, ctx.coords]);

  if (!ctx.isOpen) return null;

  return (
    <div 
        ref={ref}
        className={cn("fixed z-50 min-w-[200px]", className)}
        style={{ top: adjustedCoords.y, left: adjustedCoords.x }}
    >
       <Menu open={true} className="w-full relative shadow-3 border border-outline-variant/20">
           {children}
       </Menu>
    </div>
  );
};

export const ContextMenuItem = MenuItem;
export const ContextMenuSeparator = MenuDivider;