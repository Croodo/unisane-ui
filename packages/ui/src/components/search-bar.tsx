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
      role="search"
      className={cn(
        "group relative flex items-center w-full h-14u rounded-sm bg-surface-container-high border border-outline-variant/30 hover:bg-surface-container-highest focus-within:bg-surface-container-highest transition-all duration-medium ease-standard cursor-text",
        className
      )}
    >
      <div className="pl-4u pr-2u text-on-surface">
        {leadingIcon || <Icon symbol="search" className="w-6u h-6u" />}
      </div>

      <input
        type="search"
        className="flex-1 h-full bg-transparent border-none outline-none text-on-surface placeholder:text-on-surface-variant text-body-medium"
        placeholder={placeholder}
        {...props}
      />

      {trailingIcon && (
        <div className="pr-4u pl-2u text-on-surface-variant hover:text-on-surface focus-visible:outline-none">
          {trailingIcon}
        </div>
      )}
    </div>
  );
};
