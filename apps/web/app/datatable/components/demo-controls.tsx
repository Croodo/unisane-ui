"use client";

import { Typography, Switch, Chip } from "@unisane/ui";
import type { Density, PartialDataTableLocale } from "@unisane/data-table";

// ─── LOCALE OPTIONS ──────────────────────────────────────────────────────────

export type LocaleKey = "en" | "hi";

export interface LocaleOption {
  label: string;
  locale: PartialDataTableLocale;
}

// ─── FEATURE TOGGLE ──────────────────────────────────────────────────────────

interface FeatureToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function FeatureToggle({ label, checked, onChange }: FeatureToggleProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <Switch checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-body-medium">{label}</span>
    </label>
  );
}

// ─── DEMO CONTROLS ───────────────────────────────────────────────────────────

interface DemoControlsProps {
  features: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  }[];
  density: Density;
  onDensityChange: (density: Density) => void;
  localeKey?: LocaleKey;
  onLocaleChange?: (key: LocaleKey) => void;
  localeOptions?: Record<LocaleKey, LocaleOption>;
}

export function DemoControls({
  features,
  density,
  onDensityChange,
  localeKey,
  onLocaleChange,
  localeOptions,
}: DemoControlsProps) {
  return (
    <div className="border-b border-outline-variant/30">
      <div className="max-w-[1600px] mx-auto px-6 py-4">
        <Typography variant="titleMedium" className="text-on-surface mb-4">
          Feature Toggles
        </Typography>
        <div className="flex flex-wrap gap-6">
          {features.map((feature) => (
            <FeatureToggle
              key={feature.label}
              label={feature.label}
              checked={feature.checked}
              onChange={feature.onChange}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Typography variant="labelMedium" className="text-on-surface-variant">
              Density:
            </Typography>
            <div className="flex gap-2">
              {(["compact", "dense", "standard", "comfortable"] as const).map((d) => (
                <Chip
                  key={d}
                  variant="filter"
                  label={d.charAt(0).toUpperCase() + d.slice(1)}
                  selected={density === d}
                  onClick={() => onDensityChange(d)}
                />
              ))}
            </div>
          </div>

          {localeKey && onLocaleChange && localeOptions && (
            <>
              <div className="h-6 w-px bg-outline-variant hidden sm:block" />
              <div className="flex items-center gap-4">
                <Typography variant="labelMedium" className="text-on-surface-variant">
                  Locale (i18n):
                </Typography>
                <div className="flex gap-2">
                  {(Object.keys(localeOptions) as LocaleKey[]).map((key) => (
                    <Chip
                      key={key}
                      variant="filter"
                      label={localeOptions[key].label}
                      selected={localeKey === key}
                      onClick={() => onLocaleChange(key)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
