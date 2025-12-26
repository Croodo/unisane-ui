"use client";

import React from "react";
import { useColorScheme, type Theme } from "../layout/theme-provider";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const themeSwitcherVariants = cva(
  "inline-flex items-center rounded-sm border border-outline overflow-hidden",
  {
    variants: {
      size: {
        sm: "h-8u",
        md: "h-10u",
        lg: "h-12u",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

const themeButtonVariants = cva(
  "flex items-center justify-center gap-2u px-4u transition-colors duration-snappy relative",
  {
    variants: {
      active: {
        true: "bg-secondary-container text-on-secondary-container",
        false: "text-on-surface-variant hover:bg-surface-container",
      },
      size: {
        sm: "text-label-small",
        md: "text-label-medium",
        lg: "text-label-large",
      },
    },
    defaultVariants: {
      active: false,
      size: "md",
    },
  }
);

export interface ThemeSwitcherProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof themeSwitcherVariants> {
  showLabels?: boolean;
  showIcons?: boolean;
}

const themes: { value: Theme; label: string; icon: string }[] = [
  { value: "light", label: "Light", icon: "light_mode" },
  { value: "dark", label: "Dark", icon: "dark_mode" },
  { value: "system", label: "System", icon: "contrast" },
];

export const ThemeSwitcher = React.forwardRef<
  HTMLDivElement,
  ThemeSwitcherProps
>(({ className, size = "md", showLabels = true, showIcons = true, ...props }, ref) => {
  const { theme, setTheme } = useColorScheme();

  return (
    <div
      ref={ref}
      className={cn(themeSwitcherVariants({ size }), className)}
      role="radiogroup"
      aria-label="Theme selection"
      {...props}
    >
      {themes.map((t) => (
        <button
          key={t.value}
          type="button"
          role="radio"
          aria-checked={theme === t.value}
          onClick={() => setTheme(t.value)}
          className={cn(
            themeButtonVariants({ active: theme === t.value, size })
          )}
        >
          {showIcons && (
            <span
              className="material-symbols-outlined text-icon-sm"
              aria-hidden="true"
            >
              {t.icon}
            </span>
          )}
          {showLabels && <span>{t.label}</span>}
        </button>
      ))}
    </div>
  );
});

ThemeSwitcher.displayName = "ThemeSwitcher";
