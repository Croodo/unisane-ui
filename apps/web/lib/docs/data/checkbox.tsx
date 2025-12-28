"use client";

import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";
import { Checkbox, Card } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const CheckboxHeroVisual = () => (
  <HeroBackground tone="secondary">
    {/* Mock Settings Card */}
    <div className="relative bg-surface w-[280px] rounded-3xl shadow-xl overflow-hidden border border-outline-variant/30">
      <div className="px-5 py-4 border-b border-outline-variant/20">
        <span className="text-title-medium text-on-surface">Notification Settings</span>
      </div>
      <div className="p-4 space-y-1">
        <div className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-surface-container-low">
          <span className="text-body-medium text-on-surface">Email notifications</span>
          <Checkbox defaultChecked />
        </div>
        <div className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-surface-container-low">
          <span className="text-body-medium text-on-surface">Push notifications</span>
          <Checkbox defaultChecked />
        </div>
        <div className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-surface-container-low">
          <span className="text-body-medium text-on-surface">SMS alerts</span>
          <Checkbox />
        </div>
        <div className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-surface-container-low">
          <span className="text-body-medium text-on-surface">Weekly digest</span>
          <Checkbox indeterminate />
        </div>
      </div>
    </div>
  </HeroBackground>
);

export const checkboxDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "checkbox",
  name: "Checkbox",
  description:
    "Checkboxes let users select one or more items from a list, or turn an item on or off.",
  category: "selection",
  status: "stable",
  icon: "check_box",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["Checkbox"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <CheckboxHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Checkboxes have three states. Use the appropriate state based on the selection status.",
    columns: {
      emphasis: "State",
      component: "Example",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Unchecked",
        component: (
          <Checkbox readOnly className="pointer-events-none" />
        ),
        rationale:
          "Default state indicating an option is not selected.",
        examples: "Opt-in options, Filters, Preferences",
      },
      {
        emphasis: "Checked",
        component: (
          <Checkbox defaultChecked readOnly className="pointer-events-none" />
        ),
        rationale:
          "Indicates the option is selected and will be applied.",
        examples: "Selected items, Enabled features, Agreed terms",
      },
      {
        emphasis: "Indeterminate",
        component: (
          <Checkbox indeterminate readOnly className="pointer-events-none" />
        ),
        rationale:
          "Shows partial selection when a parent item has some (but not all) children selected.",
        examples: "Select all parent, Bulk selection, Tree selection",
      },
      {
        emphasis: "Error",
        component: (
          <Checkbox error readOnly className="pointer-events-none" />
        ),
        rationale:
          "Indicates a validation error or required field that needs attention.",
        examples: "Required agreement, Validation error",
      },
    ],
  },

  // ─── HIERARCHY SECTION ─────────────────────────────────────────────────────
  hierarchy: {
    description:
      "Checkboxes can be used standalone or with labels for clear identification.",
    items: [
      {
        component: <Checkbox label="With label" defaultChecked />,
        title: "With label",
        subtitle: "Most common usage",
      },
      {
        component: <Checkbox defaultChecked />,
        title: "Without label",
        subtitle: "When context is clear",
      },
      {
        component: <Checkbox disabled defaultChecked />,
        title: "Disabled",
        subtitle: "Non-interactive",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Checkboxes are commonly used in forms, lists, and settings pages.",
    examples: [
      {
        title: "Form with checkboxes",
        visual: (
          <div className="space-y-3">
            <Checkbox label="Technology" defaultChecked />
            <Checkbox label="Design" defaultChecked />
            <Checkbox label="Business" />
            <Checkbox label="Science" />
          </div>
        ),
        caption: "Vertical list with labels for form input",
      },
      {
        title: "Task list",
        visual: (
          <div className="w-full max-w-xs border border-outline-variant/20 rounded-lg overflow-hidden">
            {["Buy groceries", "Walk the dog", "Finish report"].map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant/20 last:border-0 bg-surface">
                <Checkbox defaultChecked={i === 0} />
                <span className={`text-body-medium ${i === 0 ? "text-on-surface-variant line-through" : "text-on-surface"}`}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        ),
        caption: "Inline checkboxes in list items for tasks",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "label",
      type: "string",
      description: "Text label displayed next to the checkbox.",
    },
    {
      name: "checked",
      type: "boolean",
      description: "Whether the checkbox is checked.",
    },
    {
      name: "indeterminate",
      type: "boolean",
      default: "false",
      description: "Shows a horizontal line indicating partial selection.",
    },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "If true, the checkbox is disabled and cannot be changed.",
    },
    {
      name: "error",
      type: "boolean",
      default: "false",
      description: "If true, displays the checkbox in an error state.",
    },
    {
      name: "onChange",
      type: "(event: ChangeEvent) => void",
      description: "Callback fired when the checkbox value changes.",
    },
    {
      name: "className",
      type: "string",
      description: "Additional CSS classes to apply to the checkbox container.",
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Uses native checkbox input for full screen reader support.",
      "Label is properly associated with the input via htmlFor/id.",
      "Indeterminate state is set via JavaScript for proper announcements.",
      "Disabled state is conveyed to assistive technologies.",
    ],
    keyboard: [
      { key: "Space", description: "Toggles the checkbox checked state" },
      { key: "Tab", description: "Moves focus to the next focusable element" },
    ],
    focus: [
      "Focus ring is clearly visible around the checkbox.",
      "Focus moves naturally through checkbox groups.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Use controlled state to manage checkbox values.",
    code: `import { Checkbox } from "@unisane/ui";
import { useState } from "react";

function NotificationSettings() {
  const [settings, setSettings] = useState({
    email: true,
    push: true,
    sms: false,
  });

  const handleChange = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      <Checkbox
        label="Email notifications"
        checked={settings.email}
        onChange={() => handleChange("email")}
      />
      <Checkbox
        label="Push notifications"
        checked={settings.push}
        onChange={() => handleChange("push")}
      />
      <Checkbox
        label="SMS alerts"
        checked={settings.sms}
        onChange={() => handleChange("sms")}
      />
    </div>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "switch",
      reason: "Use for instant on/off toggles without form submission.",
    },
    {
      slug: "radio",
      reason: "Use when only one option can be selected from a group.",
    },
    {
      slug: "chip",
      reason: "Use for filter selections with visual feedback.",
    },
  ],
};
