"use client";

import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";
import { Radio, Card } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const RadioHeroVisual = () => (
  <HeroBackground tone="secondary">
    {/* Mock Settings Card */}
    <div className="relative bg-surface w-72 rounded-xl shadow-xl overflow-hidden border border-outline-variant/30">
      <div className="px-5 py-4 border-b border-outline-variant/20">
        <span className="text-title-medium text-on-surface">Select Plan</span>
      </div>
      <div className="p-4 space-y-1">
        <div className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-surface-container-low">
          <div>
            <div className="text-body-medium text-on-surface">Basic</div>
            <div className="text-body-small text-on-surface-variant">$9/month</div>
          </div>
          <Radio name="plan" />
        </div>
        <div className="flex items-center justify-between py-2 px-2 rounded-lg bg-primary-container/30">
          <div>
            <div className="text-body-medium text-on-surface">Pro</div>
            <div className="text-body-small text-on-surface-variant">$29/month</div>
          </div>
          <Radio name="plan" defaultChecked />
        </div>
        <div className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-surface-container-low">
          <div>
            <div className="text-body-medium text-on-surface">Enterprise</div>
            <div className="text-body-small text-on-surface-variant">Custom</div>
          </div>
          <Radio name="plan" />
        </div>
      </div>
    </div>
  </HeroBackground>
);

export const radioDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "radio",
  name: "Radio",
  description:
    "Radio buttons let users select one option from a set of mutually exclusive choices.",
  category: "selection",
  status: "stable",
  icon: "radio_button_checked",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["Radio"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <RadioHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Radio buttons have two states. Only one option in a group can be selected at a time.",
    columns: {
      emphasis: "State",
      component: "Example",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Unselected",
        component: (
          <Radio readOnly className="pointer-events-none" />
        ),
        rationale:
          "Default state indicating an option is available but not chosen.",
        examples: "Available options, Default state",
      },
      {
        emphasis: "Selected",
        component: (
          <Radio defaultChecked readOnly className="pointer-events-none" />
        ),
        rationale:
          "Indicates the currently selected option in the group.",
        examples: "Current selection, Active choice",
      },
      {
        emphasis: "Error",
        component: (
          <Radio error readOnly className="pointer-events-none" />
        ),
        rationale:
          "Shows when selection is required but not made.",
        examples: "Required fields, Validation errors",
      },
      {
        emphasis: "Disabled",
        component: (
          <Radio disabled readOnly className="pointer-events-none" />
        ),
        rationale:
          "Option is visible but cannot be selected.",
        examples: "Unavailable options, Premium features",
      },
    ],
  },

  // ─── HIERARCHY SECTION ─────────────────────────────────────────────────────
  hierarchy: {
    description:
      "Radio buttons can be used standalone or with labels for clear identification.",
    items: [
      {
        component: <Radio label="With label" defaultChecked />,
        title: "With label",
        subtitle: "Most common usage",
      },
      {
        component: <Radio defaultChecked />,
        title: "Without label",
        subtitle: "When context is clear",
      },
      {
        component: <Radio label="Disabled" disabled />,
        title: "Disabled",
        subtitle: "Non-interactive",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Radio buttons are commonly used in forms and settings where only one choice is allowed.",
    examples: [
      {
        title: "Vertical radio group",
        visual: (
          <div className="space-y-3">
            <Radio name="shipping" label="Standard (5-7 days)" defaultChecked />
            <Radio name="shipping" label="Express (2-3 days)" />
            <Radio name="shipping" label="Overnight" />
          </div>
        ),
        caption: "Vertical list for single selection",
      },
      {
        title: "Card selection",
        visual: (
          <div className="w-full max-w-xs border border-outline-variant/20 rounded-lg overflow-hidden">
            {["Small", "Medium", "Large"].map((size, i) => (
              <div key={size} className={`flex items-center gap-3 px-4 py-3 border-b border-outline-variant/20 last:border-0 ${i === 1 ? "bg-primary-container/20" : "bg-surface"}`}>
                <Radio name="size" defaultChecked={i === 1} />
                <span className="text-body-medium text-on-surface">{size}</span>
              </div>
            ))}
          </div>
        ),
        caption: "Radio buttons in list items",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "label",
      type: "string",
      description: "Text label displayed next to the radio button.",
    },
    {
      name: "checked",
      type: "boolean",
      description: "Whether the radio button is selected.",
    },
    {
      name: "name",
      type: "string",
      description: "Groups radio buttons together. Only one in a group can be selected.",
    },
    {
      name: "value",
      type: "string",
      description: "The value submitted with form data.",
    },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "If true, the radio button is disabled.",
    },
    {
      name: "error",
      type: "boolean",
      default: "false",
      description: "If true, displays the radio in an error state.",
    },
    {
      name: "onChange",
      type: "(event: ChangeEvent) => void",
      description: "Callback fired when the selection changes.",
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Uses native radio input for full screen reader support.",
      "Label is properly associated with the input.",
      "Group name creates logical grouping for screen readers.",
      "Disabled and error states are announced.",
    ],
    keyboard: [
      { key: "Space", description: "Selects the focused radio button" },
      { key: "Arrow Up/Down", description: "Moves focus within the radio group" },
      { key: "Tab", description: "Moves focus to the next element outside the group" },
    ],
    focus: [
      "Focus ring is clearly visible around the radio button.",
      "Arrow keys move focus within the same radio group.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Use controlled state to manage radio button selection.",
    code: `import { Radio } from "@unisane/ui";
import { useState } from "react";

function ShippingOptions() {
  const [shipping, setShipping] = useState("standard");

  return (
    <div className="space-y-3">
      <Radio
        name="shipping"
        label="Standard (5-7 days)"
        value="standard"
        checked={shipping === "standard"}
        onChange={() => setShipping("standard")}
      />
      <Radio
        name="shipping"
        label="Express (2-3 days)"
        value="express"
        checked={shipping === "express"}
        onChange={() => setShipping("express")}
      />
      <Radio
        name="shipping"
        label="Overnight"
        value="overnight"
        checked={shipping === "overnight"}
        onChange={() => setShipping("overnight")}
      />
    </div>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "checkbox",
      reason: "Use when multiple options can be selected.",
    },
    {
      slug: "select",
      reason: "Use for single selection with many options.",
    },
    {
      slug: "switch",
      reason: "Use for binary on/off toggles.",
    },
  ],
};
