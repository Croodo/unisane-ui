import { type ReactNode } from "react";
import { cn } from "@ui/lib/utils";

export interface LinkCardProps {
  title: string;
  children: ReactNode;
  href: string;
  className?: string;
}

/**
 * LinkCard - A simple external link card component.
 * For the full Card component with variants, see components/card.tsx
 */
export function LinkCard({
  title,
  children,
  href,
  className,
}: LinkCardProps) {
  return (
    <a
      className={cn(
        "group relative block rounded-md border border-outline-variant/20 px-5 py-4",
        "bg-surface-container transition-colors duration-short ease-standard",
        "hover:border-outline hover:bg-surface-container-high",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className
      )}
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      <h2 className="mb-3 text-title-large font-semibold text-on-surface">
        {title}{" "}
        <span
          className="inline-block transition-transform duration-short ease-standard group-hover:translate-x-1 motion-reduce:transform-none"
          aria-hidden="true"
        >
          →
        </span>
      </h2>
      <p className="m-0 max-w-[30ch] text-body-small text-on-surface-variant">
        {children}
      </p>
    </a>
  );
}

// Backwards compatibility alias
export const Card = LinkCard;
