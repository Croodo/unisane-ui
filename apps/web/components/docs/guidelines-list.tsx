"use client";

import type { UsageGuideline } from "@/lib/docs/types";
import { cn } from "@unisane/ui/lib/utils";

interface GuidelinesListProps {
  guidelines: UsageGuideline[];
  className?: string;
}

const GUIDELINE_CONFIG = {
  do: {
    icon: "check_circle",
    label: "Do",
    className: "text-success bg-success-container/30 border-success/20",
    iconClassName: "text-success",
  },
  dont: {
    icon: "cancel",
    label: "Don't",
    className: "text-error bg-error-container/30 border-error/20",
    iconClassName: "text-error",
  },
  caution: {
    icon: "warning",
    label: "Caution",
    className: "text-warning bg-warning-container/30 border-warning/20",
    iconClassName: "text-warning",
  },
};

export function GuidelinesList({ guidelines, className }: GuidelinesListProps) {
  if (!guidelines.length) return null;

  // Group guidelines by type
  const grouped = {
    do: guidelines.filter((g) => g.type === "do"),
    dont: guidelines.filter((g) => g.type === "dont"),
    caution: guidelines.filter((g) => g.type === "caution"),
  };

  return (
    <div className={cn("space-y-6u", className)}>
      {(["do", "dont", "caution"] as const).map((type) => {
        const items = grouped[type];
        if (!items.length) return null;

        const config = GUIDELINE_CONFIG[type];

        return (
          <div key={type} className="space-y-3u">
            <div className="flex items-center gap-2u">
              <span
                className={cn(
                  "material-symbols-outlined text-[20px]!",
                  config.iconClassName
                )}
              >
                {config.icon}
              </span>
              <span className="text-title-small font-semibold text-on-surface">
                {config.label}
              </span>
            </div>

            <ul className="space-y-2u">
              {items.map((item, index) => (
                <li
                  key={index}
                  className={cn(
                    "flex items-start gap-3u p-4u rounded-medium border",
                    config.className
                  )}
                >
                  <span
                    className={cn(
                      "material-symbols-outlined text-[18px]! shrink-0 mt-0.5",
                      config.iconClassName
                    )}
                  >
                    {config.icon}
                  </span>
                  <span className="text-body-medium text-on-surface font-medium">
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
