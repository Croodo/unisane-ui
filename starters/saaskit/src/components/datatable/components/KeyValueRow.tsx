"use client";

import { ReactNode, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import { toast } from "sonner";

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
      <span className="text-muted-foreground italic">—</span>
    ) : (
      value
    );

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-2 py-1.5 text-sm",
        className
      )}
    >
      <span
        className={cn("text-muted-foreground flex-shrink-0", labelClassName)}
      >
        {label}
      </span>
      <div className="flex items-center gap-1 min-w-0 text-right">
        <span
          className={cn(
            "text-foreground",
            truncate && "truncate max-w-[200px]",
            mono && "font-mono text-xs",
            valueClassName
          )}
          title={truncate && typeof value === "string" ? value : undefined}
        >
          {displayValue}
        </span>
        {copyable && value && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 flex-shrink-0"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
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
    <div className={cn("divide-y", className)}>
      {items.map((item, idx) => (
        <KeyValueRow key={idx} {...item} />
      ))}
    </div>
  );
}
