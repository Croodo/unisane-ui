import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { TextField } from './TextField';
import { Icon } from './Icon';

interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const Combobox: React.FC<ComboboxProps> = ({
  options,
  value,
  onChange,
  label,
  placeholder,
  className,
  disabled
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync search text with selected value label initially
  useEffect(() => {
    const selected = options.find(o => o.value === value);
    if (selected) {
      setSearch(selected.label);
    } else {
        setSearch('');
    }
  }, [value, options]);

  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (option: ComboboxOption) => {
    onChange(option.value);
    setSearch(option.label);
    setIsOpen(false);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Timeout to allow click on option to register
    setTimeout(() => {
       // Optional: Reset search if no valid option selected or keep it text? 
       // For a strict combobox, we might reset. For now, we'll just close.
       setIsOpen(false);
    }, 200);
  };

  const handleFocus = () => {
      setIsOpen(true);
      // Optional: Clear search on focus to show all? 
      // Or keep existing. Let's select text to allow easy replace.
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <TextField
        label={label}
        placeholder={placeholder}
        value={search}
        onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        trailingIcon={
            <Icon 
                viewBox="0 0 24 24" 
                className={cn("transition-transform duration-200 cursor-pointer", isOpen && "rotate-180")} 
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <path d="M7 10l5 5 5-5z" fill="currentColor"/>
            </Icon>
        }
      />

      {isOpen && !disabled && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-surface rounded-xs shadow-2 py-2u max-h-[280px] overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-100 border border-outline-variant/40">
           {filteredOptions.length > 0 ? (
               filteredOptions.map((option) => (
                 <button
                   key={option.value}
                   className={cn(
                     "w-full text-left px-4u h-12u flex items-center text-sm cursor-pointer hover:bg-on-surface/10 transition-colors",
                     option.value === value ? "bg-secondary-container/50 text-on-surface" : "text-on-surface"
                   )}
                   onMouseDown={(e) => {
                       // Prevent blur before click
                       e.preventDefault(); 
                   }}
                   onClick={() => handleSelect(option)}
                 >
                   {option.label}
                 </button>
               ))
           ) : (
               <div className="px-4u py-3u text-sm text-on-surface-variant">No options found.</div>
           )}
        </div>
      )}
    </div>
  );
};