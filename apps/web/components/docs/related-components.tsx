"use client";

import Link from "next/link";
import type { RelatedComponent } from "@/lib/docs/types";
import { getComponentBySlug } from "@/lib/docs/data";
import { cn } from "@unisane/ui/lib/utils";

interface RelatedComponentsProps {
  related: RelatedComponent[];
  className?: string;
}

export function RelatedComponents({
  related,
  className,
}: RelatedComponentsProps) {
  if (!related.length) return null;

  return (
    <div className={cn("grid grid-cols-1 @lg:grid-cols-2 @2xl:grid-cols-3 gap-4", className)}>
      {related.map((item) => {
        const component = getComponentBySlug(item.slug);
        if (!component) return null;

        return (
          <Link
            key={item.slug}
            href={`/docs/components/${item.slug}`}
            className="group block"
          >
            <div className="p-6 rounded-lg bg-surface-container-low border border-outline-variant/15 hover:bg-surface-container hover:border-outline-variant/30 transition-all">
              <div className="flex items-center gap-3 mb-3">
                {component.icon && (
                  <div className="w-10 h-10 rounded-md bg-primary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px] text-on-primary-container">
                      {component.icon}
                    </span>
                  </div>
                )}
                <span className="text-title-small font-semibold text-on-surface group-hover:text-primary transition-colors">
                  {component.name}
                </span>
              </div>
              <p className="text-body-small text-on-surface-variant line-clamp-2">
                {item.reason}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
