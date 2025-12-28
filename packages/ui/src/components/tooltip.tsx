import React, { useId } from "react";
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
  const tooltipId = useId();

  return (
    <div className="relative group inline-flex" aria-describedby={tooltipId}>
      {children}

      <div
        id={tooltipId}
        role="tooltip"
        className={cn(
          "absolute z-modal opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-snappy ease-emphasized pointer-events-none whitespace-nowrap",
          side === "top" && "bottom-[calc(100%+(var(--unit)*2))] left-1/2 -translate-x-1/2",
          side === "bottom" && "top-[calc(100%+(var(--unit)*2))] left-1/2 -translate-x-1/2",
          side === "left" && "right-[calc(100%+(var(--unit)*2))] top-1/2 -translate-y-1/2",
          side === "right" && "left-[calc(100%+(var(--unit)*2))] top-1/2 -translate-y-1/2",
          variant === "plain"
            ? "bg-inverse-surface text-inverse-on-surface text-label-medium font-medium py-1.5 px-2 rounded-sm shadow-2"
            : "bg-surface-container text-on-surface p-4 rounded-sm shadow-3 min-w-[calc(var(--unit)*50)] whitespace-normal flex flex-col gap-1 border border-outline-variant/30",
          className
        )}
      >
        {variant === "rich" && subhead && (
          <span className="text-primary text-label-small font-medium opacity-70">
            {subhead}
          </span>
        )}
        <span className={cn(
          variant === "rich" ? "text-body-small font-medium" : "whitespace-nowrap"
        )}>
          {label}
        </span>
      </div>
    </div>
  );
};
