"use client";

import { cn } from "@unisane/ui/lib/utils";
import { Icon } from "@unisane/ui/primitives/icon";

type AdminBannerProps = React.HTMLAttributes<HTMLDivElement>;

export function AdminBanner({ className, ...props }: AdminBannerProps) {
  return (
    <div
      className={cn(
        "bg-tertiary-container/30 border-b border-tertiary/30 px-4 py-2",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 text-body-medium">
        <Icon symbol="shield" size="sm" className="text-tertiary" />
        <span className="font-medium text-on-tertiary-container">
          Admin Mode
        </span>
        <span className="text-tertiary">
          — Changes affect all tenants
        </span>
      </div>
    </div>
  );
}
