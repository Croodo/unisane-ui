import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Icon } from './Icon';
import { Chip } from './Chip';
import { Typography } from './Typography';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label: string;
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (val: string) => {
    const newValue = value.includes(val) 
      ? value.filter(v => v !== val) 
      : [...value, val];
    onChange(newValue);
  };

  return (
    <div ref={containerRef} className={cn("relative flex flex-col gap-1.5u w-full", className)}>
      <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest px-1u">{label}</Typography>
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "min-h-12u p-2u bg-white border border-stone-200 rounded-xs flex flex-wrap gap-1.5u items-center cursor-pointer transition-all hover:border-primary/40",
          isOpen && "border-primary ring-1 ring-primary/20 shadow-sm"
        )}
      >
        {value.length > 0 ? (
          value.map(val => (
            <Chip 
              key={val} 
              label={options.find(o => o.value === val)?.label || val} 
              onDelete={() => toggleOption(val)}
              className="h-7u bg-stone-100 border-none text-stone-700"
            />
          ))
        ) : (
          <span className="text-stone-300 text-xs font-bold uppercase ml-2u">{placeholder || "Select Multiple..."}</span>
        )}
        <div className="ml-auto pr-2u text-stone-300">
           <Icon symbol="unfold_more" size={18} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-stone-200 rounded-xs shadow-3 z-50 py-1.5u max-h-60u overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-snappy">
          {options.map(opt => {
            const isSelected = value.includes(opt.value);
            return (
              <div 
                key={opt.value}
                onClick={() => toggleOption(opt.value)}
                className={cn(
                  "px-4u h-10u flex items-center justify-between text-[12px] font-black uppercase tracking-tight cursor-pointer transition-colors",
                  isSelected ? "bg-primary/5 text-primary" : "text-stone-700 hover:bg-stone-50"
                )}
              >
                <span>{opt.label}</span>
                {isSelected && <Icon symbol="check" size={16} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};