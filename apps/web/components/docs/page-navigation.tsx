"use client";

import Link from "next/link";
import { Card, Icon } from "@unisane/ui";
import { cn } from "@unisane/ui/lib/utils";

interface PageLink {
  slug: string;
  name: string;
}

interface PageNavigationProps {
  previous?: PageLink;
  next?: PageLink;
  className?: string;
}

export function PageNavigation({ previous, next, className }: PageNavigationProps) {
  if (!previous && !next) return null;

  return (
    <div className={cn("grid grid-cols-1 @md:grid-cols-2 gap-4u", className)}>
      {/* Previous */}
      {previous ? (
        <Link href={`/docs/components/${previous.slug}`} className="group">
          <Card
            variant="filled"
            padding="lg"
            className="h-full rounded-lg transition-all hover:bg-surface-container-high"
          >
            <div className="flex items-center gap-2u text-body-small text-on-surface-variant mb-2u">
              <Icon size="sm">arrow_back</Icon>
              <span>Previous</span>
            </div>
            <span className="text-title-large font-medium text-on-surface group-hover:text-primary transition-colors">
              {previous.name}
            </span>
          </Card>
        </Link>
      ) : (
        <div />
      )}

      {/* Next */}
      {next ? (
        <Link href={`/docs/components/${next.slug}`} className="group">
          <Card
            variant="filled"
            padding="lg"
            className="h-full rounded-lg transition-all hover:bg-surface-container-high"
          >
            <div className="flex items-center justify-end gap-2u text-body-small text-on-surface-variant mb-2u">
              <span>Up next</span>
              <Icon size="sm">arrow_forward</Icon>
            </div>
            <span className="text-title-large font-medium text-on-surface text-right block group-hover:text-primary transition-colors">
              {next.name}
            </span>
          </Card>
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}
