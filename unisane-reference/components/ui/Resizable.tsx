import React, { useState, useRef, useEffect, useContext, createContext } from 'react';
import { cn } from '../../lib/utils';
import { Icon } from './Icon';

// --- Context ---
interface ResizableContextType {
  direction: 'horizontal' | 'vertical';
  registerPanel: (id: string) => void;
  updatePanelSize: (id: string, delta: number) => void;
  panels: string[];
}

const ResizableContext = createContext<ResizableContextType | null>(null);

// --- Resizable Panel Group ---
interface ResizablePanelGroupProps {
  direction?: 'horizontal' | 'vertical';
  children: React.ReactNode;
  className?: string;
}

export const ResizablePanelGroup: React.FC<ResizablePanelGroupProps> = ({
  direction = 'horizontal',
  children,
  className
}) => {
  const [panels, setPanels] = useState<string[]>([]);

  const registerPanel = (id: string) => {
    setPanels(prev => {
        if(prev.includes(id)) return prev;
        return [...prev, id];
    });
  };

  const updatePanelSize = (id: string, delta: number) => {
     // Implementation simplified for visual representation
  };

  return (
    <ResizableContext.Provider value={{ direction, registerPanel, updatePanelSize, panels }}>
      <div 
        className={cn(
            "flex w-full h-full overflow-hidden", 
            direction === 'vertical' ? "flex-col" : "flex-row",
            className
        )}
      >
        {children}
      </div>
    </ResizableContext.Provider>
  );
};

// --- Resizable Panel ---
interface ResizablePanelProps {
  id?: string;
  defaultSize?: number; // Percentage 0-100
  minSize?: number;
  maxSize?: number;
  children: React.ReactNode;
  className?: string;
  order?: number; 
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  defaultSize = 50,
  minSize = 10,
  maxSize = 90,
  children,
  className,
  id
}) => {
  return (
    <div 
      id={id}
      className={cn("flex-1 overflow-hidden relative", className)}
      style={{ flexBasis: `${defaultSize}%`, minWidth: minSize ? `${minSize}%` : undefined }}
      data-panel-id={id}
    >
      {children}
    </div>
  );
};

// --- Resizable Handle ---
interface ResizableHandleProps {
  withHandle?: boolean;
  className?: string;
}

export const ResizableHandle: React.FC<ResizableHandleProps> = ({ withHandle, className }) => {
  const ctx = useContext(ResizableContext);
  const handleRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: MouseEvent) => {
        if (!handleRef.current) return;
        
        // Find siblings
        const handle = handleRef.current;
        const prevPanel = handle.previousElementSibling as HTMLElement;
        const nextPanel = handle.nextElementSibling as HTMLElement;

        if (!prevPanel || !nextPanel) return;

        const parent = handle.parentElement as HTMLElement;
        if (!parent) return;

        const parentRect = parent.getBoundingClientRect();
        const isHorizontal = ctx?.direction === 'horizontal';
        
        // Calculate percentages
        const totalSize = isHorizontal ? parentRect.width : parentRect.height;
        const delta = isHorizontal ? e.movementX : e.movementY;
        
        if (delta === 0) return;

        // Convert current flex basis to pixels or reading current dimensions
        const prevRect = prevPanel.getBoundingClientRect();
        const nextRect = nextPanel.getBoundingClientRect();

        const prevSize = isHorizontal ? prevRect.width : prevRect.height;
        const nextSize = isHorizontal ? nextRect.width : nextRect.height;

        const newPrevSize = prevSize + delta;
        const newNextSize = nextSize - delta;

        // Simple validation constraints (min 50px)
        if (newPrevSize < 50 || newNextSize < 50) return;

        // Apply new flex-basis in %
        const newPrevPct = (newPrevSize / totalSize) * 100;
        const newNextPct = (newNextSize / totalSize) * 100;

        prevPanel.style.flexBasis = `${newPrevPct}%`;
        nextPanel.style.flexBasis = `${newNextPct}%`;
        // Important: set flex-grow to 0 so basis is respected during resize interaction
        prevPanel.style.flexGrow = '0';
        nextPanel.style.flexGrow = '0';
    };

    const onUp = () => {
        setIsDragging(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);

    return () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, ctx?.direction]);

  const handleDown = () => {
    setIsDragging(true);
    document.body.style.cursor = ctx?.direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <div
      ref={handleRef}
      onMouseDown={handleDown}
      className={cn(
        "relative flex items-center justify-center bg-outline-variant/20 hover:bg-primary/50 transition-colors z-10",
        ctx?.direction === 'horizontal' 
            ? "w-1u h-full cursor-col-resize hover:w-1.5u -ml-[2px] -mr-[2px]" 
            : "h-1u w-full cursor-row-resize hover:h-1.5u -mt-[2px] -mb-[2px]",
        isDragging && "bg-primary w-1.5u h-full opacity-100",
        className
      )}
    >
      {withHandle && (
        <div className={cn(
            "bg-outline rounded-full flex items-center justify-center",
            ctx?.direction === 'horizontal' ? "h-8u w-1u" : "w-8u h-1u",
             "z-20"
        )}>
        </div>
      )}
    </div>
  );
};