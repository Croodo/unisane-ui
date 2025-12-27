"use client";

import { ComponentDoc } from "../types";
import { Tabs, TabsList, TabsTrigger, TabsContent, Card } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const TabsHeroVisual = () => (
  <div className="relative w-full h-full bg-linear-to-br from-primary-container to-tertiary-container flex items-center justify-center p-8 overflow-hidden isolate">
    {/* Decorative Circles */}
    <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
    <div className="absolute bottom-[-40px] left-[-40px] w-56 h-56 bg-tertiary/20 rounded-full blur-3xl" />

    {/* Mock App with Tabs */}
    <div className="relative bg-surface w-[320px] rounded-3xl shadow-xl overflow-hidden border border-outline-variant/30 z-10">
      {/* Tab Bar */}
      <div className="flex border-b border-outline-variant/20">
        <div className="flex-1 py-4u text-center relative">
          <span className="text-label-large text-primary font-medium">Overview</span>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
        </div>
        <div className="flex-1 py-4u text-center">
          <span className="text-label-large text-on-surface-variant">Details</span>
        </div>
        <div className="flex-1 py-4u text-center">
          <span className="text-label-large text-on-surface-variant">Activity</span>
        </div>
      </div>
      {/* Content */}
      <div className="p-5u">
        <div className="space-y-3u">
          <div className="flex items-center gap-3u">
            <div className="w-10u h-10u rounded-full bg-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">person</span>
            </div>
            <div>
              <div className="text-title-small text-on-surface">John Doe</div>
              <div className="text-body-small text-on-surface-variant">Premium Member</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3u pt-2u">
            <div className="text-center">
              <div className="text-headline-small text-on-surface">128</div>
              <div className="text-label-small text-on-surface-variant">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-headline-small text-on-surface">2.4k</div>
              <div className="text-label-small text-on-surface-variant">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-headline-small text-on-surface">847</div>
              <div className="text-label-small text-on-surface-variant">Following</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const tabsDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "tabs",
  name: "Tabs",
  description:
    "Tabs organize content into multiple sections, allowing users to navigate between them.",
  category: "navigation",
  status: "stable",
  icon: "tab",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["Tabs", "TabsList", "TabsTrigger", "TabsContent"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <TabsHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Tabs come in different variants for various use cases and visual contexts.",
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
          <div className="flex bg-surface rounded-lg overflow-hidden">
            <div className="px-4u py-2u relative">
              <span className="text-label-medium text-primary">Tab 1</span>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            </div>
            <div className="px-4u py-2u">
              <span className="text-label-medium text-on-surface-variant">Tab 2</span>
            </div>
          </div>
        ),
        rationale:
          "Default tabs for main content sections. Underline indicates selection.",
        examples: "Page sections, Settings categories, Profile views",
      },
      {
        emphasis: "Secondary",
        component: (
          <div className="flex bg-surface-container rounded-full p-1u">
            <div className="px-4u py-2u bg-surface rounded-full shadow-sm">
              <span className="text-label-medium text-on-surface">Tab 1</span>
            </div>
            <div className="px-4u py-2u">
              <span className="text-label-medium text-on-surface-variant">Tab 2</span>
            </div>
          </div>
        ),
        rationale:
          "Pill-style tabs for filtering or secondary navigation.",
        examples: "Filters, View toggles, Sub-navigation",
      },
      {
        emphasis: "With Icons",
        component: (
          <div className="flex bg-surface rounded-lg overflow-hidden">
            <div className="px-4u py-2u flex items-center gap-2u relative">
              <span className="material-symbols-outlined text-primary text-[18px]">home</span>
              <span className="text-label-medium text-primary">Home</span>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            </div>
            <div className="px-4u py-2u flex items-center gap-2u">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">settings</span>
              <span className="text-label-medium text-on-surface-variant">Settings</span>
            </div>
          </div>
        ),
        rationale:
          "Icons add visual context and help users scan options quickly.",
        examples: "Navigation tabs, Feature categories",
      },
      {
        emphasis: "Icon Only",
        component: (
          <div className="flex bg-surface rounded-lg overflow-hidden">
            <div className="px-4u py-2u relative">
              <span className="material-symbols-outlined text-primary">grid_view</span>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            </div>
            <div className="px-4u py-2u">
              <span className="material-symbols-outlined text-on-surface-variant">list</span>
            </div>
          </div>
        ),
        rationale:
          "Compact tabs for space-constrained UIs or obvious meanings.",
        examples: "View toggles, Layout switches",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Tabs are typically placed at the top of content they control, spanning the full width or centered.",
    examples: [
      {
        title: "Full width tabs",
        visual: (
          <Card variant="outlined" padding="none" className="max-w-[320px] mx-auto overflow-hidden">
            <div className="flex border-b border-outline-variant/20">
              <div className="flex-1 py-3u text-center relative">
                <span className="text-label-medium text-primary">Posts</span>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              </div>
              <div className="flex-1 py-3u text-center">
                <span className="text-label-medium text-on-surface-variant">Media</span>
              </div>
              <div className="flex-1 py-3u text-center">
                <span className="text-label-medium text-on-surface-variant">Likes</span>
              </div>
            </div>
            <div className="p-4u text-body-medium text-on-surface-variant text-center">
              Tab content goes here
            </div>
          </Card>
        ),
        caption: "Full width tabs stretching across the container",
      },
      {
        title: "Scrollable tabs",
        visual: (
          <Card variant="outlined" padding="none" className="max-w-[280px] mx-auto overflow-hidden">
            <div className="flex overflow-x-auto border-b border-outline-variant/20">
              {["All", "Photos", "Videos", "Documents", "Links"].map((tab, i) => (
                <div key={tab} className={`px-4u py-3u shrink-0 relative ${i === 0 ? "" : ""}`}>
                  <span className={`text-label-medium ${i === 0 ? "text-primary" : "text-on-surface-variant"}`}>{tab}</span>
                  {i === 0 && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </div>
              ))}
            </div>
            <div className="p-4u text-body-medium text-on-surface-variant text-center">
              Scrollable when space is limited
            </div>
          </Card>
        ),
        caption: "Scrollable tabs for many options in limited space",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "value",
      type: "string",
      description: "The controlled value of the active tab.",
    },
    {
      name: "defaultValue",
      type: "string",
      description: "The default value for uncontrolled usage.",
    },
    {
      name: "onValueChange",
      type: "(value: string) => void",
      description: "Callback fired when the active tab changes.",
    },
    {
      name: "orientation",
      type: '"horizontal" | "vertical"',
      default: '"horizontal"',
      description: "The orientation of the tabs.",
    },
    {
      name: "activationMode",
      type: '"automatic" | "manual"',
      default: '"automatic"',
      description: "Whether tabs activate on focus or require selection.",
    },
  ],

  // ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────
  subComponents: [
    {
      name: "TabsList",
      description: "Container for tab triggers.",
      props: [
        { name: "className", type: "string", description: "Additional CSS classes." },
        { name: "loop", type: "boolean", default: "true", description: "Whether keyboard navigation loops." },
      ],
    },
    {
      name: "TabsTrigger",
      description: "Individual tab button.",
      props: [
        { name: "value", type: "string", required: true, description: "Unique value for this tab." },
        { name: "disabled", type: "boolean", description: "Whether this tab is disabled." },
        { name: "className", type: "string", description: "Additional CSS classes." },
      ],
    },
    {
      name: "TabsContent",
      description: "Content panel associated with a tab.",
      props: [
        { name: "value", type: "string", required: true, description: "Value matching the tab trigger." },
        { name: "forceMount", type: "boolean", description: "Keep content mounted when inactive." },
        { name: "className", type: "string", description: "Additional CSS classes." },
      ],
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Uses tablist, tab, and tabpanel ARIA roles for proper structure.",
      "aria-selected indicates the currently active tab.",
      "Each tab is linked to its panel via aria-controls.",
      "Tab panels use aria-labelledby to reference their tab.",
    ],
    keyboard: [
      { key: "Tab", description: "Moves focus into the tab list, then to content" },
      { key: "Arrow Left/Right", description: "Moves between tabs (horizontal)" },
      { key: "Arrow Up/Down", description: "Moves between tabs (vertical)" },
      { key: "Enter / Space", description: "Activates the focused tab (manual mode)" },
      { key: "Home/End", description: "Jumps to first/last tab" },
    ],
    focus: [
      "Focus ring is visible on the active tab trigger.",
      "Focus moves between tabs without activating them in manual mode.",
      "Tab content receives focus when activated.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Use the compound component pattern with value control.",
    code: `import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@unisane/ui";
import { useState } from "react";

function ProfileTabs() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="overview">
          <span className="material-symbols-outlined">person</span>
          Overview
        </TabsTrigger>
        <TabsTrigger value="activity">
          <span className="material-symbols-outlined">history</span>
          Activity
        </TabsTrigger>
        <TabsTrigger value="settings">
          <span className="material-symbols-outlined">settings</span>
          Settings
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <ProfileOverview />
      </TabsContent>
      <TabsContent value="activity">
        <ActivityFeed />
      </TabsContent>
      <TabsContent value="settings">
        <SettingsPanel />
      </TabsContent>
    </Tabs>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "navigation-bar",
      reason: "Use for app-level navigation at the bottom of mobile screens.",
    },
    {
      slug: "segmented-button",
      reason: "Use for toggling between a small set of options.",
    },
    {
      slug: "chip",
      reason: "Use for filter chips that can be combined.",
    },
  ],
};
