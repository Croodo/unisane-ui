import React from 'react';
import { cn } from '../../lib/utils';
import { Icon } from './Icon';

export const Breadcrumb: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <nav aria-label="breadcrumb" className={cn("flex", className)}>
    <ol className="flex items-center gap-2u flex-wrap">{children}</ol>
  </nav>
);

export const BreadcrumbItem: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <li className={cn("inline-flex items-center gap-2u", className)}>{children}</li>
);

export const BreadcrumbLink: React.FC<{ children: React.ReactNode; onClick?: () => void; className?: string }> = ({ children, onClick, className }) => (
  <button 
    onClick={onClick}
    className={cn(
      "text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant hover:text-primary transition-colors leading-none pt-0.5u",
      className
    )}
  >
    {children}
  </button>
);

export const BreadcrumbPage: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span className={cn("text-[10px] font-black uppercase tracking-[0.2em] text-on-surface leading-none pt-0.5u", className)}>
    {children}
  </span>
);

export const BreadcrumbSeparator: React.FC = () => (
  <Icon symbol="chevron_right" size={14} className="text-outline" />
);