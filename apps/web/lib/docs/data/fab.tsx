"use client";

import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";
import { Fab, Card } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const FabHeroVisual = () => (
  <HeroBackground tone="primary">
    {/* Mock Email App */}
    <div className="bg-surface w-80 h-96 rounded-xl shadow-xl overflow-hidden border border-outline-variant/30">
      {/* App Bar */}
      <div className="h-14 flex items-center px-4 bg-surface border-b border-outline-variant/20">
        <span className="material-symbols-outlined text-on-surface-variant mr-3">menu</span>
        <span className="text-title-medium text-on-surface">Inbox</span>
      </div>
      {/* Email List */}
      <div className="p-2 space-y-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low">
            <div className="w-10 h-10 rounded-full bg-primary-container shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="h-3 w-24 bg-on-surface/10 rounded mb-2" />
              <div className="h-2.5 w-full bg-on-surface/5 rounded" />
            </div>
          </div>
        ))}
      </div>
      {/* FAB */}
      <div className="absolute bottom-4 right-4">
        <Fab
          variant="primary"
          size="md"
          icon={<span className="material-symbols-outlined">edit</span>}
          label="Compose"
        />
      </div>
    </div>
  </HeroBackground>
);

export const fabDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "fab",
  name: "FAB",
  description:
    "Floating action buttons represent the primary action of a screen.",
  category: "actions",
  status: "stable",
  icon: "add_circle",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["Fab"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <FabHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "FABs come in four color variants. Choose based on the visual hierarchy and context.",
    columns: {
      emphasis: "Variant",
      component: "Example",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Primary",
        component: (
          <Fab
            variant="primary"
            icon={<span className="material-symbols-outlined">add</span>}
            className="pointer-events-none"
          />
        ),
        rationale:
          "The default and most prominent variant. Use for the main action on a screen.",
        examples: "Compose, Create, Add",
      },
      {
        emphasis: "Surface",
        component: (
          <Fab
            variant="surface"
            icon={<span className="material-symbols-outlined">edit</span>}
            className="pointer-events-none"
          />
        ),
        rationale:
          "A subtle variant that blends with the surface. Good when the FAB shouldn't dominate.",
        examples: "Edit, Modify, Adjust",
      },
      {
        emphasis: "Secondary",
        component: (
          <Fab
            variant="secondary"
            icon={<span className="material-symbols-outlined">share</span>}
            className="pointer-events-none"
          />
        ),
        rationale:
          "Uses the secondary color. Provides an alternative emphasis level.",
        examples: "Share, Export, Send",
      },
      {
        emphasis: "Tertiary",
        component: (
          <Fab
            variant="tertiary"
            icon={<span className="material-symbols-outlined">favorite</span>}
            className="pointer-events-none"
          />
        ),
        rationale:
          "Uses the tertiary color. Good for complementary actions.",
        examples: "Favorite, Like, Save",
      },
    ],
  },

  // ─── HIERARCHY SECTION ─────────────────────────────────────────────────────
  hierarchy: {
    description:
      "FAB sizes determine prominence and available space for content.",
    items: [
      {
        component: (
          <Fab
            variant="primary"
            size="lg"
            icon={<span className="material-symbols-outlined text-[36px]">add</span>}
          />
        ),
        title: "Large",
        subtitle: "96px, prominent",
      },
      {
        component: (
          <Fab
            variant="primary"
            size="md"
            icon={<span className="material-symbols-outlined">add</span>}
          />
        ),
        title: "Medium",
        subtitle: "56px, default",
      },
      {
        component: (
          <Fab
            variant="primary"
            size="sm"
            icon={<span className="material-symbols-outlined">add</span>}
          />
        ),
        title: "Small",
        subtitle: "40px, compact",
      },
      {
        component: (
          <Fab
            variant="primary"
            icon={<span className="material-symbols-outlined">add</span>}
            label="Create"
          />
        ),
        title: "Extended",
        subtitle: "With label",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "FABs are typically positioned in the bottom-right corner, floating above content.",
    examples: [
      {
        title: "Standard placement",
        visual: (
          <div className="relative bg-surface-container rounded-xl h-48 max-w-80 mx-auto border border-outline-variant/30">
            <div className="absolute bottom-4 right-4">
              <Fab
                variant="primary"
                icon={<span className="material-symbols-outlined">add</span>}
              />
            </div>
            <div className="p-4 text-body-small text-on-surface-variant">
              Main content area
            </div>
          </div>
        ),
        caption: "Bottom-right corner with 16px margin from edges",
      },
      {
        title: "Extended FAB",
        visual: (
          <div className="relative bg-surface-container rounded-xl h-48 max-w-80 mx-auto border border-outline-variant/30">
            <div className="absolute bottom-4 right-4">
              <Fab
                variant="primary"
                icon={<span className="material-symbols-outlined">edit</span>}
                label="Compose"
              />
            </div>
            <div className="p-4 text-body-small text-on-surface-variant">
              Content with extended FAB
            </div>
          </div>
        ),
        caption: "Extended FAB with icon and label for clarity",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "icon",
      type: "ReactNode",
      description: "The icon element to display in the FAB.",
    },
    {
      name: "label",
      type: "string",
      description: "Optional text label for extended FAB variant.",
    },
    {
      name: "variant",
      type: '"primary" | "surface" | "secondary" | "tertiary"',
      default: '"primary"',
      description: "The color variant of the FAB.",
    },
    {
      name: "size",
      type: '"sm" | "md" | "lg" | "extended"',
      default: '"md"',
      description: "The size of the FAB. Automatically becomes extended when label is provided.",
    },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "If true, the FAB is disabled and cannot be clicked.",
    },
    {
      name: "onClick",
      type: "() => void",
      description: "Callback fired when the FAB is clicked.",
    },
    {
      name: "className",
      type: "string",
      description: "Additional CSS classes to apply to the FAB.",
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "FABs should have a clear aria-label when using icon-only variants.",
      "The label prop provides accessible text for extended FABs.",
      "FABs maintain a minimum touch target of 48x48 pixels.",
      "Focus states are clearly visible with elevation changes.",
    ],
    keyboard: [
      { key: "Enter / Space", description: "Activates the FAB" },
      { key: "Tab", description: "Moves focus to the FAB" },
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Import the component and position it in your layout.",
    code: `import { Fab } from "@unisane/ui";

function EmailApp() {
  return (
    <div className="relative min-h-screen">
      {/* Main content */}
      <main className="pb-20">
        {/* Email list... */}
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-4 right-4 z-fab">
        <Fab
          variant="primary"
          icon={<span className="material-symbols-outlined">edit</span>}
          label="Compose"
          onClick={() => openComposer()}
        />
      </div>
    </div>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "fab-menu",
      reason: "Use when you need multiple related actions from a FAB.",
    },
    {
      slug: "button",
      reason: "Use for inline actions within content.",
    },
    {
      slug: "icon-button",
      reason: "Use for compact actions in toolbars.",
    },
  ],
};
