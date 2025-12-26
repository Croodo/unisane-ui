import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

const breadcrumbLinkVariants = cva("flex items-center gap-1u text-body-medium", {
  variants: {
    variant: {
      link: "text-primary hover:underline",
      current: "text-on-surface",
      ellipsis: "text-on-surface-variant",
    },
  },
  defaultVariants: {
    variant: "link",
  },
});

interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  maxItems?: number;
}

export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(
  ({ items, separator, maxItems, className, ...props }, ref) => {
    const defaultSeparator = (
      <span className="material-symbols-outlined text-on-surface-variant w-4u h-4u">
        chevron_right
      </span>
    );

    const displayedItems = maxItems && items.length > maxItems
      ? [
          ...items.slice(0, 1),
          { label: "...", href: undefined },
          ...items.slice(-(maxItems - 2)),
        ]
      : items;

    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={className}
        {...props}
      >
        <ol className="flex items-center gap-2u flex-wrap">
          {displayedItems.map((item, index) => {
            const isLast = index === displayedItems.length - 1;
            const isEllipsis = item.label === "...";

            return (
              <li key={index} className="flex items-center gap-2u">
                {item.href && !isLast ? (
                  <a
                    href={item.href}
                    className={cn(breadcrumbLinkVariants({ variant: "link" }))}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </a>
                ) : (
                  <span
                    className={cn(
                      breadcrumbLinkVariants({
                        variant: isLast ? "current" : "ellipsis",
                      })
                    )}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                )}

                {!isLast && (
                  <span className="text-on-surface-variant" aria-hidden="true">
                    {separator || defaultSeparator}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }
);

Breadcrumb.displayName = "Breadcrumb";