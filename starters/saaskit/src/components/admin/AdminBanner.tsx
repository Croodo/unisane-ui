"use client";

import { cn } from "@/src/lib/utils";
import { Shield } from "lucide-react";

type AdminBannerProps = React.HTMLAttributes<HTMLDivElement>;

export function AdminBanner({ className, ...props }: AdminBannerProps) {
  return (
    <div
      className={cn(
        "bg-orange-50 dark:bg-orange-950/20 border-b border-orange-200 dark:border-orange-900 px-4 py-2",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 text-sm">
        <Shield className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        <span className="font-medium text-orange-800 dark:text-orange-200">
          Admin Mode
        </span>
        <span className="text-orange-600 dark:text-orange-400">
          — Changes affect all tenants
        </span>
      </div>
    </div>
  );
}
