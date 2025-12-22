import React, { useState, useRef } from 'react';
import { cn } from '../../lib/utils';
import { Chip } from './Chip';
import { Icon } from './Icon';

interface TagInputProps {
  label?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const TagInput: React.FC<TagInputProps> = ({
  label,
  tags,
  onChange,
  placeholder = "Add tag...",
  className,
  disabled
}) => {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = input.trim();
      if (val && !tags.includes(val)) {
        onChange([...tags, val]);
        setInput('');
      }
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className={cn("flex flex-col gap-1.5u w-full", className)}>
      {label && <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">{label}</span>}
      
      <div 
        className={cn(
            "flex flex-wrap items-center gap-1.5u p-2u min-h-[48px] rounded-xs border transition-all cursor-text bg-surface",
            isFocused ? "border-primary ring-1 ring-primary/20" : "border-outline-variant hover:border-outline",
            disabled && "opacity-50 cursor-not-allowed bg-surface-container-low"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map(tag => (
            <Chip 
                key={tag} 
                label={tag} 
                onDelete={disabled ? undefined : () => removeTag(tag)}
                className="h-7u bg-surface-container-high border-none text-on-surface"
            />
        ))}
        
        <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={tags.length === 0 ? placeholder : ""}
            disabled={disabled}
            className="flex-1 min-w-[80px] bg-transparent border-none outline-none text-[13px] font-bold text-on-surface placeholder:text-on-surface-variant h-7u"
        />
        
        {tags.length === 0 && !input && (
            <div className="ml-auto text-on-surface-variant">
                <Icon symbol="sell" size={18} />
            </div>
        )}
      </div>
    </div>
  );
};