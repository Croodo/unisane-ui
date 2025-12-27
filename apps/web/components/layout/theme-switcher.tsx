"use client";

import { useState, useEffect } from "react";

type ColorTheme =
  | "blue"
  | "purple"
  | "pink"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "cyan"
  | "neutral"
  | "black";

// Ordered like a color wheel: blue → purple → pink → red → orange → yellow → green → cyan
const THEME_ORDER: ColorTheme[] = [
  "blue",
  "purple",
  "pink",
  "red",
  "orange",
  "yellow",
  "green",
  "cyan",
  "neutral",
  "black",
];

const THEME_LABELS: Record<ColorTheme, string> = {
  blue: "Blue",
  purple: "Purple",
  pink: "Pink",
  red: "Red",
  orange: "Orange",
  yellow: "Yellow",
  green: "Green",
  cyan: "Cyan",
  neutral: "Neutral",
  black: "Black",
};

const STORAGE_KEY = "unisane-color-theme";

export function ThemeSwitcher() {
  const [colorTheme, setColorTheme] = useState<ColorTheme>("blue");

  // Load theme from localStorage on mount and apply it
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ColorTheme | null;
    const themeToApply = stored && THEME_ORDER.includes(stored) ? stored : "blue";
    setColorTheme(themeToApply);
    document.documentElement.setAttribute("data-theme", themeToApply);
  }, []);

  const cycleTheme = () => {
    const currentIndex = THEME_ORDER.indexOf(colorTheme);
    const nextIndex = (currentIndex + 1) % THEME_ORDER.length;
    const nextTheme = THEME_ORDER[nextIndex] as ColorTheme;

    setColorTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem(STORAGE_KEY, nextTheme);
  };

  return (
    <button
      onClick={cycleTheme}
      aria-label={`Color theme: ${THEME_LABELS[colorTheme]}. Click to change.`}
      className="w-11u h-11u rounded-full bg-primary border-2 border-outline-variant hover:opacity-90 active:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
    />
  );
}
