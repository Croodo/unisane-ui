"use client";

import { Icon, Typography } from "@unisane/ui";

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex gap-4 p-4 rounded-lg border border-outline-variant/20">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon symbol={icon} className="w-5 h-5 text-primary" />
      </div>
      <div>
        <Typography variant="titleSmall" className="text-on-surface mb-1">
          {title}
        </Typography>
        <Typography variant="bodySmall" className="text-on-surface-variant">
          {description}
        </Typography>
      </div>
    </div>
  );
}
