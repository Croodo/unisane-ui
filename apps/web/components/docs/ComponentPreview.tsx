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
    <div className={cn("my-6", className)}>
      {title && (
        <Typography variant="labelMedium" className="mb-2 text-on-surface-variant">
          {title}
        </Typography>
      )}
      <Surface elevation={0} className="p-6 rounded-lg bg-surface-container border border-outline-variant/50 flex items-center justify-center min-h-[120px]">
        {children}
      </Surface>
    </div>
  );
}
