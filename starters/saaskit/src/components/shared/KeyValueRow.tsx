"use client";

import { ReactNode, useState } from "react";
import { cn } from "@unisane/ui/lib/utils";
import { Icon } from "@unisane/ui/primitives/icon";
import { IconButton } from "@unisane/ui/components/icon-button";
import { toast } from "@unisane/ui/components/toast";

export interface KeyValueRowProps {
  label: string;
  value: ReactNode;
  copyable?: boolean;
  copyValue?: string;
  truncate?: boolean;
  mono?: boolean;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}

export function KeyValueRow({
  label,
  value,
  copyable = false,
  copyValue,
  truncate = false,
  mono = false,
  className,
  labelClassName,
  valueClassName,
}: KeyValueRowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const textToCopy =
      copyValue ?? (typeof value === "string" ? value : String(value));
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const displayValue =
    value === null || value === undefined ? (
      <span className="text-on-surface-variant italic">—</span>
    ) : (
      value
    );

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-2 py-1.5 text-body-medium",
        className
      )}
    >
      <span
        className={cn("text-on-surface-variant flex-shrink-0", labelClassName)}
      >
        {label}
      </span>
      <div className="flex items-center gap-1 min-w-0 text-right">
        <span
          className={cn(
            "text-on-surface",
            truncate && "truncate max-w-[200px]",
            mono && "font-mono text-label-small",
            valueClassName
          )}
          title={truncate && typeof value === "string" ? value : undefined}
        >
          {displayValue}
        </span>
        {copyable && value && (
          <IconButton
            variant="standard"
            size="sm"
            className="h-5 w-5 flex-shrink-0"
            onClick={handleCopy}
            ariaLabel="Copy"
          >
            <Icon
              symbol={copied ? "check" : "content_copy"}
              size="xs"
              className={copied ? "text-primary" : undefined}
            />
          </IconButton>
        )}
      </div>
    </div>
  );
}

export interface KeyValueListProps {
  items: Array<{
    label: string;
    value: ReactNode;
    copyable?: boolean;
    mono?: boolean;
    truncate?: boolean;
  }>;
  className?: string;
}

export function KeyValueList({ items, className }: KeyValueListProps) {
  return (
    <div className={cn("divide-y divide-outline-variant", className)}>
      {items.map((item, idx) => (
        <KeyValueRow key={idx} {...item} />
      ))}
    </div>
  );
}
