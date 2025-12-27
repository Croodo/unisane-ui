"use client";

import { ComponentDoc } from "../types";
import { SearchBar, IconButton } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const SearchBarHeroVisual = () => (
  <div className="relative w-full h-full bg-linear-to-br from-secondary-container to-primary-container flex items-center justify-center p-8 overflow-hidden isolate">
    {/* Decorative Circles */}
    <div className="absolute top-[-40px] left-[-40px] w-56 h-56 bg-secondary/20 rounded-full blur-3xl" />
    <div className="absolute bottom-[-50px] right-[-30px] w-64 h-64 bg-primary/20 rounded-full blur-3xl" />

    {/* Mock Search Interface */}
    <div className="relative bg-surface w-[320px] rounded-3xl shadow-xl overflow-hidden border border-outline-variant/30 z-10 p-6u">
      {/* Search Bar */}
      <div className="bg-surface-container-high rounded-sm h-14u flex items-center px-4u gap-3u mb-4u border border-outline-variant/30">
        <span className="material-symbols-outlined text-on-surface">search</span>
        <span className="text-body-medium text-on-surface-variant flex-1">Search products...</span>
        <span className="material-symbols-outlined text-on-surface-variant">mic</span>
      </div>
      {/* Search suggestions */}
      <div className="space-y-2u">
        <div className="flex items-center gap-3u py-2u">
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">history</span>
          <span className="text-body-medium text-on-surface">Recent search 1</span>
        </div>
        <div className="flex items-center gap-3u py-2u">
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">history</span>
          <span className="text-body-medium text-on-surface">Recent search 2</span>
        </div>
        <div className="flex items-center gap-3u py-2u">
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">trending_up</span>
          <span className="text-body-medium text-on-surface">Trending topic</span>
        </div>
      </div>
    </div>
  </div>
);

// ─── EXAMPLES ────────────────────────────────────────────────────────────────
const SearchBarBasicExample = () => (
  <div className="w-full max-w-sm">
    <SearchBar placeholder="Search..." />
  </div>
);

const SearchBarWithIconsExample = () => (
  <div className="w-full max-w-sm">
    <SearchBar
      placeholder="Search products..."
      trailingIcon={
        <IconButton
          variant="standard"
          size="sm"
          icon={<span className="material-symbols-outlined">mic</span>}
          ariaLabel="Voice search"
        />
      }
    />
  </div>
);

export const searchBarDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "search-bar",
  name: "Search Bar",
  description:
    "Search bars allow users to enter a search query and filter content.",
  category: "text-inputs",
  status: "stable",
  icon: "search",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["SearchBar"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <SearchBarHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Search bars can have different configurations based on functionality.",
    columns: {
      emphasis: "Type",
      component: "Preview",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Basic",
        component: (
          <div className="w-36 h-10u bg-surface-container-high rounded-sm flex items-center px-3u gap-2u">
            <span className="material-symbols-outlined text-on-surface text-[18px]">search</span>
            <span className="text-body-small text-on-surface-variant">Search</span>
          </div>
        ),
        rationale: "Simple search without extra actions.",
        examples: "Lists, Tables, Basic filtering",
      },
      {
        emphasis: "With voice",
        component: (
          <div className="w-36 h-10u bg-surface-container-high rounded-sm flex items-center px-3u gap-2u">
            <span className="material-symbols-outlined text-on-surface text-[18px]">search</span>
            <span className="text-body-small text-on-surface-variant flex-1">Search</span>
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">mic</span>
          </div>
        ),
        rationale: "When voice input is supported.",
        examples: "Mobile apps, Accessibility features",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Search bars are commonly placed in app bars or at the top of content areas.",
    examples: [
      {
        title: "Basic search",
        visual: <SearchBarBasicExample />,
        caption: "Simple search input",
      },
      {
        title: "With trailing icon",
        visual: <SearchBarWithIconsExample />,
        caption: "Search with voice input option",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "placeholder",
      type: "string",
      default: '"Search"',
      description: "Placeholder text for the input.",
    },
    {
      name: "leadingIcon",
      type: "ReactNode",
      description: "Icon displayed at the start (defaults to search icon).",
    },
    {
      name: "trailingIcon",
      type: "ReactNode",
      description: "Icon or action at the end of the search bar.",
    },
    {
      name: "onTrailingIconClick",
      type: "() => void",
      description: "Click handler for trailing icon.",
    },
    {
      name: "value",
      type: "string",
      description: "Controlled input value.",
    },
    {
      name: "onChange",
      type: "(e: ChangeEvent) => void",
      description: "Change handler for input.",
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
      "Uses role='search' for proper semantics.",
      "Input is labeled via placeholder.",
      "Trailing actions have aria-labels.",
    ],
    keyboard: [
      { key: "Tab", description: "Focus the search input" },
      { key: "Escape", description: "Clear search (if implemented)" },
      { key: "Enter", description: "Submit search (if implemented)" },
    ],
    focus: [
      "Focus ring visible on input.",
      "Container style changes on focus.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Use controlled value for search state.",
    code: `import { SearchBar } from "@unisane/ui";
import { useState } from "react";

function ProductSearch() {
  const [query, setQuery] = useState("");

  return (
    <SearchBar
      placeholder="Search products..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      trailingIcon={
        query && (
          <button onClick={() => setQuery("")}>
            <span className="material-symbols-outlined">close</span>
          </button>
        )
      }
    />
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "text-field",
      reason: "Use for general text input.",
    },
    {
      slug: "combobox",
      reason: "Use when search needs dropdown suggestions.",
    },
    {
      slug: "top-app-bar",
      reason: "Common placement for search bars.",
    },
  ],
};
