"use client";

import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const PaneGroupHeroVisual = () => (
  <HeroBackground tone="surface">
    {/* Mock App with Pane Group */}
    <div className="relative bg-surface w-80 h-56 rounded-xl shadow-xl overflow-hidden border border-outline-variant/30 flex">
      {/* Sidebar Pane */}
      <div className="w-28 bg-surface border-r border-outline-variant/20 p-3 space-y-2 shrink-0">
        <div className="h-3 bg-on-surface-variant/20 rounded-sm w-2/3 mb-3" />
        <div className="h-7 bg-secondary-container rounded-lg" />
        <div className="h-7 bg-surface-container-high rounded-lg" />
        <div className="h-7 bg-surface-container-high rounded-lg" />
        <div className="h-7 bg-surface-container-high rounded-lg" />
      </div>
      {/* Detail Pane */}
      <div className="flex-1 bg-surface-container p-4">
        <div className="h-4 bg-on-surface/20 rounded-sm w-1/2 mb-4" />
        <div className="space-y-2">
          <div className="h-3 bg-surface-container-high rounded-sm w-full" />
          <div className="h-3 bg-surface-container-high rounded-sm w-full" />
          <div className="h-3 bg-surface-container-high rounded-sm w-3/4" />
          <div className="h-3 bg-surface-container-high rounded-sm w-full" />
          <div className="h-3 bg-surface-container-high rounded-sm w-1/2" />
        </div>
      </div>
    </div>
  </HeroBackground>
);

// ─── EXAMPLES ────────────────────────────────────────────────────────────────
const BasicPaneGroupExample = () => (
  <div className="w-full max-w-md h-56 bg-surface rounded-lg overflow-hidden border border-outline-variant/30 flex">
    {/* Sidebar */}
    <div className="w-36 border-r border-outline-variant/20 p-3 space-y-2 shrink-0">
      <div className="text-label-small text-on-surface-variant mb-2">Folders</div>
      <div className="p-2 rounded-lg bg-secondary-container text-label-medium text-primary">Inbox</div>
      <div className="p-2 rounded-lg text-label-medium text-on-surface-variant hover:bg-surface-container-high">Sent</div>
      <div className="p-2 rounded-lg text-label-medium text-on-surface-variant hover:bg-surface-container-high">Drafts</div>
      <div className="p-2 rounded-lg text-label-medium text-on-surface-variant hover:bg-surface-container-high">Trash</div>
    </div>
    {/* Detail */}
    <div className="flex-1 p-4 bg-surface-container">
      <div className="text-title-medium text-on-surface mb-3">Inbox</div>
      <div className="space-y-2">
        <div className="p-2 rounded-lg bg-surface border border-outline-variant/20">
          <div className="text-body-small text-on-surface">Welcome to your inbox</div>
        </div>
        <div className="p-2 rounded-lg bg-surface border border-outline-variant/20">
          <div className="text-body-small text-on-surface">New message from Alice</div>
        </div>
      </div>
    </div>
  </div>
);

const ResponsivePaneGroupExample = () => (
  <div className="space-y-4">
    {/* Desktop View */}
    <div className="w-full max-w-md h-40 bg-surface rounded-lg overflow-hidden border border-outline-variant/30 flex">
      <div className="w-28 border-r border-outline-variant/20 p-2 space-y-1 shrink-0">
        <div className="text-label-small text-on-surface-variant/70 mb-1">Desktop</div>
        <div className="h-6 bg-secondary-container rounded-md" />
        <div className="h-6 bg-surface-container-high rounded-md" />
        <div className="h-6 bg-surface-container-high rounded-md" />
      </div>
      <div className="flex-1 p-3 bg-surface-container">
        <div className="h-3 bg-on-surface/20 rounded-sm w-1/3 mb-2" />
        <div className="h-2 bg-surface-container-high rounded-sm w-full mb-1" />
        <div className="h-2 bg-surface-container-high rounded-sm w-3/4" />
      </div>
    </div>
    {/* Mobile View */}
    <div className="w-full max-w-[200px] h-40 bg-surface rounded-lg overflow-hidden border border-outline-variant/30">
      <div className="p-2 space-y-1 h-full">
        <div className="text-label-small text-on-surface-variant/70 mb-1">Mobile (list)</div>
        <div className="h-8 bg-secondary-container rounded-md" />
        <div className="h-8 bg-surface-container-high rounded-md" />
        <div className="h-8 bg-surface-container-high rounded-md" />
      </div>
    </div>
  </div>
);

