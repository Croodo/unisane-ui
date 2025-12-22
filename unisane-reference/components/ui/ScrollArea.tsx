import React from 'react';
import { cn } from '../../lib/utils';

export const ScrollArea: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return (
    <div className={cn("relative overflow-hidden group", className)}>
      <div className="h-full w-full overflow-auto no-scrollbar md:scrollbar-thin scroll-smooth">
        {children}
      </div>
      <style>{`
        .scrollbar-thin::-webkit-scrollbar { width: 4px; height: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: var(--uni-sys-color-outline-variant); border-radius: 99px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: var(--uni-sys-color-outline); }
      `}</style>
    </div>
  );
};