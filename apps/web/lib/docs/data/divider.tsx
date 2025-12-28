"use client";

import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";
import { Divider, Card, List, ListItem } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const DividerHeroVisual = () => (
  <HeroBackground tone="surface">
    {/* Mock Card with Dividers */}
    <div className="relative bg-surface w-[280px] rounded-3xl shadow-xl overflow-hidden border border-outline-variant/30">
      <div className="px-5 py-4">
        <div className="text-title-medium text-on-surface">Section One</div>
        <div className="text-body-small text-on-surface-variant mt-1">Content for the first section.</div>
      </div>
      <div className="h-px bg-outline-variant w-full" />
      <div className="px-5 py-4">
        <div className="text-title-medium text-on-surface">Section Two</div>
        <div className="text-body-small text-on-surface-variant mt-1">Content for the second section.</div>
      </div>
      <div className="h-px bg-outline-variant mx-4" />
      <div className="px-5 py-4">
        <div className="text-title-medium text-on-surface">Section Three</div>
        <div className="text-body-small text-on-surface-variant mt-1">Content for the third section.</div>
      </div>
    </div>
  </HeroBackground>
);

export const dividerDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "divider",
  name: "Divider",
  description:
    "Dividers are thin lines that separate content into clear groups.",
  category: "layout",
  status: "stable",
  icon: "horizontal_rule",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["Divider"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <DividerHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Dividers come in different variants for different separation needs.",
    columns: {
      emphasis: "Variant",
      component: "Example",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Full bleed",
        component: (
          <div className="w-44 bg-surface rounded-sm border border-outline-variant/30 overflow-hidden">
            <div className="px-3 py-2 text-[10px] text-on-surface">Item 1</div>
            <div className="h-px bg-outline-variant w-full" />
            <div className="px-3 py-2 text-[10px] text-on-surface">Item 2</div>
          </div>
        ),
        rationale:
          "Edge-to-edge separation.",
        examples: "Lists, Cards, Sections",
      },
      {
        emphasis: "Inset",
        component: (
          <div className="w-44 bg-surface rounded-sm border border-outline-variant/30 overflow-hidden">
            <div className="px-3 py-2 text-[10px] text-on-surface">Item 1</div>
            <div className="h-px bg-outline-variant ml-3" />
            <div className="px-3 py-2 text-[10px] text-on-surface">Item 2</div>
          </div>
        ),
        rationale:
          "Aligned with content inset.",
        examples: "List items with icons, Settings",
      },
      {
        emphasis: "Middle",
        component: (
          <div className="w-44 bg-surface rounded-sm border border-outline-variant/30 overflow-hidden">
            <div className="px-3 py-2 text-[10px] text-on-surface">Item 1</div>
            <div className="h-px bg-outline-variant mx-3" />
            <div className="px-3 py-2 text-[10px] text-on-surface">Item 2</div>
          </div>
        ),
        rationale:
          "Centered with margins on both sides.",
        examples: "Subtle separation, Inline content",
      },
    ],
  },

  // ─── HIERARCHY SECTION ─────────────────────────────────────────────────────
  hierarchy: {
    description:
      "Dividers can be horizontal or vertical.",
    items: [
      {
        component: (
          <div className="w-32 flex flex-col items-center gap-2">
            <div className="w-full h-px bg-outline-variant" />
            <span className="text-[10px] text-on-surface-variant">Horizontal</span>
          </div>
        ),
        title: "Horizontal",
        subtitle: "Default orientation",
      },
      {
        component: (
          <div className="h-12 flex items-center gap-2">
            <div className="h-full w-px bg-outline-variant" />
            <span className="text-[10px] text-on-surface-variant">Vertical</span>
          </div>
        ),
        title: "Vertical",
        subtitle: "Side-by-side content",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Dividers are used to separate content within lists, cards, and layouts.",
    examples: [
      {
        title: "In lists",
        visual: (
          <Card variant="outlined" padding="none" className="max-w-[280px] mx-auto overflow-hidden">
            <List>
              <ListItem headline="First item" />
              <Divider variant="inset" />
              <ListItem headline="Second item" />
              <Divider variant="inset" />
              <ListItem headline="Third item" />
            </List>
          </Card>
        ),
        caption: "Inset dividers between list items",
      },
      {
        title: "Between sections",
        visual: (
          <Card variant="outlined" padding="md" className="max-w-[280px] mx-auto">
            <div className="text-body-medium text-on-surface">Section A content</div>
            <Divider className="my-4" />
            <div className="text-body-medium text-on-surface">Section B content</div>
          </Card>
        ),
        caption: "Full-bleed divider between card sections",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "orientation",
      type: '"horizontal" | "vertical"',
      default: '"horizontal"',
      description: "The direction of the divider.",
    },
    {
      name: "variant",
      type: '"full-bleed" | "inset" | "middle"',
      default: '"full-bleed"',
      description: "The spacing variant of the divider.",
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
      "Uses role='separator' for semantic meaning.",
      "Screen readers understand it as a content boundary.",
      "Does not interrupt content reading flow.",
    ],
    keyboard: [
      { key: "N/A", description: "Dividers are not interactive" },
    ],
    focus: [
      "Dividers do not receive focus.",
      "They serve as visual separators only.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Use dividers to visually separate content.",
    code: `import { Divider, List, ListItem, Card } from "@unisane/ui";

function SettingsList() {
  return (
    <Card>
      <List>
        <ListItem
          headline="Account"
          leadingIcon={<Icon symbol="person" />}
        />
        <Divider variant="inset" />
        <ListItem
          headline="Privacy"
          leadingIcon={<Icon symbol="lock" />}
        />
        <Divider variant="inset" />
        <ListItem
          headline="Notifications"
          leadingIcon={<Icon symbol="notifications" />}
        />
      </List>

      <Divider className="my-4" />

      <div className="px-4 py-2">
        <span className="text-label-small text-on-surface-variant">
          Version 1.0.0
        </span>
      </div>
    </Card>
  );
}

function SplitView() {
  return (
    <div className="flex h-64">
      <div className="flex-1 p-4">Left panel</div>
      <Divider orientation="vertical" />
      <div className="flex-1 p-4">Right panel</div>
    </div>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "list",
      reason: "Dividers commonly used between list items.",
    },
    {
      slug: "card",
      reason: "Use to separate sections within cards.",
    },
    {
      slug: "pane-group",
      reason: "Use for resizable panel separation.",
    },
  ],
};
