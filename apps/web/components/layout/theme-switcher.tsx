"use client";

import { useTheme, type ColorTheme } from "@unisane/ui";

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

export function ThemeSwitcher() {
  const { colorTheme, setColorTheme } = useTheme();

  const cycleTheme = () => {
    const currentIndex = THEME_ORDER.indexOf(colorTheme);
    const nextIndex = (currentIndex + 1) % THEME_ORDER.length;
    const nextTheme = THEME_ORDER[nextIndex] ?? "blue";
    setColorTheme(nextTheme);
  };

  return (
    <button
      onClick={cycleTheme}
      aria-label={`Color theme: ${THEME_LABELS[colorTheme]}. Click to change.`}
      className="w-11 h-11 rounded-full bg-primary border-2 border-outline-variant hover:opacity-90 active:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
    />
  );
}
