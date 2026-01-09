import React from "react";
import { cn } from "@/src/lib/utils";
import { Icon } from "@/src/primitives/icon";

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
        "group relative flex items-center w-full h-14 rounded-sm bg-surface-container border border-outline-variant hover:bg-surface-container-high focus-within:bg-surface-container-high transition-all duration-medium ease-standard cursor-text",
        className
      )}
    >
      <div className="pl-4 pr-2 text-on-surface">
        {leadingIcon || <Icon symbol="search" className="w-6 h-6" />}
      </div>

      <input
        type="search"
        className="flex-1 h-full bg-transparent border-none outline-none text-on-surface placeholder:text-on-surface-variant text-body-medium"
        placeholder={placeholder}
        {...props}
      />

      {trailingIcon && (
        <div className="pr-4 pl-2 text-on-surface-variant hover:text-on-surface focus-visible:outline-none">
          {trailingIcon}
        </div>
      )}
    </div>
  );
};
