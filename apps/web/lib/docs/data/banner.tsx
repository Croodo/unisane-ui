"use client";

import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";
import { Card } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const BannerHeroVisual = () => (
  <HeroBackground tone="error">
    {/* Mock App with Banner */}
    <div className="relative bg-surface w-[320px] rounded-3xl shadow-xl overflow-hidden border border-outline-variant/30">
      {/* Banner */}
      <div className="flex items-start gap-3 p-4 border-b border-outline-variant/30 bg-surface">
        <span className="material-symbols-outlined text-primary mt-0.5">info</span>
        <div className="flex-1">
          <div className="text-title-small text-on-surface mb-1">Update Available</div>
          <div className="text-body-small text-on-surface-variant">A new version is ready to install.</div>
          <div className="flex gap-2 mt-3">
            <span className="text-label-medium text-primary font-medium cursor-pointer">Update Now</span>
            <span className="text-label-medium text-primary font-medium cursor-pointer">Later</span>
          </div>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant text-[18px] cursor-pointer">close</span>
      </div>
      {/* Content */}
      <div className="p-5 space-y-3">
        <div className="h-4 bg-surface-container-high rounded-sm w-full" />
        <div className="h-4 bg-surface-container-high rounded-sm w-3/4" />
        <div className="h-4 bg-surface-container-high rounded-sm w-1/2" />
      </div>
    </div>
  </HeroBackground>
);

// ─── PLACEMENT VISUALS ────────────────────────────────────────────────────────
const BannerDefaultVisual = () => (
  <div className="w-[280px] mx-auto bg-surface rounded-xl overflow-hidden border border-outline-variant/30">
    <div className="flex items-start gap-3 p-3 border-b border-outline-variant/20">
      <span className="material-symbols-outlined text-primary text-[20px]">info</span>
      <div className="flex-1 min-w-0">
        <div className="text-body-small text-on-surface-variant">New features are now available.</div>
      </div>
      <span className="text-on-surface-variant text-[16px]">×</span>
    </div>
  </div>
);

const BannerWarningVisual = () => (
  <div className="w-[280px] mx-auto bg-warning-container/30 rounded-xl overflow-hidden border border-outline-variant/30">
    <div className="flex items-start gap-3 p-3">
      <span className="material-symbols-outlined text-on-warning-container text-[20px]">warning</span>
      <div className="flex-1 min-w-0">
        <div className="text-body-small text-on-warning-container font-medium">Your session expires in 5 minutes.</div>
      </div>
      <span className="text-on-warning-container text-[16px]">×</span>
    </div>
  </div>
);

