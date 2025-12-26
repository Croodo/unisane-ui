import React from "react";
import { cva } from "class-variance-authority";
import { cn } from '@/lib/utils';
import { Ripple } from "./ripple";

// --- Types & Variants ---

interface DrawerProps {
  open?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  modal?: boolean;
}

// --- Navigation Drawer Container ---

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
        "flex flex-col h-full bg-surface-container-low p-3u overflow-y-auto transition-transform duration-emphasized ease-standard",
        modal
          ? "fixed inset-y-0 left-0 z-40 shadow-4 rounded-e-sm animate-in slide-in-from-left duration-emphasized ease-decelerate w-[min(calc(100vw-(var(--uni-sys-u)*14)),calc(var(--uni-sys-u)*80))]"
          : "relative border-r border-outline-variant/30 rounded-none w-[calc(var(--uni-sys-u)*80)] z-20",
        !open && modal && "translate-x-full",
        className
      )}
    >
      {children}
    </aside>
  );

  if (modal) {
    return (
      <>
        {/* Backdrop */}
        {open && (
          <div
            className="fixed inset-0 bg-scrim z-40 animate-in fade-in duration-short ease-standard"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
        {open && drawerContent}
      </>
    );
  }

  return drawerContent;
};

// --- Navigation Drawer Item ---

const drawerItemVariants = cva(
  "flex items-center gap-4u w-full min-h-12u py-3u px-4u rounded-sm text-label-medium font-medium transition-all duration-snappy ease-emphasized cursor-pointer select-none group focus-visible:outline-2 focus-visible:outline-primary relative overflow-hidden shrink-0",
  {
    variants: {
      active: {
        true: "bg-secondary-container text-on-secondary-container",
        false: "bg-transparent text-on-surface-variant hover:bg-on-surface/5",
      },
    },
    defaultVariants: {
      active: false,
    },
  }
);

interface NavigationDrawerItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
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
    <button
      className={cn(drawerItemVariants({ active }), className)}
      {...props}
    >
      <Ripple disabled={false} />

      {icon && (
        <span
          className={cn(
            "w-6u h-6u flex items-center justify-center relative z-10",
            active ? "text-current" : "text-on-surface-variant"
          )}
        >
          {icon}
        </span>
      )}
      <span className="flex-1 text-left relative z-10 truncate">{children}</span>
      {badge && (
        <span className="text-label-small font-medium relative z-10 bg-on-secondary-container text-secondary-container px-1.5u py-0.5u rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
};

export const NavigationDrawerHeadline: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <div className="px-6u py-4u text-label-medium font-medium text-on-surface-variant/70 truncate">
    {children}
  </div>
);

export const NavigationDrawerDivider: React.FC = () => (
  <div className="h-px w-full bg-outline-variant/30 my-2u px-4u shrink-0" />
);
