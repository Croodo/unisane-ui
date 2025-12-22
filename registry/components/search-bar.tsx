import React from "react";
import { cn } from "@ui/lib/utils";
import { Icon } from "@ui/primitives/icon";

export interface SearchBarProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  onTrailingIconClick?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  leadingIcon,
  trailingIcon,
  onTrailingIconClick,
  className,
  placeholder = "Search",
  ...props
}) => {
  return (
    <div
      className={cn(
        "group relative flex items-center w-full h-14 rounded-full bg-surface-container-high hover:bg-surface-container-highest hover:shadow-1 focus-within:bg-surface-container-highest focus-within:shadow-1 transition-all duration-medium cursor-text",
        className
      )}
    >
      {/* Leading Icon */}
      <div className="pl-4 pr-2 text-on-surface">
        {leadingIcon || <Icon symbol="search" className="w-6 h-6" />}
      </div>

      {/* Input */}
      <input
        type="text"
        className="flex-1 h-full bg-transparent border-none outline-none text-on-surface placeholder:text-on-surface-variant text-body-medium"
        placeholder={placeholder}
        {...props}
      />

      {/* Trailing Icon (Avatar or Action) */}
      {trailingIcon && (
        <div className="pr-4 pl-2 text-on-surface-variant hover:text-on-surface focus-visible:outline-none">
          {trailingIcon}
        </div>
      )}
    </div>
  );
};
