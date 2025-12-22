import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';
import { Icon } from './Icon';
import { Kbd } from './Kbd';
import { Typography } from './Typography';

interface CommandItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string[];
  group?: string;
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose, commands }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(query.toLowerCase()) || 
    cmd.group?.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, filteredCommands, selectedIndex, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
        const activeElement = listRef.current.children[selectedIndex] as HTMLElement;
        if (activeElement) {
            activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }
  }, [selectedIndex]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[6000] flex items-start justify-center pt-[20vh] px-4u">
      <div className="absolute inset-0 bg-scrim/60 backdrop-blur-[1px] animate-in fade-in duration-200" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-surface rounded-xs shadow-5 overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-top-4 duration-200 border border-outline-variant">
        <div className="flex items-center px-4u py-4u border-b border-outline-variant gap-3u">
            <Icon symbol="search" className="text-on-surface-variant" />
            <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent border-none outline-none text-lg font-bold text-on-surface placeholder:text-on-surface-variant h-8u uppercase tracking-tight"
            />
            <div className="px-2u py-1u bg-surface-container-high rounded-xs text-[10px] font-black text-on-surface-variant uppercase tracking-widest">ESC</div>
        </div>

        <div ref={listRef} className="max-h-[320px] overflow-y-auto py-2u">
            {filteredCommands.length > 0 ? (
                filteredCommands.map((cmd, i) => (
                    <div
                        key={cmd.id}
                        onClick={() => { cmd.action(); onClose(); }}
                        onMouseEnter={() => setSelectedIndex(i)}
                        className={cn(
                            "px-4u py-3u mx-2u flex items-center gap-3u cursor-pointer rounded-xs transition-colors",
                            i === selectedIndex ? "bg-primary text-on-primary" : "text-on-surface hover:bg-surface-container-high"
                        )}
                    >
                        {cmd.icon && <Icon symbol={cmd.icon} size={20} className={cn(i === selectedIndex ? "text-on-primary" : "text-on-surface-variant")} />}
                        <div className="flex-1 flex flex-col">
                            <span className="text-[13px] font-black uppercase tracking-tight leading-none">{cmd.label}</span>
                            {cmd.group && <span className={cn("text-[9px] font-bold uppercase mt-1u", i === selectedIndex ? "text-on-primary/70" : "text-on-surface-variant")}>{cmd.group}</span>}
                        </div>
                        {cmd.shortcut && (
                            <div className="flex gap-1u">
                                {cmd.shortcut.map(k => <Kbd key={k} className={cn(i === selectedIndex ? "bg-white/20 border-transparent text-white" : "")}>{k}</Kbd>)}
                            </div>
                        )}
                    </div>
                ))
            ) : (
                <div className="px-12u py-16u text-center text-on-surface-variant">
                    <Typography variant="labelSmall" className="font-black uppercase tracking-widest">No commands found</Typography>
                </div>
            )}
        </div>
        
        <div className="bg-surface-container-low border-t border-outline-variant px-4u py-2u flex justify-between items-center text-[9px] font-bold text-on-surface-variant uppercase tracking-tight">
            <span>Protocol v1.0</span>
            <span>{filteredCommands.length} Active Nodes</span>
        </div>
      </div>
    </div>,
    document.body
  );
};