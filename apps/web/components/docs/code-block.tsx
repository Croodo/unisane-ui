"use client";

import { cn } from "@unisane/ui/lib/utils";

interface CodeBlockProps {
  code: string;
  className?: string;
}

export function CodeBlock({ code, className }: CodeBlockProps) {
  return (
    <div
      className={cn(
        "p-6u bg-surface-container-high rounded-large overflow-x-auto",
        className
      )}
    >
      <pre className="text-body-small font-mono leading-relaxed">
        <code className="text-on-surface">{code}</code>
      </pre>
    </div>
  );
}
