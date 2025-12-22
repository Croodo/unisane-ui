"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Typography,
  cn,
} from "@unisane/ui";
import { NavGroup } from "./nav";

const isActive = (pathname: string, href: string) => {
  if (href === "/docs" || href === "/components") {
    return pathname === href;
  }
  return pathname.startsWith(href);
};

interface DocsSidebarProps {
  onSelect?: () => void;
  groups: NavGroup[];
}

export const DocsSidebar: React.FC<DocsSidebarProps> = ({
  onSelect,
  groups,
}) => {
  const pathname = usePathname();

  // Determine which groups should be open by default based on active path
  const defaultOpen = groups
    .filter((g) => g.items.some((item) => isActive(pathname, item.href)))
    .map((g) => g.title);

  // If no group is active (e.g. root), maybe open the first one?
  // Or just let Accordion handle it. passing defaultValue only works on initial render.
  // For persistent state we'd need controlled component, but un-controlled is fine for now.

  return (
    <Accordion
      type="multiple"
      defaultValue={groups.map((g) => g.title)} // Default all open
      className="bg-transparent border-none gap-2u"
    >
      {groups.map((group) => (
        <AccordionItem
          key={group.title}
          value={group.title}
          className="border-none"
        >
          <AccordionTrigger>
            <span className="text-on-surface-variant font-black uppercase tracking-[0.2em] text-[10px]">
              {group.title}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-1u">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={onSelect}
                    className={cn(
                      "flex items-center gap-3u px-3u py-2u rounded-full text-[13px] font-medium transition-all duration-short",
                      active
                        ? "bg-secondary-container text-on-secondary-container font-bold shadow-sm"
                        : "text-on-surface hover:bg-surface-container-high/50 hover:text-on-surface"
                    )}
                  >
                    {/* Optional: Add dot indicator for active state if needed, or icon */}
                    {active && (
                      <span className="w-1.5u h-1.5u rounded-full bg-primary shrink-0 animate-in zoom-in duration-300" />
                    )}
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
