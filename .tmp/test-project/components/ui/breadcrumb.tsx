import React from "react";
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';
import { IconButton } from "./icon-button";

export const Breadcrumb: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <nav aria-label="breadcrumb" className={cn("flex", className)}>
    <ol className="flex items-center gap-2 flex-wrap">{children}</ol>
  </nav>
);

export const BreadcrumbItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <li className={cn("inline-flex items-center gap-2", className)}>
    {children}
  </li>
);

export const BreadcrumbLink: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}> = ({ children, onClick, className }) => (
  <button
    onClick={onClick}
    className={cn(
      "text-label-medium font-medium text-on-surface-variant hover:text-primary transition-colors leading-none pt-0_5",
      className
    )}
  >
    {children}
  </button>
);

export const BreadcrumbPage: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <span
    className={cn(
      "text-label-medium font-medium text-on-surface leading-none pt-0_5",
      className
    )}
  >
    {children}
  </span>
);

export const BreadcrumbSeparator: React.FC = () => (
  <Icon symbol="chevron_right" size={14} className="text-outline" />
);

export const BreadcrumbEllipsis: React.FC<{
  onClick?: () => void;
  className?: string;
}> = ({ onClick, className }) => {
  return (
    <li className={cn("inline-flex items-center gap-2", className)}>
      <IconButton
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        }
        onClick={onClick}
        ariaLabel="More items"
        className="text-on-surface-variant"
      />
      <BreadcrumbSeparator />
    </li>
  );
};
