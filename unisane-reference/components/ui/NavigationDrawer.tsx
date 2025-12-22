import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Ripple } from './Ripple';
import { Typography } from './Typography';

interface DrawerProps {
  open?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  modal?: boolean;
}

export const NavigationDrawer: React.FC<DrawerProps> = ({
  open = true,
  onClose,
  children,
  className,
  modal = false,
}) => {
  if (!open && modal) return null;

  const drawerContent = (
    <aside
      className={cn(
        "flex flex-col h-full bg-surface-container-low p-3u overflow-y-auto transition-transform duration-emphasized ease-standard shadow-0",
        modal 
          ? "fixed inset-y-0 left-0 z-[200] shadow-4 rounded-e-sm animate-in slide-in-from-left w-[min(calc(100vw-56px),320px)]" 
          : "relative border-r border-outline-variant/30 w-[320px] z-[30]",
        className
      )}
    >
      {children}
    </aside>
  );

  if (modal) {
    return (
      <>
        <div className="fixed inset-0 bg-scrim/40 z-[190] animate-in fade-in duration-standard" onClick={onClose} aria-hidden="true" />
        {drawerContent}
      </>
    );
  }

  return drawerContent;
};

const drawerItemVariants = cva(
  "flex items-center gap-4u w-full min-h-12u py-3u px-4u rounded-xs text-[12px] font-black uppercase tracking-tight transition-all duration-snappy ease-emphasized cursor-pointer select-none group focus-visible:outline-2 focus-visible:outline-primary relative overflow-hidden shrink-0",
  {
    variants: {
      active: {
        true: "bg-primary text-on-primary shadow-1",
        false: "bg-transparent text-on-surface-variant hover:bg-on-surface/5",
      }
    },
    defaultVariants: {
      active: false,
    },
  }
);

interface NavigationDrawerItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: React.ReactNode;
  badge?: string;
}

export const NavigationDrawerItem: React.FC<NavigationDrawerItemProps> = ({
  active,
  icon,
  badge,
  children,
  className,
  ...props
}) => {
  return (
    <button className={cn(drawerItemVariants({ active }), className)} {...props}>
      <Ripple disabled={false} />
      {icon && (
        <span className={cn("w-5u h-5u flex items-center justify-center relative z-10", active ? "text-inherit" : "text-on-surface-variant")}>
            {icon}
        </span>
      )}
      <span className="flex-1 text-left relative z-10 truncate leading-none pt-0.5u">{children}</span>
      {badge && <span className="text-[10px] font-black relative z-10 opacity-70 tabular-nums bg-surface/10 px-1.5u py-0.5u rounded-xs">{badge}</span>}
    </button>
  );
};

export const NavigationDrawerHeadline: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="px-4u py-3u text-[10px] font-black uppercase tracking-[0.4em] text-on-surface-variant/40 leading-none">
        {children}
    </div>
);

export const NavigationDrawerDivider: React.FC = () => (
    <div className="h-px w-full bg-outline-variant/30 my-2u shrink-0" />
);