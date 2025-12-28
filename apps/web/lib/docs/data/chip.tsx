"use client";

import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";
import { Chip, Card } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const ChipHeroVisual = () => (
  <HeroBackground tone="surface">
    {/* Mock Filter Card */}
    <div className="relative bg-surface w-[300px] rounded-3xl shadow-xl overflow-hidden border border-outline-variant/30">
      <div className="px-5 py-4 border-b border-outline-variant/20">
        <span className="text-title-medium text-on-surface">Filter Products</span>
      </div>
      <div className="p-4">
        <div className="text-label-small text-on-surface-variant mb-3">Categories</div>
        <div className="flex flex-wrap gap-2">
          <Chip variant="filter" label="Electronics" selected />
          <Chip variant="filter" label="Clothing" selected />
          <Chip variant="filter" label="Home" />
          <Chip variant="filter" label="Sports" />
        </div>
        <div className="text-label-small text-on-surface-variant mt-4 mb-3">Price Range</div>
        <div className="flex flex-wrap gap-2">
          <Chip variant="filter" label="Under $50" selected />
          <Chip variant="filter" label="$50-$100" />
          <Chip variant="filter" label="$100+" />
        </div>
      </div>
    </div>
  </HeroBackground>
);

export const chipDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "chip",
  name: "Chip",
  description:
    "Chips help people enter information, make selections, filter content, or trigger actions.",
  category: "selection",
  status: "stable",
  icon: "label",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["Chip"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <ChipHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Chips come in different variants for different use cases. Choose based on the interaction type.",
    columns: {
      emphasis: "Variant",
      component: "Example",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Assist",
        component: (
          <Chip variant="assist" label="Add event" icon={<span className="material-symbols-outlined text-[18px]">add</span>} className="pointer-events-none" />
        ),
        rationale:
          "Represent smart or automated actions that can appear dynamically.",
        examples: "Smart suggestions, Quick actions, Contextual help",
      },
      {
        emphasis: "Filter",
        component: (
          <Chip variant="filter" label="Active" selected className="pointer-events-none" />
        ),
        rationale:
          "Allow users to filter content using tags. Can be toggled on/off.",
        examples: "Search filters, Category selection, Multi-select",
      },
      {
        emphasis: "Input",
        component: (
          <Chip variant="input" label="john@email.com" onDelete={() => {}} className="pointer-events-none" />
        ),
        rationale:
          "Represent user-entered information that can be removed.",
        examples: "Email recipients, Tags, Selected items",
      },
      {
        emphasis: "Suggestion",
        component: (
          <Chip variant="suggestion" label="Try this" className="pointer-events-none" />
        ),
        rationale:
          "Offer dynamic suggestions to help users complete tasks.",
        examples: "Search suggestions, Auto-complete, Recent items",
      },
    ],
  },

  // ─── HIERARCHY SECTION ─────────────────────────────────────────────────────
  hierarchy: {
    description:
      "Chips can include icons for visual context and delete buttons for removable items.",
    items: [
      {
        component: <Chip variant="filter" label="Selected" selected />,
        title: "Selected",
        subtitle: "Active filter state",
      },
      {
        component: <Chip variant="assist" label="With icon" icon={<span className="material-symbols-outlined text-[18px]">star</span>} />,
        title: "With icon",
        subtitle: "Visual context",
      },
      {
        component: <Chip variant="input" label="Removable" onDelete={() => {}} />,
        title: "With delete",
        subtitle: "User-entered input",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Chips are commonly used in filter bars, tag inputs, and selection groups.",
    examples: [
      {
        title: "Filter bar",
        visual: (
          <div className="flex flex-wrap gap-2">
            <Chip variant="filter" label="All" selected />
            <Chip variant="filter" label="Active" />
            <Chip variant="filter" label="Completed" />
            <Chip variant="filter" label="Archived" />
          </div>
        ),
        caption: "Horizontal chip group for filtering content",
      },
      {
        title: "Tag input",
        visual: (
          <div className="flex flex-wrap gap-2 p-3 border border-outline-variant/30 rounded-lg min-h-12 w-full max-w-xs bg-surface-container-lowest">
            <Chip variant="input" label="alice@mail.com" onDelete={() => {}} />
            <Chip variant="input" label="bob@mail.com" onDelete={() => {}} />
          </div>
        ),
        caption: "Input chips in a text field for multiple values",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "label",
      type: "string",
      required: true,
      description: "The text content of the chip.",
    },
    {
      name: "variant",
      type: '"assist" | "filter" | "input" | "suggestion"',
      default: '"assist"',
      description: "The visual style and behavior of the chip.",
    },
    {
      name: "selected",
      type: "boolean",
      default: "false",
      description: "Whether the chip is in a selected state (for filter chips).",
    },
    {
      name: "icon",
      type: "ReactNode",
      description: "Icon displayed at the start of the chip.",
    },
    {
      name: "onDelete",
      type: "() => void",
      description: "Callback when the delete button is clicked. Shows delete button when provided.",
    },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "If true, the chip is disabled and non-interactive.",
    },
    {
      name: "onClick",
      type: "(event: MouseEvent) => void",
      description: "Callback fired when the chip is clicked.",
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Interactive chips have role='button' for screen reader support.",
      "Filter chips use aria-pressed to indicate selection state.",
      "Delete button is separately focusable with clear label.",
    ],
    keyboard: [
      { key: "Enter / Space", description: "Activates the chip (click action)" },
      { key: "Tab", description: "Moves focus between chips and delete button" },
      { key: "Delete / Backspace", description: "Removes input chip when focused" },
    ],
    focus: [
      "Focus ring clearly indicates the focused chip.",
      "Delete button has separate focus state.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Use chips for filtering, tagging, and selections.",
    code: `import { Chip } from "@unisane/ui";
import { useState } from "react";

function FilterChips() {
  const [filters, setFilters] = useState<string[]>(["active"]);

  const toggleFilter = (filter: string) => {
    setFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {["all", "active", "completed", "archived"].map(filter => (
        <Chip
          key={filter}
          variant="filter"
          label={filter.charAt(0).toUpperCase() + filter.slice(1)}
          selected={filters.includes(filter)}
          onClick={() => toggleFilter(filter)}
        />
      ))}
    </div>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "checkbox",
      reason: "Use for form-based multi-selection with labels.",
    },
    {
      slug: "badge",
      reason: "Use for status indicators without interaction.",
    },
    {
      slug: "button",
      reason: "Use for primary actions instead of suggestions.",
    },
  ],
};
