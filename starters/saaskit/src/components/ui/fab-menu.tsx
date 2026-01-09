"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/src/lib/utils";
import { Fab } from "./fab";
import { Icon } from "@/src/primitives/icon";

export interface FabAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export interface FabMenuProps {
  mainIcon?: React.ReactNode;
  activeIcon?: React.ReactNode;
  actions: FabAction[];
  className?: string;
  "aria-label"?: string;
}

export const FabMenu: React.FC<FabMenuProps> = ({
  mainIcon = <Icon symbol="add" />,
  activeIcon = <Icon symbol="close" />,
  actions,
  className,
  "aria-label": ariaLabel = "Actions menu",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={cn("relative flex flex-col items-end gap-4 z-50", className)}
    >
      <div
        className={cn(
          "flex flex-col items-end gap-3 transition-all duration-medium ease-smooth",
          isOpen
            ? "opacity-100 translate-y-0 visible"
            : "opacity-0 translate-y-10 invisible pointer-events-none"
        )}
        role="menu"
        aria-label={ariaLabel}
        aria-hidden={!isOpen}
      >
        {actions.map((action, index) => (
          <div key={index} className="flex items-center gap-3 group" role="none">
            <span className="bg-inverse-surface text-inverse-on-surface text-label-small font-medium py-1 px-2 rounded-sm shadow-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap" aria-hidden="true">
              {action.label}
            </span>
            <Fab
              size="sm"
              variant="secondary"
              icon={action.icon}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
                setIsOpen(false);
              }}
              aria-label={action.label}
              role="menuitem"
              tabIndex={isOpen ? 0 : -1}
            />
          </div>
        ))}
      </div>

      <Fab
        variant={isOpen ? "tertiary" : "primary"}
        size="md"
        className={cn(
          "transition-transform duration-emphasized",
          isOpen ? "rotate-90" : "rotate-0"
        )}
        onClick={() => setIsOpen(!isOpen)}
        icon={isOpen ? activeIcon : mainIcon}
        aria-label={isOpen ? "Close menu" : ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      />
    </div>
  );
};
