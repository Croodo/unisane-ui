"use client";

import { useState } from "react";
import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";
import { SegmentedButton } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const SegmentedButtonHeroVisual = () => (
  <HeroBackground tone="primary">
    {/* Mock View Toggle */}
    <div className="relative bg-surface w-80 rounded-xl shadow-xl overflow-hidden border border-outline-variant/30 p-6">
      <div className="text-title-medium text-on-surface mb-4">View Options</div>
      <div className="inline-flex rounded-sm border border-outline-variant overflow-hidden">
        <div className="px-4 py-2 bg-secondary-container text-on-secondary-container flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check</span>
          <span className="text-label-medium">Grid</span>
        </div>
        <div className="px-4 py-2 text-on-surface-variant border-l border-outline-variant">
          <span className="text-label-medium">List</span>
        </div>
        <div className="px-4 py-2 text-on-surface-variant border-l border-outline-variant">
          <span className="text-label-medium">Cards</span>
        </div>
      </div>
    </div>
  </HeroBackground>
);

// ─── INTERACTIVE EXAMPLES ────────────────────────────────────────────────────
const SegmentedButtonSingleExample = () => {
  const [value, setValue] = useState("day");
  return (
    <SegmentedButton
      options={[
        { value: "day", label: "Day" },
        { value: "week", label: "Week" },
        { value: "month", label: "Month" },
      ]}
      value={value}
      onChange={(v) => setValue(v as string)}
    />
  );
};

const SegmentedButtonMultiExample = () => {
  const [value, setValue] = useState<string[]>(["bold"]);
  return (
    <SegmentedButton
      options={[
        { value: "bold", label: "B", icon: <span className="font-bold">B</span> },
        { value: "italic", label: "I", icon: <span className="italic">I</span> },
        { value: "underline", label: "U", icon: <span className="underline">U</span> },
      ]}
      value={value}
      onChange={(v) => setValue(v as string[])}
      multiSelect
    />
  );
};

export const segmentedButtonDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "segmented-button",
  name: "Segmented Button",
  description:
    "Segmented buttons help users select options, switch views, or sort elements.",
  category: "actions",
  status: "stable",
  icon: "view_week",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["SegmentedButton", "SegmentedButtonItem"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <SegmentedButtonHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Choose between single and multi-select based on the interaction model.",
    columns: {
      emphasis: "Type",
      component: "Preview",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Single select",
        component: (
          <SegmentedButton
            options={[
              { value: "a", label: "One" },
              { value: "b", label: "Two" },
            ]}
            value="a"
            onChange={() => {}}
          />
        ),
        rationale: "Only one option can be active at a time.",
        examples: "View switcher, Time range, Sort order",
      },
      {
        emphasis: "Multi select",
        component: (
          <SegmentedButton
            options={[
              { value: "a", label: "A" },
              { value: "b", label: "B" },
              { value: "c", label: "C" },
            ]}
            value={["a", "b"]}
            onChange={() => {}}
            multiSelect
          />
        ),
        rationale: "Multiple options can be selected.",
        examples: "Text formatting, Filters, Tags",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Segmented buttons are used for related choices that affect content display.",
    examples: [
      {
        title: "Single selection",
        visual: <SegmentedButtonSingleExample />,
        caption: "Select one option at a time",
      },
      {
        title: "Multi selection",
        visual: <SegmentedButtonMultiExample />,
        caption: "Toggle multiple options",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "options",
      type: "SegmentedButtonOption[]",
      description: "Array of options with value, label, and optional icon.",
    },
    {
      name: "value",
      type: "string | string[]",
      description: "Selected value(s).",
    },
    {
      name: "onChange",
      type: "(value: string | string[]) => void",
      description: "Callback fired when selection changes.",
    },
    {
      name: "multiSelect",
      type: "boolean",
      default: "false",
      description: "Allow multiple selections.",
    },
    {
      name: "density",
      type: '"default" | "high"',
      default: '"default"',
      description: "Density of the button group.",
    },
    {
      name: "className",
      type: "string",
      description: "Additional CSS classes.",
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Uses role='radiogroup' for single select.",
      "Uses role='group' with checkboxes for multi-select.",
      "aria-checked indicates selection state.",
    ],
    keyboard: [
      { key: "Tab", description: "Move focus to/from button group" },
      { key: "Arrow Keys", description: "Navigate between options" },
      { key: "Space/Enter", description: "Toggle selection" },
    ],
    focus: [
      "Focus ring visible on focused segment.",
      "Selected state clearly indicated visually.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Use controlled value for selection state.",
    code: `import { SegmentedButton } from "@unisane/ui";
import { useState } from "react";

function ViewSwitcher() {
  const [view, setView] = useState("grid");

  return (
    <SegmentedButton
      options={[
        { value: "grid", label: "Grid" },
        { value: "list", label: "List" },
        { value: "table", label: "Table" },
      ]}
      value={view}
      onChange={(v) => setView(v as string)}
    />
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "tabs",
      reason: "Use for content sections with separate panels.",
    },
    {
      slug: "radio",
      reason: "Use for form input with visible options.",
    },
    {
      slug: "chip",
      reason: "Use for filterable tags or categories.",
    },
  ],
};