export const bannerDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "banner",
  name: "Banner",
  description:
    "Banners display important, succinct messages with optional actions.",
  category: "communication",
  status: "stable",
  icon: "campaign",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["Banner"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <BannerHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Banners come in different variants for different message types.",
    columns: {
      emphasis: "Variant",
      component: "Example",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Default",
        component: (
          <div className="w-40 bg-surface rounded-sm p-2 border border-outline-variant/30">
            <div className="text-body-small text-on-surface-variant">Info message</div>
          </div>
        ),
        rationale:
          "General information or announcements.",
        examples: "Updates, Tips, Announcements",
      },
      {
        emphasis: "Warning",
        component: (
          <div className="w-40 bg-warning-container/30 rounded-sm p-2">
            <div className="text-body-small text-on-warning-container">Warning message</div>
          </div>
        ),
        rationale:
          "Caution or attention needed.",
        examples: "Session expiry, Data limits, Deprecation",
      },
      {
        emphasis: "Error",
        component: (
          <div className="w-40 bg-error-container/30 rounded-sm p-2">
            <div className="text-body-small text-on-error-container">Error message</div>
          </div>
        ),
        rationale:
          "Critical issues requiring action.",
        examples: "Connection lost, Sync failed, Access denied",
      },
    ],
  },

  // ─── HIERARCHY SECTION ─────────────────────────────────────────────────────
  hierarchy: {
    description:
      "Banners can include icons, titles, messages, and action buttons.",
    items: [
      {
        component: (
          <div className="w-36 bg-surface rounded-sm p-2 border border-outline-variant/30">
            <div className="text-body-small text-on-surface-variant">Simple message</div>
          </div>
        ),
        title: "Simple",
        subtitle: "Message only",
      },
      {
        component: (
          <div className="w-36 bg-surface rounded-sm p-2 border border-outline-variant/30">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[16px]">info</span>
              <div className="text-body-small text-on-surface-variant">With icon</div>
            </div>
          </div>
        ),
        title: "With Icon",
        subtitle: "Visual indicator",
      },
      {
        component: (
          <div className="w-36 bg-surface rounded-sm p-2 border border-outline-variant/30">
            <div className="text-label-small text-on-surface font-medium">Title</div>
            <div className="text-body-small text-on-surface-variant">Message</div>
          </div>
        ),
        title: "With Title",
        subtitle: "Title + message",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Banners appear at the top of content areas, below app bars.",
    examples: [
      {
        title: "Default banner",
        visual: <BannerDefaultVisual />,
        caption: "Information banner with close button",
      },
      {
        title: "Warning banner",
        visual: <BannerWarningVisual />,
        caption: "Warning banner for important alerts",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "open",
      type: "boolean",
      required: true,
      description: "Controls whether the banner is visible.",
    },
    {
      name: "onClose",
      type: "() => void",
      required: true,
      description: "Callback fired when the close button is clicked.",
    },
    {
      name: "message",
      type: "string",
      required: true,
      description: "The main message content.",
    },
    {
      name: "title",
      type: "string",
      description: "Optional title displayed above the message.",
    },
    {
      name: "variant",
      type: '"default" | "info" | "warning" | "error"',
      default: '"default"',
      description: "The visual style of the banner.",
    },
    {
      name: "icon",
      type: "ReactNode",
      description: "Icon displayed at the start of the banner.",
    },
    {
      name: "actions",
      type: "Array<{ label: string; onClick: () => void }>",
      description: "Action buttons to display.",
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Uses role='status' or role='alert' based on variant.",
      "aria-live announces banner content dynamically.",
      "Close button has proper aria-label.",
    ],
    keyboard: [
      { key: "Tab", description: "Moves focus to actions and close button" },
      { key: "Enter / Space", description: "Activates focused action" },
    ],
    focus: [
      "Focus is not automatically moved to banners.",
      "Action buttons and close have visible focus states.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Use controlled state to show/hide banners.",
    code: `import { Banner } from "@unisane/ui";
import { useState } from "react";

function UpdateNotification() {
  const [showBanner, setShowBanner] = useState(true);

  return (
    <Banner
      open={showBanner}
      onClose={() => setShowBanner(false)}
      title="Update Available"
      message="A new version of the app is ready to install."
      icon={<span className="material-symbols-outlined">system_update</span>}
      actions={[
        { label: "Update Now", onClick: () => handleUpdate() },
        { label: "Later", onClick: () => setShowBanner(false) },
      ]}
    />
  );
}

function SessionWarning({ expiresIn }) {
  const [dismissed, setDismissed] = useState(false);

  if (expiresIn > 300) return null; // Only show when < 5 min

  return (
    <Banner
      open={!dismissed}
      onClose={() => setDismissed(true)}
      variant="warning"
      message={\`Your session expires in \${Math.floor(expiresIn / 60)} minutes.\`}
      icon={<span className="material-symbols-outlined">timer</span>}
      actions={[
        { label: "Extend Session", onClick: () => extendSession() },
      ]}
    />
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "alert",
      reason: "Use for inline status messages.",
    },
    {
      slug: "snackbar",
      reason: "Use for temporary, non-blocking notifications.",
    },
    {
      slug: "dialog",
      reason: "Use when user acknowledgment is required.",
    },
  ],
};
