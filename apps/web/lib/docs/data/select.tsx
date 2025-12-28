"use client";

import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";
import { Select } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const SelectHeroVisual = () => (
  <HeroBackground tone="secondary">
    {/* Mock Form Card */}
    <div className="relative bg-surface w-[300px] rounded-3xl shadow-xl overflow-hidden border border-outline-variant/30">
      <div className="px-6 py-5 border-b border-outline-variant/20">
        <span className="text-title-medium text-on-surface">Preferences</span>
      </div>
      <div className="p-6 space-y-5">
        <div>
          <div className="text-label-medium text-on-surface-variant mb-2">Language</div>
          <div className="bg-surface-container-high rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-body-medium text-on-surface">English (US)</span>
            <span className="material-symbols-outlined text-on-surface-variant">expand_more</span>
          </div>
        </div>
        <div>
          <div className="text-label-medium text-on-surface-variant mb-2">Time zone</div>
          <div className="bg-surface-container-high rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-body-medium text-on-surface">Pacific Time (PT)</span>
            <span className="material-symbols-outlined text-on-surface-variant">expand_more</span>
          </div>
        </div>
        <div>
          <div className="text-label-medium text-on-surface-variant mb-2">Currency</div>
          <div className="bg-surface-container-high rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-body-medium text-on-surface">USD ($)</span>
            <span className="material-symbols-outlined text-on-surface-variant">expand_more</span>
          </div>
        </div>
      </div>
    </div>
  </HeroBackground>
);

