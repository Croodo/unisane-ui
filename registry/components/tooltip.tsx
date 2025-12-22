import React from "react";
import { cn } from "@ui/lib/utils";

export interface TooltipProps {
  label: string;
  subhead?: string;
  children: React.ReactNode;
  variant?: "plain" | "rich";
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
}

export const Tooltip: React.FC<TooltipProps> = ({
  label,
  subhead,
  children,
  variant = "plain",
  className,
  side = "top",
}) => {
  return (
    <div className="relative group inline-flex">
      {children}

      <div
        className={cn(
          "absolute z-modal opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-snappy ease-emphasized pointer-events-none whitespace-nowrap",
          side === "top" && "bottom-[calc(100%+(var(--uni-sys-u)*2))] left-1/2 -translate-x-1/2",
          side === "bottom" && "top-[calc(100%+(var(--uni-sys-u)*2))] left-1/2 -translate-x-1/2",
          side === "left" && "right-[calc(100%+(var(--uni-sys-u)*2))] top-1/2 -translate-y-1/2",
          side === "right" && "left-[calc(100%+(var(--uni-sys-u)*2))] top-1/2 -translate-y-1/2",
          variant === "plain"
            ? "bg-inverse-surface text-inverse-on-surface text-label-small font-black uppercase tracking-widest py-1.5u px-2u rounded-xs shadow-1"
            : "bg-surface-container text-on-surface p-3u rounded-xs shadow-2 min-w-[calc(var(--uni-sys-u)*50)] whitespace-normal flex flex-col gap-1u border border-outline-variant/30",
          className
        )}
      >
        {variant === "rich" && subhead && (
          <span className="text-primary text-label-small font-black uppercase tracking-widest opacity-60">
            {subhead}
          </span>
        )}
        <span className={cn(
          variant === "rich" ? "text-body-medium font-bold" : "whitespace-nowrap"
        )}>
          {label}
        </span>
      </div>
    </div>
  );
};
