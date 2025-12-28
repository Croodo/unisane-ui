"use client";

import { useState } from "react";
import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";
import { Combobox } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const ComboboxHeroVisual = () => (
  <HeroBackground tone="secondary">
    {/* Mock Combobox */}
    <div className="relative bg-surface w-[300px] rounded-3xl shadow-xl overflow-hidden border border-outline-variant/30 p-6">
      <div className="text-label-medium text-on-surface-variant mb-2">Select Country</div>
      <div className="bg-surface-container-high rounded-lg px-4 py-3 flex items-center justify-between border-2 border-primary">
        <span className="text-body-medium text-on-surface">Uni</span>
        <span className="material-symbols-outlined text-on-surface-variant rotate-180">arrow_drop_down</span>
      </div>
      <div className="mt-2 bg-surface-container-high rounded-lg shadow-2 overflow-hidden">
        <div className="px-4 py-3 bg-primary/10 text-primary font-medium flex items-center justify-between">
          United States
          <span className="material-symbols-outlined text-primary text-[18px]">check</span>
        </div>
        <div className="px-4 py-3 text-on-surface hover:bg-on-surface/5">United Kingdom</div>
        <div className="px-4 py-3 text-on-surface hover:bg-on-surface/5">United Arab Emirates</div>
      </div>
    </div>
  </HeroBackground>
);

// ─── INTERACTIVE EXAMPLES ────────────────────────────────────────────────────
const ComboboxBasicExample = () => {
  const [value, setValue] = useState("");
  const options = [
    { value: "react", label: "React" },
    { value: "vue", label: "Vue" },
    { value: "angular", label: "Angular" },
    { value: "svelte", label: "Svelte" },
    { value: "solid", label: "Solid" },
  ];

  return (
    <div className="w-full max-w-xs">
      <Combobox
        label="Framework"
        placeholder="Search frameworks..."
        options={options}
        value={value}
        onChange={setValue}
      />
    </div>
  );
};

const ComboboxNonSearchableExample = () => {
  const [value, setValue] = useState("medium");
  const options = [
    { value: "small", label: "Small" },
    { value: "medium", label: "Medium" },
    { value: "large", label: "Large" },
  ];

  return (
    <div className="w-full max-w-xs">
      <Combobox
        label="Size"
        options={options}
        value={value}
        onChange={setValue}
        searchable={false}
      />
    </div>
  );
};

export const comboboxDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "combobox",
  name: "Combobox",
  description:
    "Combobox combines a text input with a dropdown list, allowing users to filter options by typing.",
  category: "text-inputs",
  status: "stable",
  icon: "search",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["Combobox"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <ComboboxHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Choose between Combobox and Select based on the number of options and need for filtering.",
    columns: {
      emphasis: "Component",
      component: "Preview",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Combobox",
        component: (
          <div className="w-36 h-10 bg-surface-container-high rounded-lg px-3 flex items-center gap-2 border border-outline-variant">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
            <span className="text-body-small text-on-surface-variant">Search...</span>
          </div>
        ),
        rationale: "When options list is long or filtering is helpful.",
        examples: "Country selector, User picker, Tag input",
      },
      {
        emphasis: "Select",
        component: (
          <div className="w-36 h-10 bg-surface-container-high rounded-lg px-3 flex items-center justify-between">
            <span className="text-body-small text-on-surface">Option 1</span>
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">expand_more</span>
          </div>
        ),
        rationale: "When options list is short and well-known.",
        examples: "Theme selector, Sort order, Simple filters",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Comboboxes are used in forms where users need to select from a large list of options.",
    examples: [
      {
        title: "Searchable combobox",
        visual: <ComboboxBasicExample />,
        caption: "Type to filter the options list",
      },
      {
        title: "Non-searchable",
        visual: <ComboboxNonSearchableExample />,
        caption: "Click to open dropdown without search",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "options",
      type: "ComboboxOption[]",
      required: true,
      description: "Array of options with value and label.",
    },
    {
      name: "value",
      type: "string",
      description: "The controlled selected value.",
    },
    {
      name: "onChange",
      type: "(value: string) => void",
      description: "Callback fired when selection changes.",
    },
    {
      name: "placeholder",
      type: "string",
      default: '"Search or select..."',
      description: "Placeholder text for the input.",
    },
    {
      name: "label",
      type: "string",
      description: "Label displayed above the combobox.",
    },
    {
      name: "searchable",
      type: "boolean",
      default: "true",
      description: "Enable text filtering of options.",
    },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "Disable the combobox.",
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Uses role='combobox' for proper semantics.",
      "Options use role='listbox' and role='option'.",
      "aria-expanded indicates dropdown state.",
      "aria-activedescendant tracks focused option.",
    ],
    keyboard: [
      { key: "Arrow Down", description: "Open dropdown / Move to next option" },
      { key: "Arrow Up", description: "Move to previous option" },
      { key: "Enter", description: "Select focused option" },
      { key: "Escape", description: "Close dropdown" },
      { key: "Home / End", description: "Jump to first/last option" },
    ],
    focus: [
      "Input receives focus when component is focused.",
      "Options highlight on keyboard navigation.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Provide options array and handle selection.",
    code: `import { Combobox } from "@unisane/ui";
import { useState } from "react";

function CountrySelector() {
  const [country, setCountry] = useState("");

  const countries = [
    { value: "us", label: "United States" },
    { value: "uk", label: "United Kingdom" },
    { value: "ca", label: "Canada" },
    { value: "au", label: "Australia" },
  ];

  return (
    <Combobox
      label="Country"
      placeholder="Search countries..."
      options={countries}
      value={country}
      onChange={setCountry}
    />
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "select",
      reason: "Use for shorter option lists without filtering.",
    },
    {
      slug: "text-field",
      reason: "Use for free-form text input.",
    },
  ],
};
