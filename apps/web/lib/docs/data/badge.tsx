"use client";

import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";
import { Badge, Card, IconButton } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const BadgeHeroVisual = () => (
  <HeroBackground tone="surface">
    {/* Mock Notification Panel */}
    <div className="relative bg-surface w-[280px] rounded-3xl shadow-xl overflow-hidden border border-outline-variant/30">
      <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between">
        <span className="text-title-medium text-on-surface">Dashboard</span>
        <div className="relative">
          <IconButton variant="standard" ariaLabel="Notifications" icon={<span className="material-symbols-outlined">notifications</span>} />
          <div className="absolute -top-1 -right-1">
            <Badge color="error" size="sm">3</Badge>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Badge color="success">Active</Badge>
          <span className="text-body-small text-on-surface-variant">Server Status</span>
        </div>
        <div className="flex items-center gap-3">
          <Badge color="error" variant="tonal">5 Critical</Badge>
          <span className="text-body-small text-on-surface-variant">Issues</span>
        </div>
        <div className="flex items-center gap-3">
          <Badge color="primary" variant="outlined">v2.1.0</Badge>
          <span className="text-body-small text-on-surface-variant">Version</span>
        </div>
      </div>
    </div>
  </HeroBackground>
);

export const badgeDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "badge",
  name: "Badge",
  description:
    "Badges convey dynamic information, such as counts or status indicators.",
  category: "communication",
  status: "stable",
  icon: "new_releases",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["Badge"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <BadgeHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Badges come in different variants and colors. Choose based on the visual hierarchy needed.",
    columns: {
      emphasis: "Variant",
      component: "Example",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Filled",
        component: (
          <Badge variant="filled" color="primary">New</Badge>
        ),
        rationale:
          "High emphasis for important status information.",
        examples: "Notifications, New items, Important counts",
      },
      {
        emphasis: "Tonal",
        component: (
          <Badge variant="tonal" color="primary">Active</Badge>
        ),
        rationale:
          "Medium emphasis that blends with the UI.",
        examples: "Status labels, Categories, Tags",
      },
      {
        emphasis: "Outlined",
        component: (
          <Badge variant="outlined" color="primary">v1.0</Badge>
        ),
        rationale:
          "Low emphasis for supplementary information.",
        examples: "Version numbers, Secondary status, Metadata",
      },
    ],
  },

  // ─── HIERARCHY SECTION ─────────────────────────────────────────────────────
  hierarchy: {
    description:
      "Badges support multiple colors for different semantic meanings.",
    items: [
      {
        component: <Badge color="primary">Primary</Badge>,
        title: "Primary",
        subtitle: "Default actions",
      },
      {
        component: <Badge color="error">Error</Badge>,
        title: "Error",
        subtitle: "Alerts & warnings",
      },
      {
        component: <Badge color="success">Success</Badge>,
        title: "Success",
        subtitle: "Positive status",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Badges are commonly used for notification counts, status indicators, and labels.",
    examples: [
      {
        title: "Notification badge",
        visual: (
          <Card variant="outlined" padding="lg" className="max-w-[200px] mx-auto">
            <div className="flex items-center justify-center gap-6">
              <div className="relative">
                <IconButton variant="standard" ariaLabel="Mail" icon={<span className="material-symbols-outlined">mail</span>} />
                <div className="absolute -top-1 -right-1">
                  <Badge color="error" size="sm">12</Badge>
                </div>
              </div>
              <div className="relative">
                <IconButton variant="standard" ariaLabel="Notifications" icon={<span className="material-symbols-outlined">notifications</span>} />
                <div className="absolute -top-1 -right-1">
                  <Badge color="error" size="sm">3</Badge>
                </div>
              </div>
            </div>
          </Card>
        ),
        caption: "Badges on icon buttons for notification counts",
      },
      {
        title: "Status labels",
        visual: (
          <Card variant="outlined" padding="md" className="max-w-[280px] mx-auto">
            <div className="text-title-small text-on-surface mb-4">Orders</div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-body-medium text-on-surface">Order #1234</span>
                <Badge color="success" variant="tonal">Delivered</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body-medium text-on-surface">Order #1235</span>
                <Badge color="primary" variant="tonal">Shipping</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body-medium text-on-surface">Order #1236</span>
                <Badge color="secondary" variant="tonal">Processing</Badge>
              </div>
            </div>
          </Card>
        ),
        caption: "Status badges in a list",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "children",
      type: "ReactNode",
      required: true,
      description: "The content displayed inside the badge.",
    },
    {
      name: "variant",
      type: '"filled" | "tonal" | "outlined"',
      default: '"filled"',
      description: "The visual style of the badge.",
    },
    {
      name: "color",
      type: '"primary" | "secondary" | "tertiary" | "error" | "success"',
      default: '"primary"',
      description: "The color of the badge.",
    },
    {
      name: "size",
      type: '"sm" | "md" | "lg"',
      default: '"md"',
      description: "The size of the badge.",
    },
    {
      name: "className",
      type: "string",
      description: "Additional CSS classes to apply.",
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Uses role='status' for screen reader announcements.",
      "Content is read as part of the badge text.",
      "Consider adding aria-label for icon-only badges.",
    ],
    keyboard: [
      { key: "N/A", description: "Badges are not interactive" },
    ],
    focus: [
      "Badges do not receive focus.",
      "When used on buttons, the button receives focus.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Use badges to display counts and status information.",
    code: `import { Badge } from "@unisane/ui";

function NotificationBell({ count }: { count: number }) {
  return (
    <div className="relative inline-flex">
      <button className="p-2 rounded-full hover:bg-surface-variant">
        <span className="material-symbols-outlined">notifications</span>
      </button>
      {count > 0 && (
        <Badge
          color="error"
          size="sm"
          className="absolute -top-1 -right-1"
        >
          {count > 99 ? "99+" : count}
        </Badge>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    active: "success",
    pending: "primary",
    error: "error",
  } as const;

  return (
    <Badge
      variant="tonal"
      color={colors[status as keyof typeof colors] || "primary"}
    >
      {status}
    </Badge>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "chip",
      reason: "Use for interactive labels and filters.",
    },
    {
      slug: "icon-button",
      reason: "Often combined with badges for notifications.",
    },
    {
      slug: "avatar",
      reason: "Can include status badges.",
    },
  ],
};
