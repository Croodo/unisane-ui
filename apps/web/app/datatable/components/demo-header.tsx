"use client";

import { Typography } from "@unisane/ui";

interface DemoHeaderProps {
  title: string;
  description: string;
}

export function DemoHeader({ title, description }: DemoHeaderProps) {
  return (
    <div className="border-b border-outline-variant/30">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <Typography variant="headlineLarge" className="text-on-surface mb-2">
          {title}
        </Typography>
        <Typography variant="bodyLarge" className="text-on-surface-variant">
          {description}
        </Typography>
      </div>
    </div>
  );
}
