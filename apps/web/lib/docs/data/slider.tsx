"use client";

import { ComponentDoc } from "../types";
import { Slider, Card } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const SliderHeroVisual = () => (
  <div className="relative w-full h-full bg-linear-to-br from-primary-container to-secondary-container flex items-center justify-center p-8 overflow-hidden isolate">
    {/* Decorative Circles */}
    <div className="absolute top-[-40px] left-[-40px] w-56 h-56 bg-primary/20 rounded-full blur-3xl" />
    <div className="absolute bottom-[-50px] right-[-30px] w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />

    {/* Mock Settings Card */}
    <div className="relative bg-surface w-[300px] rounded-3xl shadow-xl overflow-hidden border border-outline-variant/30 z-10">
      <div className="px-5u py-4u border-b border-outline-variant/20">
        <span className="text-title-medium text-on-surface">Settings</span>
      </div>
      <div className="p-5u space-y-6u">
        <div>
          <div className="flex justify-between mb-3u">
            <span className="text-body-small text-on-surface">Volume</span>
            <span className="text-body-small text-on-surface-variant">75%</span>
          </div>
          <Slider defaultValue={75} />
        </div>
        <div>
          <div className="flex justify-between mb-3u">
            <span className="text-body-small text-on-surface">Brightness</span>
            <span className="text-body-small text-on-surface-variant">50%</span>
          </div>
          <Slider defaultValue={50} />
        </div>
        <div>
          <div className="flex justify-between mb-3u">
            <span className="text-body-small text-on-surface">Speed</span>
          </div>
          <Slider defaultValue={30} withLabel />
        </div>
      </div>
    </div>
  </div>
);

