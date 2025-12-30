"use client";

import { useState, useEffect } from "react";
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
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only showing dynamic content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const cycleTheme = () => {
    const currentIndex = THEME_ORDER.indexOf(colorTheme);
    const nextIndex = (currentIndex + 1) % THEME_ORDER.length;
    const nextTheme = THEME_ORDER[nextIndex] ?? "blue";
    setColorTheme(nextTheme);
  };

  // Use static label until mounted to avoid hydration mismatch
  const ariaLabel = mounted
    ? `Color theme: ${THEME_LABELS[colorTheme]}. Click to change.`
    : "Color theme. Click to change.";

  return (
    <IconButton
      variant="filled"
      size="lg"
      onClick={cycleTheme}
      ariaLabel={ariaLabel}
      className="border-2 border-outline-variant"
    />
  );
}
