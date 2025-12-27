"use client";

import { useEffect, useState } from "react";
import { Typography } from "@unisane/ui";
import { cn } from "@unisane/ui/lib/utils";

interface TocItem {
  id: string;
  label: string;
}

interface TableOfContentsProps {
  title: string;
  items: TocItem[];
}

export function TableOfContents({ title, items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first visible section
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // Get the one closest to the top
          const closest = visibleEntries.reduce((prev, curr) => {
            return prev.boundingClientRect.top < curr.boundingClientRect.top
              ? prev
              : curr;
          });
          setActiveId(closest.target.id);
        }
      },
      {
        rootMargin: "-80px 0px -70% 0px",
        threshold: 0,
      }
    );

    // Observe all sections
    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [items]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setActiveId(id);
      // Update URL hash without jumping
      window.history.pushState(null, "", `#${id}`);
    }
  };

  return (
    <aside className="hidden @4xl:block w-64 shrink-0">
      <div className="sticky top-8u max-h-[calc(100vh-4rem)] overflow-y-auto">
        <Typography
          variant="labelMedium"
          component="span"
          className="mb-2u block text-on-surface-variant"
        >
          On this page
        </Typography>
        <Typography
          variant="headlineMedium"
          component="h4"
          className="mb-6u text-on-surface"
        >
          {title}
        </Typography>
        <nav className="flex flex-col gap-1u">
          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleClick(e, item.id)}
                className={cn(
                  "text-body-medium py-2u px-3u rounded-lg transition-all duration-short",
                  "text-left block",
                  isActive
                    ? "text-on-surface border border-outline-variant font-medium"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-on-surface/5 border border-transparent"
                )}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