export const paneGroupDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "pane-group",
  name: "Pane Group",
  description:
    "A simple two-pane layout component for sidebar/detail patterns. Automatically handles responsive behavior with mobile-first approach.",
  category: "layout",
  status: "stable",
  icon: "view_sidebar",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["PaneGroup"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <PaneGroupHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Choose between PaneGroup and Canonical Layouts based on your needs.",
    columns: {
      emphasis: "Component",
      component: "Preview",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "PaneGroup",
        component: (
          <div className="w-32 h-16 bg-surface-container rounded-sm flex overflow-hidden">
            <div className="w-10 border-r border-outline-variant/20 p-1 space-y-1">
              <div className="h-2 rounded-sm bg-secondary-container" />
              <div className="h-2 rounded-sm bg-surface-container-high" />
            </div>
            <div className="flex-1 p-1">
              <div className="h-2 bg-surface-container-high rounded-sm" />
            </div>
          </div>
        ),
        rationale: "Simple two-pane layout with basic responsive behavior.",
        examples: "Settings, Simple sidebar",
      },
      {
        emphasis: "ListDetailLayout",
        component: (
          <div className="w-32 h-16 bg-surface-container rounded-sm flex overflow-hidden">
            <div className="w-10 border-r border-outline-variant/30 p-1 space-y-1">
              <div className="h-2 rounded-sm bg-secondary-container" />
              <div className="h-2 rounded-sm bg-surface-container-high" />
            </div>
            <div className="flex-1 bg-surface-container-low p-1">
              <div className="h-2 bg-surface-container-high rounded-sm" />
            </div>
          </div>
        ),
        rationale: "Full-featured layout with back button and mobile transitions.",
        examples: "Email, Chat, File explorer",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "PaneGroup works best as a content container within your app shell. It handles the sidebar/detail split automatically.",
    examples: [
      {
        title: "Basic two-pane layout",
        visual: <BasicPaneGroupExample />,
        caption: "Sidebar with navigation and detail content area",
      },
      {
        title: "Responsive behavior",
        visual: <ResponsivePaneGroupExample />,
        caption: "Shows list or detail based on screen size and showDetail prop",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "sidebar",
      type: "ReactNode",
      required: true,
      description: "Content for the sidebar/list pane.",
    },
    {
      name: "detail",
      type: "ReactNode",
      required: true,
      description: "Content for the detail/main pane.",
    },
    {
      name: "showDetail",
      type: "boolean",
      default: "false",
      description: "On mobile, shows detail pane instead of sidebar when true.",
    },
    {
      name: "className",
      type: "string",
      description: "Additional CSS classes for the container.",
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Uses semantic div structure for layout.",
      "Content in each pane maintains proper heading hierarchy.",
      "Hidden panes are visually hidden but accessible to screen readers on mobile.",
    ],
    keyboard: [
      { key: "Tab", description: "Navigate between interactive elements in visible pane" },
    ],
    focus: [
      "Focus remains in the visible pane on mobile.",
      "Transitions include duration for smooth animation.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Use PaneGroup with state to control mobile detail visibility.",
    code: `import { PaneGroup } from "@unisane/ui";
import { useState } from "react";

function SettingsPage() {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  return (
    <PaneGroup
      sidebar={
        <nav className="p-4 space-y-2">
          <h2 className="text-title-medium mb-4">Settings</h2>
          <button
            onClick={() => setSelectedSection("account")}
            className="w-full text-left p-3 rounded-lg hover:bg-surface-container-high"
          >
            Account
          </button>
          <button
            onClick={() => setSelectedSection("privacy")}
            className="w-full text-left p-3 rounded-lg hover:bg-surface-container-high"
          >
            Privacy
          </button>
          <button
            onClick={() => setSelectedSection("notifications")}
            className="w-full text-left p-3 rounded-lg hover:bg-surface-container-high"
          >
            Notifications
          </button>
        </nav>
      }
      detail={
        <div className="p-4">
          {selectedSection === "account" && <AccountSettings />}
          {selectedSection === "privacy" && <PrivacySettings />}
          {selectedSection === "notifications" && <NotificationSettings />}
          {!selectedSection && (
            <p className="text-on-surface-variant">Select a section</p>
          )}
        </div>
      }
      showDetail={!!selectedSection}
      className="h-screen"
    />
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "canonical-layouts",
      reason: "More feature-rich layouts with back buttons and mobile transitions.",
    },
    {
      slug: "sidebar",
      reason: "App-level navigation sidebar with rail and drawer patterns.",
    },
    {
      slug: "navigation-drawer",
      reason: "Use for modal navigation overlay patterns.",
    },
  ],
};
