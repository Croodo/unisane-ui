"use client";

import { ComponentDoc } from "../types";
import { BottomAppBar, BottomAppBarAction, Fab } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const BottomAppBarHeroVisual = () => (
  <div className="relative w-full h-full bg-linear-to-br from-secondary-container to-tertiary-container flex items-center justify-center p-8 overflow-hidden isolate">
    {/* Decorative Circles */}
    <div className="absolute top-[-40px] left-[-40px] w-56 h-56 bg-secondary/20 rounded-full blur-3xl" />
    <div className="absolute bottom-[-50px] right-[-30px] w-64 h-64 bg-tertiary/20 rounded-full blur-3xl" />

    {/* Mock App with Bottom Bar */}
    <div className="relative bg-surface w-[320px] h-[240px] rounded-3xl shadow-xl overflow-hidden border border-outline-variant/30 z-10">
      {/* Content */}
      <div className="p-4u space-y-3u">
        <div className="h-4u bg-surface-container-high rounded-sm w-full" />
        <div className="h-4u bg-surface-container-high rounded-sm w-3/4" />
        <div className="h-4u bg-surface-container-high rounded-sm w-1/2" />
        <div className="h-4u bg-surface-container-high rounded-sm w-2/3" />
      </div>
      {/* Bottom App Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-20u bg-surface-container flex items-center px-4u justify-between">
        <div className="flex gap-4u">
          <span className="material-symbols-outlined text-on-surface-variant">menu</span>
          <span className="material-symbols-outlined text-on-surface-variant">search</span>
          <span className="material-symbols-outlined text-on-surface-variant">delete</span>
        </div>
        {/* FAB */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-7u w-14u h-14u rounded-2xl bg-primary-container flex items-center justify-center shadow-2">
          <span className="material-symbols-outlined text-on-primary-container">add</span>
        </div>
      </div>
    </div>
  </div>
);

// ─── EXAMPLES ────────────────────────────────────────────────────────────────
const BottomAppBarBasicExample = () => (
  <div className="w-full max-w-sm relative h-24u">
    <BottomAppBar
      fab={
        <Fab
          icon={<span className="material-symbols-outlined">add</span>}
          aria-label="Add new item"
        />
      }
    >
      <BottomAppBarAction
        icon={<span className="material-symbols-outlined">menu</span>}
        label="Menu"
      />
      <BottomAppBarAction
        icon={<span className="material-symbols-outlined">search</span>}
        label="Search"
      />
      <BottomAppBarAction
        icon={<span className="material-symbols-outlined">archive</span>}
        label="Archive"
      />
    </BottomAppBar>
  </div>
);

export const bottomAppBarDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "bottom-app-bar",
  name: "Bottom App Bar",
  description:
    "Bottom app bars display navigation and key actions at the bottom of mobile screens.",
  category: "navigation",
  status: "stable",
  icon: "dock_to_bottom",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["BottomAppBar", "BottomAppBarAction"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <BottomAppBarHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Choose between bottom app bar and navigation bar based on your needs.",
    columns: {
      emphasis: "Component",
      component: "Preview",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Bottom App Bar",
        component: (
          <div className="w-32 h-10u bg-surface-container rounded-sm flex items-center px-2u relative">
            <div className="flex gap-2u">
              <span className="material-symbols-outlined text-[14px] text-on-surface-variant">menu</span>
              <span className="material-symbols-outlined text-[14px] text-on-surface-variant">search</span>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 -top-2u w-6u h-6u rounded-lg bg-primary-container flex items-center justify-center">
              <span className="text-[10px]">+</span>
            </div>
          </div>
        ),
        rationale: "For contextual actions with a primary FAB.",
        examples: "Email app, Document editor, Note taking",
      },
      {
        emphasis: "Navigation Bar",
        component: (
          <div className="w-32 h-10u bg-surface-container rounded-sm flex items-center justify-around px-2u">
            <div className="flex flex-col items-center">
              <span className="material-symbols-outlined text-[14px] text-primary">home</span>
              <span className="text-[8px] text-primary">Home</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="material-symbols-outlined text-[14px] text-on-surface-variant">search</span>
              <span className="text-[8px] text-on-surface-variant">Search</span>
            </div>
          </div>
        ),
        rationale: "For primary navigation between sections.",
        examples: "Social apps, Shopping apps, Content apps",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Bottom app bar is fixed at the bottom of the viewport on mobile screens.",
    examples: [
      {
        title: "With FAB",
        visual: <BottomAppBarBasicExample />,
        caption: "Bottom bar with centered floating action button",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "children",
      type: "ReactNode",
      required: true,
      description: "BottomAppBarAction components.",
    },
    {
      name: "fab",
      type: "ReactNode",
      description: "Floating action button to display.",
    },
    {
      name: "className",
      type: "string",
      description: "Additional CSS classes.",
    },
  ],

  // ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────
  subComponents: [
    {
      name: "BottomAppBarAction",
      description: "Action button within the bottom app bar.",
      props: [
        { name: "icon", type: "ReactNode", required: true, description: "Icon to display." },
        { name: "label", type: "string", required: true, description: "Accessible label for the action." },
        { name: "active", type: "boolean", description: "Whether the action is active." },
        { name: "onClick", type: "() => void", description: "Click handler." },
      ],
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Uses role='toolbar' for proper semantics.",
      "Each action has aria-label for context.",
      "Active state indicated via aria-pressed.",
    ],
    keyboard: [
      { key: "Tab", description: "Navigate between actions" },
      { key: "Enter/Space", description: "Activate focused action" },
    ],
    focus: [
      "Focus ring visible on all actions.",
      "FAB is reachable in tab order.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Place at the bottom of your mobile layout.",
    code: `import { BottomAppBar, BottomAppBarAction, Fab } from "@unisane/ui";

function MobileLayout() {
  return (
    <div className="relative min-h-screen pb-20">
      {/* Page content */}

      <BottomAppBar
        fab={
          <Fab
            icon={<span className="material-symbols-outlined">add</span>}
            onClick={handleCreate}
            ariaLabel="Create new"
          />
        }
      >
        <BottomAppBarAction
          icon={<span className="material-symbols-outlined">menu</span>}
          label="Menu"
          onClick={openMenu}
        />
        <BottomAppBarAction
          icon={<span className="material-symbols-outlined">search</span>}
          label="Search"
          onClick={openSearch}
        />
      </BottomAppBar>
    </div>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "navigation-bar",
      reason: "Use for primary app navigation.",
    },
    {
      slug: "fab",
      reason: "Primary action button for the bottom bar.",
    },
    {
      slug: "top-app-bar",
      reason: "Use for header navigation and actions.",
    },
  ],
};
