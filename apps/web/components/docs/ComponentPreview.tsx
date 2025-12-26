"use client";

import React from "react";
import { cn, Typography, Surface } from "@unisane/ui";

interface ComponentPreviewProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function ComponentPreview({
  children,
  className,
  title,
}: ComponentPreviewProps) {
  return (
    <div className={cn("my-6u", className)}>
      {title && (
        <Typography variant="labelMedium" className="mb-2u text-on-surface-variant">
          {title}
        </Typography>
      )}
      <Surface elevation={0} className="p-6u rounded-large bg-surface-container border border-outline-variant/50 flex items-center justify-center min-h-[120px]">
        {children}
      </Surface>
    </div>
  );
}
