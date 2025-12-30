"use client";

import { useState, useEffect } from "react";
import {
  useTheme,
  Popover,
  Slider,
  type ColorTheme,
  type Density,
  type RadiusTheme,
  type ColorScheme,
  type ContrastLevel,
  type Elevation,
} from "@unisane/ui";

// Color theme options with visual indicators
const COLOR_THEMES: { value: ColorTheme; label: string; hue: number }[] = [
  { value: "blue", label: "Blue", hue: 240 },
  { value: "purple", label: "Purple", hue: 285 },
  { value: "pink", label: "Pink", hue: 340 },
  { value: "red", label: "Red", hue: 25 },
  { value: "orange", label: "Orange", hue: 55 },
  { value: "yellow", label: "Yellow", hue: 85 },
  { value: "green", label: "Green", hue: 145 },
  { value: "cyan", label: "Cyan", hue: 195 },
  { value: "neutral", label: "Neutral", hue: 60 },
  { value: "black", label: "Black", hue: 0 },
];

const DENSITY_OPTIONS: { value: Density; label: string }[] = [
  { value: "dense", label: "Dense" },
  { value: "compact", label: "Compact" },
  { value: "standard", label: "Standard" },
  { value: "comfortable", label: "Comfortable" },
];

const RADIUS_OPTIONS: { value: RadiusTheme; label: string }[] = [
  { value: "none", label: "None" },
  { value: "minimal", label: "Minimal" },
  { value: "sharp", label: "Sharp" },
  { value: "standard", label: "Standard" },
  { value: "soft", label: "Soft" },
];

const SCHEME_OPTIONS: { value: ColorScheme; label: string }[] = [
  { value: "tonal", label: "Tonal" },
  { value: "neutral", label: "Neutral" },
  { value: "monochrome", label: "Mono" },
];

const CONTRAST_OPTIONS: { value: ContrastLevel; label: string; index: number }[] = [
  { value: "standard", label: "Standard", index: 0 },
  { value: "medium", label: "Medium", index: 1 },
  { value: "high", label: "High", index: 2 },
];

const ELEVATION_OPTIONS: { value: Elevation; label: string }[] = [
  { value: "flat", label: "Flat" },
  { value: "subtle", label: "Subtle" },
  { value: "standard", label: "Standard" },
  { value: "pronounced", label: "Pronounced" },
];

// Segmented button for appearance mode
function AppearanceToggle({
  value,
  onChange,
}: {
  value: "light" | "dark" | "system";
  onChange: (value: "light" | "dark" | "system") => void;
}) {
  const options = [
    { value: "light" as const, label: "Light", icon: "light_mode" },
    { value: "system" as const, label: "System", icon: "desktop_windows" },
    { value: "dark" as const, label: "Dark", icon: "dark_mode" },
  ];

  return (
    <div className="flex rounded-lg bg-surface-container-high p-1 gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`
            flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-label-large font-medium transition-all duration-short
            ${value === opt.value
              ? "bg-surface shadow-1 text-on-surface"
              : "text-on-surface-variant hover:text-on-surface"
            }
          `}
        >
          <span className="material-symbols-outlined text-[18px]">{opt.icon}</span>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// Color swatch with checkmark for selected
function ColorSwatch({
  hue,
  selected,
  onClick,
  label,
  isBlack,
  isNeutral,
}: {
  hue: number;
  selected: boolean;
  onClick: () => void;
  label: string;
  isBlack?: boolean;
  isNeutral?: boolean;
}) {
  const bgColor = isBlack
    ? "#3a3a3a"
    : isNeutral
    ? "#6b7280"
    : `oklch(0.6 0.18 ${hue})`;

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="w-10 h-10 rounded-full transition-all duration-short flex items-center justify-center hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      style={{ backgroundColor: bgColor }}
      aria-label={label}
      aria-pressed={selected}
    >
      {selected && (
        <span className="material-symbols-outlined text-white text-[20px] drop-shadow-sm">
          check
        </span>
      )}
    </button>
  );
}

// Grid button for density options (2x2 grid)
function DensityButton({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex-1 py-3 px-4 rounded-lg text-label-large font-medium transition-all duration-short
        ${selected
          ? "bg-primary-container text-on-primary-container ring-2 ring-primary"
          : "bg-surface-container text-on-surface hover:bg-surface-container-high"
        }
      `}
    >
      {label}
    </button>
  );
}

