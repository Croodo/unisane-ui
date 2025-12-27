"use client";

import { ComponentDoc } from "../types";
import { TopAppBar, IconButton } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const TopAppBarHeroVisual = () => (
  <div className="relative w-full h-full bg-linear-to-br from-primary-container to-secondary-container flex items-center justify-center p-8 overflow-hidden isolate">
    {/* Decorative Circles */}
    <div className="absolute top-[-40px] left-[-40px] w-56 h-56 bg-primary/20 rounded-full blur-3xl" />
    <div className="absolute bottom-[-50px] right-[-30px] w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />

    {/* Mock App with Top Bar */}
    <div className="relative bg-surface w-[320px] h-[240px] rounded-3xl shadow-xl overflow-hidden border border-outline-variant/30 z-10">
      {/* Top App Bar */}
      <div className="h-16u px-4u flex items-center justify-between border-b border-outline-variant/30 bg-surface">
        <span className="material-symbols-outlined text-on-surface">menu</span>
        <span className="text-title-large text-primary">My App</span>
        <div className="flex gap-2u">
          <span className="material-symbols-outlined text-on-surface-variant">search</span>
          <span className="material-symbols-outlined text-on-surface-variant">more_vert</span>
        </div>
      </div>
      {/* Content */}
      <div className="p-4u space-y-3u">
        <div className="h-4u bg-surface-container-high rounded-sm w-full" />
        <div className="h-4u bg-surface-container-high rounded-sm w-3/4" />
        <div className="h-4u bg-surface-container-high rounded-sm w-1/2" />
      </div>
    </div>
  </div>
);

// ─── EXAMPLES ────────────────────────────────────────────────────────────────
const TopAppBarSmallExample = () => (
  <div className="w-full max-w-sm">
    <TopAppBar
      variant="small"
      title="Page Title"
      navigationIcon={
        <IconButton
          variant="standard"
          icon={<span className="material-symbols-outlined">menu</span>}
          ariaLabel="Open menu"
        />
      }
      actions={
        <>
          <IconButton
            variant="standard"
            icon={<span className="material-symbols-outlined">search</span>}
            ariaLabel="Search"
          />
          <IconButton
            variant="standard"
            icon={<span className="material-symbols-outlined">more_vert</span>}
            ariaLabel="More options"
          />
        </>
      }
    />
  </div>
);

const TopAppBarCenterExample = () => (
  <div className="w-full max-w-sm">
    <TopAppBar
      variant="center"
      title="Centered Title"
      navigationIcon={
        <IconButton
          variant="standard"
          icon={<span className="material-symbols-outlined">arrow_back</span>}
          ariaLabel="Go back"
        />
      }
      actions={
        <IconButton
          variant="standard"
          icon={<span className="material-symbols-outlined">share</span>}
          ariaLabel="Share"
        />
      }
    />
  </div>
);

export const topAppBarDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "top-app-bar",
  name: "Top App Bar",
  description:
    "Top app bars display navigation, branding, and actions at the top of screens.",
  category: "navigation",
  status: "stable",
  icon: "web_asset",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["TopAppBar"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <TopAppBarHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Choose the app bar variant based on screen hierarchy and content.",
    columns: {
      emphasis: "Variant",
      component: "Preview",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Small",
        component: (
          <div className="w-32 h-8u bg-surface border border-outline-variant/30 rounded-sm flex items-center px-2u justify-between">
            <span className="material-symbols-outlined text-[14px] text-on-surface">menu</span>
            <span className="text-label-small text-primary">Title</span>
            <span className="material-symbols-outlined text-[14px] text-on-surface-variant">more_vert</span>
          </div>
        ),
        rationale: "Default variant for most screens.",
        examples: "Main screens, List views",
      },
      {
        emphasis: "Center",
        component: (
          <div className="w-32 h-8u bg-surface border border-outline-variant/30 rounded-sm flex items-center px-2u">
            <span className="material-symbols-outlined text-[14px] text-on-surface">arrow_back</span>
            <span className="text-label-small text-primary flex-1 text-center">Title</span>
          </div>
        ),
        rationale: "For focused, single-purpose screens.",
        examples: "Detail views, Modal screens",
      },
      {
        emphasis: "Medium",
        component: (
          <div className="w-32 h-12u bg-surface border border-outline-variant/30 rounded-sm flex flex-col p-2u justify-end">
            <span className="text-label-small text-on-surface">Title</span>
          </div>
        ),
        rationale: "More prominent title display.",
        examples: "Section headers, Feature screens",
      },
      {
        emphasis: "Large",
        component: (
          <div className="w-32 h-16u bg-surface border border-outline-variant/30 rounded-sm flex flex-col p-2u justify-end">
            <span className="text-body-small text-on-surface">Large Title</span>
          </div>
        ),
        rationale: "Maximum title prominence.",
        examples: "Landing pages, Dashboard headers",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Top app bars are fixed at the top of the screen and may respond to scrolling.",
    examples: [
      {
        title: "Small app bar",
        visual: <TopAppBarSmallExample />,
        caption: "Standard top bar with navigation and actions",
      },
      {
        title: "Centered title",
        visual: <TopAppBarCenterExample />,
        caption: "Center-aligned title for focused screens",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "title",
      type: "string",
      required: true,
      description: "The title text to display.",
    },
    {
      name: "variant",
      type: '"small" | "center" | "medium" | "large"',
      default: '"small"',
      description: "Visual style and layout of the app bar.",
    },
    {
      name: "navigationIcon",
      type: "ReactNode",
      description: "Navigation element (menu or back button).",
    },
    {
      name: "actions",
      type: "ReactNode",
      description: "Action buttons displayed on the right.",
    },
    {
      name: "scrolled",
      type: "boolean",
      default: "false",
      description: "Applies scrolled style with elevation.",
    },
    {
      name: "scrollBehavior",
      type: '"pinned" | "enterAlways" | "exitUntilCollapsed"',
      description: "How the bar responds to scrolling.",
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Uses semantic <header> element.",
      "Title is announced via aria-label.",
      "Navigation and action buttons have aria-labels.",
    ],
    keyboard: [
      { key: "Tab", description: "Navigate between interactive elements" },
    ],
    focus: [
      "Focus visible on all interactive elements.",
      "Logical tab order from navigation to actions.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Place at the top of your layout.",
    code: `import { TopAppBar, IconButton } from "@unisane/ui";

function AppHeader() {
  return (
    <TopAppBar
      variant="small"
      title="Dashboard"
      navigationIcon={
        <IconButton
          icon={<span className="material-symbols-outlined">menu</span>}
          onClick={openDrawer}
          ariaLabel="Open menu"
        />
      }
      actions={
        <>
          <IconButton
            icon={<span className="material-symbols-outlined">search</span>}
            ariaLabel="Search"
          />
          <IconButton
            icon={<span className="material-symbols-outlined">account_circle</span>}
            ariaLabel="Account"
          />
        </>
      }
    />
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "bottom-app-bar",
      reason: "Use for actions at bottom of screen.",
    },
    {
      slug: "navigation-drawer",
      reason: "Often triggered from top app bar.",
    },
    {
      slug: "search-bar",
      reason: "Use for search functionality in app bar.",
    },
  ],
};
