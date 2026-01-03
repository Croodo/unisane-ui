"use client";

import { Typography } from "@unisane/ui";

interface DemoHeaderProps {
  title: string;
  description: string;
}

export function DemoHeader({ title, description }: DemoHeaderProps) {
  return (
    <div className="border-b border-outline-variant/30 -mx-4 medium:-mx-6 expanded:-mx-12 px-4 medium:px-6 expanded:px-12 py-8">
      <Typography variant="headlineLarge" className="text-on-surface mb-2">
        {title}
      </Typography>
      <Typography variant="bodyLarge" className="text-on-surface-variant">
        {description}
      </Typography>
    </div>
  );
}