export const selectDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "select",
  name: "Select",
  description:
    "Select menus let users choose a single value from a list of options in a dropdown.",
  category: "text-inputs",
  status: "stable",
  icon: "arrow_drop_down",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["Select", "SelectTrigger", "SelectContent", "SelectItem", "SelectValue"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <SelectHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Select components come in two variants. Choose based on the visual emphasis needed.",
    columns: {
      emphasis: "Variant",
      component: "Example",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Filled",
        component: (
          <Select
            variant="filled"
            options={[
              { value: "option1", label: "Option 1" },
              { value: "option2", label: "Option 2" },
            ]}
            value="option1"
            className="w-40"
          />
        ),
        rationale:
          "Default variant with subtle background. Good for forms with multiple inputs.",
        examples: "Settings forms, Filters, Preferences",
      },
      {
        emphasis: "Outlined",
        component: (
          <Select
            variant="outlined"
            options={[
              { value: "option1", label: "Option 1" },
              { value: "option2", label: "Option 2" },
            ]}
            value="option1"
            className="w-40"
          />
        ),
        rationale:
          "Higher contrast with visible border. Works well on colored backgrounds.",
        examples: "Dialogs, Modal forms, Highlighted inputs",
      },
      {
        emphasis: "With Label",
        component: (
          <Select
            label="Label"
            variant="filled"
            options={[
              { value: "option1", label: "Option 1" },
              { value: "option2", label: "Option 2" },
            ]}
            value="option1"
            className="w-40"
          />
        ),
        rationale:
          "Label provides context about what the selection is for.",
        examples: "Form fields, Configuration options",
      },
      {
        emphasis: "Disabled",
        component: (
          <Select
            variant="filled"
            options={[
              { value: "option1", label: "Option 1" },
              { value: "option2", label: "Option 2" },
            ]}
            value="option1"
            disabled
            className="w-40"
          />
        ),
        rationale:
          "Shows that the option exists but cannot be changed.",
        examples: "Locked settings, Conditional fields",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Selects are commonly used in forms and settings pages where users need to choose from options.",
    examples: [
      {
        title: "Settings form",
        visual: (
          <div className="space-y-4 w-full max-w-xs">
            <Select
              label="Theme"
              variant="filled"
              options={[
                { value: "system", label: "System" },
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
              value="system"
            />
            <Select
              label="Font size"
              variant="filled"
              options={[
                { value: "small", label: "Small" },
                { value: "medium", label: "Medium" },
                { value: "large", label: "Large" },
              ]}
              value="medium"
            />
          </div>
        ),
        caption: "Stacked selects with labels in a settings form",
      },
      {
        title: "Inline filter",
        visual: (
          <div className="flex items-center gap-3 w-full max-w-xs">
            <span className="text-body-medium text-on-surface-variant shrink-0">Sort by:</span>
            <Select
              variant="filled"
              options={[
                { value: "recent", label: "Most recent" },
                { value: "oldest", label: "Oldest first" },
                { value: "name", label: "Name" },
              ]}
              value="recent"
              className="flex-1"
            />
          </div>
        ),
        caption: "Inline select for filtering and sorting",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "value",
      type: "string",
      description: "The controlled value of the select.",
    },
    {
      name: "defaultValue",
      type: "string",
      description: "The default value for uncontrolled usage.",
    },
    {
      name: "onValueChange",
      type: "(value: string) => void",
      description: "Callback fired when the selected value changes.",
    },
    {
      name: "placeholder",
      type: "string",
      description: "Placeholder text shown when no value is selected.",
    },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "If true, the select is disabled.",
    },
    {
      name: "required",
      type: "boolean",
      default: "false",
      description: "If true, marks the select as required.",
    },
    {
      name: "open",
      type: "boolean",
      description: "Controlled open state of the dropdown.",
    },
    {
      name: "onOpenChange",
      type: "(open: boolean) => void",
      description: "Callback when the dropdown opens or closes.",
    },
  ],

  // ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────
  subComponents: [
    {
      name: "SelectTrigger",
      description: "The button that opens the select dropdown.",
      props: [
        { name: "variant", type: '"filled" | "outlined"', default: '"filled"', description: "Visual style of the trigger." },
        { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Size of the trigger button." },
        { name: "className", type: "string", description: "Additional CSS classes." },
      ],
    },
    {
      name: "SelectValue",
      description: "Displays the currently selected value or placeholder.",
      props: [
        { name: "placeholder", type: "string", description: "Text shown when no value is selected." },
      ],
    },
    {
      name: "SelectContent",
      description: "The dropdown container for select items.",
      props: [
        { name: "position", type: '"popper" | "item-aligned"', default: '"popper"', description: "Positioning strategy for the dropdown." },
        { name: "className", type: "string", description: "Additional CSS classes." },
      ],
    },
    {
      name: "SelectItem",
      description: "Individual option in the select dropdown.",
      props: [
        { name: "value", type: "string", required: true, description: "The value for this option." },
        { name: "disabled", type: "boolean", description: "Whether this option is disabled." },
        { name: "className", type: "string", description: "Additional CSS classes." },
      ],
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Uses listbox pattern for proper screen reader support.",
      "Selected option is announced when dropdown opens.",
      "Options are announced as user navigates with keyboard.",
      "Disabled options are communicated via aria-disabled.",
    ],
    keyboard: [
      { key: "Enter / Space", description: "Opens the dropdown when trigger is focused" },
      { key: "Arrow Down/Up", description: "Navigates through options" },
      { key: "Enter", description: "Selects the focused option" },
      { key: "Escape", description: "Closes the dropdown" },
      { key: "Home/End", description: "Jumps to first/last option" },
    ],
    focus: [
      "Focus ring is visible on trigger when focused.",
      "Current option is highlighted when navigating.",
      "Focus returns to trigger when dropdown closes.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Use the compound component pattern for full control.",
    code: `import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@unisane/ui";
import { useState } from "react";

function LanguageSelector() {
  const [language, setLanguage] = useState("en");

  const languages = [
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
    { value: "de", label: "German" },
    { value: "ja", label: "Japanese" },
  ];

  return (
    <Select value={language} onValueChange={setLanguage}>
      <SelectTrigger>
        <SelectValue placeholder="Select language" />
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.value} value={lang.value}>
            {lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "combobox",
      reason: "Use when users need to search or filter options.",
    },
    {
      slug: "dropdown-menu",
      reason: "Use for action menus rather than value selection.",
    },
    {
      slug: "radio",
      reason: "Use when showing all options at once is preferred.",
    },
  ],
};
