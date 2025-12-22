import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Icon } from './Icon';
import { Ripple } from './Ripple';

export interface TreeNode {
  id: string;
  label: string;
  icon?: string;
  children?: TreeNode[];
  data?: any;
}

interface TreeProps {
  data: TreeNode[];
  onSelect?: (node: TreeNode) => void;
  className?: string;
}

export const Tree: React.FC<TreeProps> = ({ data, onSelect, className }) => {
  return (
    <div className={cn("flex flex-col select-none", className)}>
      {data.map((node) => (
        <TreeItem key={node.id} node={node} onSelect={onSelect} level={0} />
      ))}
    </div>
  );
};

const TreeItem = ({ node, onSelect, level }: { node: TreeNode; onSelect?: (n: TreeNode) => void; level: number }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col">
      <div 
        className={cn(
          "group flex items-center h-9u px-2u gap-2u cursor-pointer transition-all relative overflow-hidden rounded-xs",
          "hover:bg-surface-container-low"
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (hasChildren) setIsOpen(!isOpen);
          onSelect?.(node);
        }}
        style={{ paddingLeft: `${(level * 20) + 8}px` }}
      >
        <Ripple />
        
        {/* Connection Line Visuals */}
        {level > 0 && (
            <div className="absolute left-[18px] top-0 bottom-0 w-px bg-outline-variant/30" style={{ left: `${(level - 1) * 20 + 18}px` }} />
        )}

        <div className="relative z-10 flex items-center justify-center w-5u h-5u">
            {hasChildren ? (
                <Icon 
                    symbol={isOpen ? "expand_more" : "chevron_right"} 
                    size={18} 
                    className={cn("transition-transform duration-snappy", isOpen ? "text-primary" : "text-on-surface-variant")}
                />
            ) : (
                <div className="w-1.5u h-1.5u rounded-full bg-outline-variant group-hover:bg-primary/40 transition-colors" />
            )}
        </div>

        {node.icon && <Icon symbol={node.icon} size={18} className="text-on-surface-variant group-hover:text-on-surface relative z-10" />}
        
        <span className={cn(
            "text-[12px] font-black uppercase tracking-tight truncate pt-0.5u relative z-10",
            isOpen ? "text-on-surface" : "text-on-surface-variant"
        )}>
            {node.label}
        </span>
      </div>

      {hasChildren && isOpen && (
        <div className="flex flex-col animate-in fade-in slide-in-from-top-1 duration-snappy">
          {node.children!.map((child) => (
            <TreeItem key={child.id} node={child} onSelect={onSelect} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};