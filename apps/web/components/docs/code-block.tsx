"use client";

import { useState } from "react";
import { cn } from "@unisane/ui/lib/utils";
import { IconButton } from "@unisane/ui";

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeBlock({ code, language, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "relative group p-6u bg-surface-container-low rounded-lg overflow-x-auto border border-outline-variant/15",
        className
      )}
    >
      {/* Copy Button */}
      <div className="absolute top-2u right-2u opacity-0 group-hover:opacity-100 transition-opacity duration-short">
        <IconButton
          variant="standard"
          size="sm"
          ariaLabel={copied ? "Copied!" : "Copy code"}
          onClick={handleCopy}
        >
          <span className="material-symbols-outlined text-[20px]">
            {copied ? "check" : "content_copy"}
          </span>
        </IconButton>
      </div>

      {/* Language Badge */}
      {language && (
        <span className="absolute top-3u right-12u text-label-small text-on-surface-variant/60 font-mono">
          {language}
        </span>
      )}

      <pre className="text-body-small font-mono leading-relaxed">
        <code className="text-on-surface">{code}</code>
      </pre>
    </div>
  );
}
