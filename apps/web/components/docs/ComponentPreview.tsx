import React from "react";
import { Surface, Typography, cn } from "@unisane/ui";

interface ComponentPreviewProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const ComponentPreview: React.FC<ComponentPreviewProps> = ({
  title,
  description,
  children,
  className,
}) => {
  return (
    <Surface
      elevation={0}
      rounded="xs"
      className={cn(
        "border border-outline-variant/30 bg-surface overflow-hidden",
        className
      )}
    >
      <div className="px-6u py-4u border-b border-outline-variant/30 bg-surface-container-low/50">
        <div className="flex flex-col gap-1u">
          <Typography
            variant="labelSmall"
            className="text-on-surface-variant font-black uppercase tracking-[0.3em] text-[8px]"
          >
            {title}
          </Typography>
          {description && (
            <Typography variant="bodySmall" className="text-on-surface-variant">
              {description}
            </Typography>
          )}
        </div>
      </div>
      <div className="px-6u py-6u">
        <div className="flex flex-wrap items-center gap-3u">{children}</div>
      </div>
    </Surface>
  );
};
