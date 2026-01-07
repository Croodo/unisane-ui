import React from 'react';
import { cn } from '@/src/lib/utils';
import Inset from '@/src/components/layout/Inset';

export function PageHeader({
  title,
  subtitle,
  actions,
  leading,
  fullBleed = false,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  leading?: React.ReactNode;
  fullBleed?: boolean;
  className?: string;
}) {
  const Row = (
    <div className="flex items-center justify-between py-3">
      <div className="min-w-0 flex items-center gap-2">
        {leading ? <div className="shrink-0">{leading}</div> : null}
        <div className="min-w-0">
          <h1 className="truncate text-xl sm:text-2xl font-semibold">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="ml-4 shrink-0">{actions}</div> : null}
    </div>
  );
  return (
    <div
      className={cn(
        'sticky top-[var(--app-header-h)] z-[1] bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className,
      )}
    >
      {fullBleed ? <Inset>{Row}</Inset> : Row}
    </div>
  );
}

export default PageHeader;
