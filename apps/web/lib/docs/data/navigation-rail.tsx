"use client";

import { useState } from "react";
import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";
import { NavigationRail, Fab } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const NavigationRailHeroVisual = () => (
  <HeroBackground tone="surface">
    {/* Mock App with Rail */}
    <div className="relative bg-surface w-80 h-56 rounded-xl shadow-xl overflow-hidden border border-outline-variant/30 flex">
      {/* Navigation Rail */}
      <div className="w-20 bg-surface-container border-r border-outline-variant/30 flex flex-col items-center py-4 gap-6">
        {/* FAB */}
        <div className="w-14 h-14 rounded-lg bg-primary-container flex items-center justify-center mb-2">
          <span className="material-symbols-outlined text-on-primary-container">edit</span>
        </div>
        {/* Nav Items */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-14 h-8 rounded-full bg-secondary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[22px]">inbox</span>
          </div>
          <span className="text-label-medium text-primary">Inbox</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-14 h-8 flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant text-[22px]">send</span>
          </div>
          <span className="text-label-medium text-on-surface-variant">Sent</span>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 p-4">
        <div className="space-y-3">
          <div className="h-4 bg-surface-container-high rounded-sm w-full" />
          <div className="h-4 bg-surface-container-high rounded-sm w-3/4" />
          <div className="h-4 bg-surface-container-high rounded-sm w-1/2" />
        </div>
      </div>
    </div>
  </HeroBackground>
);

// ─── INTERACTIVE EXAMPLES ────────────────────────────────────────────────────
const NavigationRailBasicExample = () => {
  const [active, setActive] = useState("inbox");

  return (
    <div className="h-72 w-full max-w-xs flex bg-surface-container-low rounded-lg overflow-hidden">
      <NavigationRail
        items={[
          { value: "inbox", label: "Inbox", icon: "inbox", activeIcon: "inbox", badge: 3 },
          { value: "sent", label: "Sent", icon: "send", activeIcon: "send" },
          { value: "drafts", label: "Drafts", icon: "drafts", activeIcon: "drafts" },
          { value: "trash", label: "Trash", icon: "delete", activeIcon: "delete" },
        ]}
        value={active}
        onChange={setActive}
        header={
          <Fab
            size="md"
            variant="tertiary"
            icon={<span className="material-symbols-outlined">edit</span>}
            aria-label="Compose"
          />
        }
        className="h-full"
      />
      <div className="flex-1 p-4">
        <div className="text-body-medium text-on-surface-variant">
          Selected: <span className="text-on-surface font-medium">{active}</span>
        </div>
      </div>
    </div>
  );
};

export const navigationRailDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "navigation-rail",
  name: "Navigation Rail",
  description:
    "Navigation rail provides compact vertical navigation for tablet and desktop screens.",
  category: "navigation",
  status: "stable",
  icon: "view_sidebar",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["NavigationRail"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <NavigationRailHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Choose navigation component based on screen size and number of destinations.",
    columns: {
      emphasis: "Component",
      component: "Preview",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Navigation Rail",
        component: (
          <div className="w-10 h-20 bg-surface-container rounded-sm flex flex-col items-center py-2 gap-2 border-r border-outline-variant">
            <div className="w-6 h-4 rounded-full bg-secondary-container" />
            <div className="w-6 h-4 rounded-full bg-surface-container-high" />
            <div className="w-6 h-4 rounded-full bg-surface-container-high" />
          </div>
        ),
        rationale: "Compact vertical navigation for larger screens.",
        examples: "Desktop apps, Tablet apps, Admin panels",
      },
      {
        emphasis: "Navigation Drawer",
        component: (
          <div className="w-20 h-16 bg-surface-container rounded-sm p-2 border-r border-outline-variant">
            <div className="h-3 rounded-sm bg-secondary-container mb-2" />
            <div className="h-3 rounded-sm bg-surface-container-high" />
          </div>
        ),
        rationale: "Full navigation with labels always visible.",
        examples: "Complex apps, Many destinations",
      },
      {
        emphasis: "Navigation Bar",
        component: (
          <div className="w-32 h-8 bg-surface-container rounded-sm flex items-center justify-around px-2">
            <div className="w-4 h-4 rounded-full bg-secondary-container" />
            <div className="w-4 h-4 rounded-full bg-surface-container-high" />
            <div className="w-4 h-4 rounded-full bg-surface-container-high" />
          </div>
        ),
        rationale: "Bottom navigation for mobile screens.",
        examples: "Mobile apps, Phone interfaces",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Navigation rails are placed at the left edge of the screen on larger devices.",
    examples: [
      {
        title: "With header FAB",
        visual: <NavigationRailBasicExample />,
        caption: "Click items to navigate",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "items",
      type: "RailItem[]",
      required: true,
      description: "Array of navigation items.",
    },
    {
      name: "value",
      type: "string",
      required: true,
      description: "Currently active item value.",
    },
    {
      name: "onChange",
      type: "(value: string) => void",
      required: true,
      description: "Callback when active item changes.",
    },
    {
      name: "header",
      type: "ReactNode",
      description: "Content at top of rail (usually a FAB).",
    },
    {
      name: "footer",
      type: "ReactNode",
      description: "Content at bottom of rail.",
    },
    {
      name: "alignment",
      type: '"start" | "center" | "end"',
      default: '"start"',
      description: "Vertical alignment of items.",
    },
    {
      name: "onItemHover",
      type: "(value: string) => void",
      description: "Callback when item is hovered.",
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Uses semantic <nav> element with aria-label.",
      "Active item indicated via aria-current.",
      "Badges are announced for notifications.",
    ],
    keyboard: [
      { key: "Tab", description: "Navigate between items" },
      { key: "Enter/Space", description: "Activate focused item" },
    ],
    focus: [
      "Focus ring visible on rail items.",
      "Active state clearly distinguished.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Use with controlled state or router.",
    code: `import { NavigationRail, Fab } from "@unisane/ui";
import { usePathname, useRouter } from "next/navigation";

function SideNav() {
  const pathname = usePathname();
  const router = useRouter();

  const items = [
    { value: "/", label: "Home", icon: "home", activeIcon: "home" },
    { value: "/inbox", label: "Inbox", icon: "inbox", badge: 12 },
    { value: "/sent", label: "Sent", icon: "send" },
    { value: "/settings", label: "Settings", icon: "settings" },
  ];

  return (
    <NavigationRail
      items={items}
      value={pathname}
      onChange={(path) => router.push(path)}
      header={
        <Fab
          icon={<span className="material-symbols-outlined">edit</span>}
          onClick={() => router.push("/compose")}
          ariaLabel="Compose"
        />
      }
    />
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "navigation-drawer",
      reason: "Use for full navigation with labels.",
    },
    {
      slug: "navigation-bar",
      reason: "Use for mobile bottom navigation.",
    },
    {
      slug: "fab",
      reason: "Often placed in rail header.",
    },
  ],
};
