"use client";

import { useTheme, IconButton, type ColorTheme } from "@unisane/ui";

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
    <IconButton
      variant="filled"
      size="lg"
      onClick={cycleTheme}
      ariaLabel={`Color theme: ${THEME_LABELS[colorTheme]}. Click to change.`}
      className="border-2 border-outline-variant"
    />
  );
}
