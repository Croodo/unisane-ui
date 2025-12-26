"use client";

import { useState } from "react";
import type { ExampleDef } from "@/lib/docs/types";
import { cn } from "@unisane/ui/lib/utils";
import { Surface } from "@unisane/ui";

interface ExamplePreviewProps {
  example: ExampleDef;
  className?: string;
}

export function ExamplePreview({ example, className }: ExamplePreviewProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");

  return (
    <div
      className={cn(
        "rounded-lg border border-outline-variant/30 overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6u py-4u bg-surface-container-low border-b border-outline-variant/15">
        <div>
          <h4 className="text-title-small font-semibold text-on-surface">
            {example.title}
          </h4>
          {example.description && (
            <p className="text-body-small text-on-surface-variant mt-1u">
              {example.description}
            </p>
          )}
        </div>

        {/* Tab Buttons */}
        {example.code && (
          <div className="flex gap-1u bg-surface-container rounded-md p-1u">
            <button
              onClick={() => setActiveTab("preview")}
              className={cn(
                "px-4u py-2u rounded-sm text-label-medium font-medium transition-colors",
                activeTab === "preview"
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:bg-on-surface/8"
              )}
            >
              Preview
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={cn(
                "px-4u py-2u rounded-sm text-label-medium font-medium transition-colors",
                activeTab === "code"
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:bg-on-surface/8"
              )}
            >
              Code
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="bg-surface">
        {activeTab === "preview" ? (
          <div className="p-8u flex items-center justify-center min-h-[120px]">
            {example.component}
          </div>
        ) : (
          <div className="p-6u bg-surface-container-high">
            <pre className="overflow-x-auto text-[13px] font-mono text-on-surface-variant leading-relaxed">
              <code>{example.code}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

interface ExampleGridProps {
  examples: ExampleDef[];
  className?: string;
}

export function ExampleGrid({ examples, className }: ExampleGridProps) {
  if (!examples.length) return null;

  return (
    <div className={cn("space-y-8u", className)}>
      {examples.map((example) => (
        <ExamplePreview key={example.id} example={example} />
      ))}
    </div>
  );
}