// Pill button for inline options
function PillButton({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex-1 py-2 px-3 rounded-lg text-label-medium font-medium transition-all duration-short text-center
        ${selected
          ? "bg-primary-container text-on-primary-container"
          : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
        }
      `}
    >
      {label}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-label-medium text-on-surface-variant font-medium uppercase tracking-wide mb-3">
      {children}
    </div>
  );
}

function SectionDescription({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-body-small text-on-surface-variant mt-2">
      {children}
    </div>
  );
}

export function ThemeSettings() {
  const {
    colorTheme,
    setColorTheme,
    theme,
    setTheme,
    density,
    setDensity,
    radius,
    setRadius,
    scheme,
    setScheme,
    contrast,
    setContrast,
    elevation,
    setElevation,
  } = useTheme();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get contrast slider value
  const contrastIndex = CONTRAST_OPTIONS.find((c) => c.value === contrast)?.index ?? 0;
  const contrastLabel = CONTRAST_OPTIONS.find((c) => c.value === contrast)?.label ?? "Standard";

  const handleContrastChange = (value: number) => {
    const option = CONTRAST_OPTIONS.find((c) => c.index === value);
    if (option) {
      setContrast(option.value);
    }
  };

  // Prevent hydration mismatch - use same span as mounted state for consistency
  if (!mounted) {
    return (
      <span
        className="inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-on-surface/8 transition-colors cursor-pointer"
        aria-label="Theme settings"
      >
        <span className="material-symbols-outlined text-[24px]">tune</span>
      </span>
    );
  }

  const content = (
    <div className="w-[420px] p-6 space-y-6 max-h-[85vh] overflow-y-auto">
      {/* Header */}
      <div>
        <h2 className="text-headline-small font-semibold text-on-surface">Theme Settings</h2>
        <p className="text-body-medium text-on-surface-variant mt-1">
          Customize the look and feel of your interface.
        </p>
      </div>

      {/* Appearance Mode */}
      <div>
        <AppearanceToggle value={theme} onChange={setTheme} />
      </div>

      {/* Primary Color */}
      <div>
        <SectionLabel>Primary Color</SectionLabel>
        <div className="flex flex-wrap gap-3">
          {COLOR_THEMES.map((t) => (
            <ColorSwatch
              key={t.value}
              hue={t.hue}
              selected={colorTheme === t.value}
              onClick={() => setColorTheme(t.value)}
              label={t.label}
              isBlack={t.value === "black"}
              isNeutral={t.value === "neutral"}
            />
          ))}
        </div>
      </div>

      {/* Color Scheme */}
      <div>
        <SectionLabel>Color Scheme</SectionLabel>
        <div className="flex gap-2">
          {SCHEME_OPTIONS.map((s) => (
            <PillButton
              key={s.value}
              selected={scheme === s.value}
              onClick={() => setScheme(s.value)}
              label={s.label}
            />
          ))}
        </div>
      </div>

      {/* Density - 2x2 grid */}
      <div>
        <SectionLabel>Density</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {DENSITY_OPTIONS.map((d) => (
            <DensityButton
              key={d.value}
              selected={density === d.value}
              onClick={() => setDensity(d.value)}
              label={d.label}
            />
          ))}
        </div>
        <SectionDescription>
          Controls spacing and padding throughout the UI.
        </SectionDescription>
      </div>

      {/* Corner Radius */}
      <div>
        <SectionLabel>Corner Radius</SectionLabel>
        <div className="flex gap-1.5">
          {RADIUS_OPTIONS.map((r) => (
            <PillButton
              key={r.value}
              selected={radius === r.value}
              onClick={() => setRadius(r.value)}
              label={r.label}
            />
          ))}
        </div>
      </div>

      {/* Elevation */}
      <div>
        <SectionLabel>Elevation</SectionLabel>
        <div className="flex gap-1.5">
          {ELEVATION_OPTIONS.map((e) => (
            <PillButton
              key={e.value}
              selected={elevation === e.value}
              onClick={() => setElevation(e.value)}
              label={e.label}
            />
          ))}
        </div>
      </div>

      {/* Contrast - Slider */}
      <div>
        <SectionLabel>Contrast</SectionLabel>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Slider
              value={contrastIndex}
              onChange={handleContrastChange}
              min={0}
              max={2}
              step={1}
            />
          </div>
          <span className="text-label-large font-medium text-on-surface min-w-[72px] text-right">
            {contrastLabel}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <Popover
      trigger={
        <span
          className="inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-on-surface/8 transition-colors cursor-pointer"
          aria-label="Theme settings"
        >
          <span className="material-symbols-outlined text-[24px]">tune</span>
        </span>
      }
      content={content}
      side="right"
      align="end"
      className="!p-0 !min-w-0"
    />
  );
}
