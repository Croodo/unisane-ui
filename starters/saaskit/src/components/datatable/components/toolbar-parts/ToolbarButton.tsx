import React from "react";
import type { LucideIcon } from "lucide-react";

interface ToolbarButtonProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  badge?: number;
  className?: string;
}

/**
 * Reusable toolbar icon button with label and optional badge
 */
export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  active = false,
  disabled = false,
  badge,
  className = "",
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-md transition-colors hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed ${
        active
          ? "text-primary bg-primary/5"
          : "text-muted-foreground hover:text-foreground"
      } ${className}`}
    >
      <div className="relative">
        <Icon size={20} strokeWidth={active ? 2.5 : 2} />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center text-[9px] font-bold leading-none text-white bg-primary px-1 rounded-full">
            {badge}
          </span>
        )}
        {active && badge === undefined && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full ring-1 ring-white" />
        )}
      </div>
      <span className="text-[10px] font-semibold leading-none">{label}</span>
    </button>
  );
};