export const sliderDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "slider",
  name: "Slider",
  description:
    "Sliders let users make selections from a range of values.",
  category: "selection",
  status: "stable",
  icon: "tune",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["Slider"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <SliderHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Sliders can display values with labels and tick marks for precise selection.",
    columns: {
      emphasis: "Type",
      component: "Example",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Basic",
        component: (
          <div className="w-32">
            <Slider defaultValue={50} />
          </div>
        ),
        rationale:
          "Simple value selection without visible feedback.",
        examples: "Volume, Brightness, Simple settings",
      },
      {
        emphasis: "With Label",
        component: (
          <div className="w-32">
            <Slider defaultValue={50} withLabel />
          </div>
        ),
        rationale:
          "Shows current value on hover/drag for precise selection.",
        examples: "Price range, Precise settings, Zoom level",
      },
      {
        emphasis: "With Ticks",
        component: (
          <div className="w-32">
            <Slider defaultValue={50} step={25} withTicks />
          </div>
        ),
        rationale:
          "Discrete steps with visual markers for fixed options.",
        examples: "Rating scale, Priority levels, Discrete values",
      },
      {
        emphasis: "Disabled",
        component: (
          <div className="w-32">
            <Slider defaultValue={50} disabled />
          </div>
        ),
        rationale:
          "Shows value but prevents interaction.",
        examples: "Read-only settings, Locked values",
      },
    ],
  },

  // ─── HIERARCHY SECTION ─────────────────────────────────────────────────────
  hierarchy: {
    description:
      "Sliders can be customized with labels, ticks, and step values.",
    items: [
      {
        component: <Slider defaultValue={50} className="w-32" />,
        title: "Basic",
        subtitle: "Continuous value",
      },
      {
        component: <Slider defaultValue={50} withLabel className="w-32" />,
        title: "With Label",
        subtitle: "Shows value on interact",
      },
      {
        component: <Slider defaultValue={50} step={20} withTicks className="w-32" />,
        title: "With Ticks",
        subtitle: "Discrete steps",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Sliders are commonly used in settings panels, media controls, and range filters.",
    examples: [
      {
        title: "Settings panel",
        visual: (
          <Card variant="outlined" padding="md" className="max-w-[280px] mx-auto">
            <div className="text-title-small text-on-surface mb-4u">Audio Settings</div>
            <div className="space-y-5u">
              <div>
                <div className="flex justify-between text-body-small mb-2u">
                  <span className="text-on-surface">Master Volume</span>
                  <span className="text-on-surface-variant">80%</span>
                </div>
                <Slider defaultValue={80} />
              </div>
              <div>
                <div className="flex justify-between text-body-small mb-2u">
                  <span className="text-on-surface">Music</span>
                  <span className="text-on-surface-variant">60%</span>
                </div>
                <Slider defaultValue={60} />
              </div>
              <div>
                <div className="flex justify-between text-body-small mb-2u">
                  <span className="text-on-surface">Effects</span>
                  <span className="text-on-surface-variant">40%</span>
                </div>
                <Slider defaultValue={40} />
              </div>
            </div>
          </Card>
        ),
        caption: "Multiple sliders in a settings card",
      },
      {
        title: "Media player",
        visual: (
          <Card variant="outlined" padding="lg" className="max-w-[280px] mx-auto">
            <div className="flex flex-col items-center gap-4u">
              <div className="text-body-small text-on-surface-variant">Now Playing</div>
              <div className="w-full">
                <Slider defaultValue={35} />
              </div>
              <div className="flex justify-between w-full text-body-small text-on-surface-variant">
                <span>1:24</span>
                <span>3:45</span>
              </div>
            </div>
          </Card>
        ),
        caption: "Slider as a progress/seek bar",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "value",
      type: "number",
      description: "Controlled value of the slider.",
    },
    {
      name: "defaultValue",
      type: "number",
      default: "50",
      description: "Initial value for uncontrolled usage.",
    },
    {
      name: "min",
      type: "number",
      default: "0",
      description: "Minimum value of the range.",
    },
    {
      name: "max",
      type: "number",
      default: "100",
      description: "Maximum value of the range.",
    },
    {
      name: "step",
      type: "number",
      default: "1",
      description: "Step increment for value changes.",
    },
    {
      name: "withLabel",
      type: "boolean",
      default: "false",
      description: "Show value label on hover/drag.",
    },
    {
      name: "withTicks",
      type: "boolean",
      default: "false",
      description: "Show tick marks at step intervals.",
    },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "If true, the slider is disabled.",
    },
    {
      name: "onChange",
      type: "(value: number) => void",
      description: "Callback fired when the value changes.",
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Uses native range input for full screen reader support.",
      "aria-valuemin, aria-valuemax, and aria-valuenow are set appropriately.",
      "aria-orientation is set to horizontal.",
    ],
    keyboard: [
      { key: "Arrow Left/Down", description: "Decreases the value by one step" },
      { key: "Arrow Right/Up", description: "Increases the value by one step" },
      { key: "Home", description: "Sets to minimum value" },
      { key: "End", description: "Sets to maximum value" },
    ],
    focus: [
      "Focus ring is clearly visible around the slider thumb.",
      "Thumb enlarges on interaction for visual feedback.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Use controlled or uncontrolled state for slider values.",
    code: `import { Slider } from "@unisane/ui";
import { useState } from "react";

function VolumeControl() {
  const [volume, setVolume] = useState(50);

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <label htmlFor="volume">Volume</label>
        <span>{volume}%</span>
      </div>
      <Slider
        value={volume}
        onChange={setVolume}
        min={0}
        max={100}
        withLabel
      />
    </div>
  );
}

function DiscreteSlider() {
  const [rating, setRating] = useState(3);

  return (
    <div className="space-y-4">
      <label>Quality: {rating}/5</label>
      <Slider
        value={rating}
        onChange={setRating}
        min={1}
        max={5}
        step={1}
        withTicks
      />
    </div>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "progress",
      reason: "Use for read-only progress indication.",
    },
    {
      slug: "text-field",
      reason: "Use for precise numeric input.",
    },
    {
      slug: "radio",
      reason: "Use for discrete choices with labels.",
    },
  ],
};
