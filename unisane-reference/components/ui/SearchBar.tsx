import React from 'react';
import { cn } from '../../lib/utils';
import { Icon } from './Icon';

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  onTrailingIconClick?: () => void;
}

export const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(({
  leadingIcon,
  trailingIcon,
  onTrailingIconClick,
  className,
  placeholder = "Search system registry...",
  ...props
}, ref) => {
  return (
    <div className={cn(
      "group relative flex items-center w-full h-14u rounded-xs transition-all duration-snappy ease-emphasized cursor-text",
      "bg-surface-container-high border border-outline-variant/40 focus-within:border-primary focus-within:bg-white focus-within:shadow-2",
      className
    )}>
      <div className="pl-4u flex items-center justify-center text-on-surface-variant/40 group-focus-within:text-primary transition-colors shrink-0">
        {leadingIcon || <Icon symbol="search" size={24} />}
      </div>

      <input
        ref={ref}
        type="text"
        className="flex-1 min-w-0 h-full bg-transparent border-none outline-none focus:ring-0 text-on-surface placeholder:text-on-surface-variant/40 text-[15px] font-bold px-3u"
        placeholder={placeholder}
        {...props}
      />

      {trailingIcon && (
        <div 
          onClick={onTrailingIconClick}
          className="pr-3u flex items-center gap-2u text-on-surface-variant/60 hover:text-on-surface cursor-pointer shrink-0"
        >
          {trailingIcon}
        </div>
      )}
    </div>
  );
});

SearchBar.displayName = "SearchBar";