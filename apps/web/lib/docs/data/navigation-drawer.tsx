"use client";

import { ComponentDoc } from "../types";
import { NavigationDrawer, NavigationDrawerItem, NavigationDrawerHeadline, NavigationDrawerDivider } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const NavigationDrawerHeroVisual = () => (
  <div className="relative w-full h-full bg-linear-to-br from-secondary-container to-primary-container flex items-center justify-center p-8 overflow-hidden isolate">
    {/* Decorative Circles */}
    <div className="absolute top-[-40px] left-[-40px] w-56 h-56 bg-secondary/20 rounded-full blur-3xl" />
    <div className="absolute bottom-[-50px] right-[-30px] w-64 h-64 bg-primary/20 rounded-full blur-3xl" />

    {/* Mock App with Drawer */}
    <div className="relative bg-surface w-[320px] h-[220px] rounded-3xl shadow-xl overflow-hidden border border-outline-variant/30 z-10 flex">
      {/* Navigation Drawer */}
      <div className="w-[140px] bg-surface-container border-r border-outline-variant/30 p-3u">
        <div className="text-label-small text-on-surface-variant mb-3u px-2u">Navigation</div>
        <div className="space-y-1u">
          <div className="flex items-center gap-2u px-3u py-2u rounded-full bg-secondary-container">
            <span className="material-symbols-outlined text-primary text-[20px]">home</span>
            <span className="text-label-medium text-primary">Home</span>
          </div>
          <div className="flex items-center gap-2u px-3u py-2u rounded-full text-on-surface-variant">
            <span className="material-symbols-outlined text-[20px]">inbox</span>
            <span className="text-label-medium">Inbox</span>
          </div>
          <div className="flex items-center gap-2u px-3u py-2u rounded-full text-on-surface-variant">
            <span className="material-symbols-outlined text-[20px]">send</span>
            <span className="text-label-medium">Sent</span>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 p-4u">
        <div className="space-y-3u">
          <div className="h-4u bg-surface-container-high rounded-sm w-full" />
          <div className="h-4u bg-surface-container-high rounded-sm w-3/4" />
          <div className="h-4u bg-surface-container-high rounded-sm w-1/2" />
        </div>
      </div>
    </div>
  </div>
);

// ─── EXAMPLES ────────────────────────────────────────────────────────────────
const NavigationDrawerBasicExample = () => (
  <div className="relative w-full max-w-xs h-[280px] bg-surface-container-low rounded-lg overflow-hidden">
    <NavigationDrawer open modal={false} className="relative w-full h-full">
      <div className="p-4u">
        <div className="text-title-medium text-on-surface mb-4u">My App</div>
      </div>
      <NavigationDrawerHeadline>Main</NavigationDrawerHeadline>
      <NavigationDrawerItem icon="home" active>
        Home
      </NavigationDrawerItem>
      <NavigationDrawerItem icon="inbox" badge="24">
        Inbox
      </NavigationDrawerItem>
      <NavigationDrawerItem icon="send">
        Sent
      </NavigationDrawerItem>
      <NavigationDrawerDivider />
      <NavigationDrawerHeadline>Labels</NavigationDrawerHeadline>
      <NavigationDrawerItem icon="label">
        Important
      </NavigationDrawerItem>
      <NavigationDrawerItem icon="label">
        Work
      </NavigationDrawerItem>
    </NavigationDrawer>
  </div>
);

export const navigationDrawerDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "navigation-drawer",
  name: "Navigation Drawer",
  description:
    "Navigation drawers provide access to destinations and app functionality in a sliding panel.",
  category: "navigation",
  status: "stable",
  icon: "menu",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["NavigationDrawer", "NavigationDrawerItem", "NavigationDrawerHeadline", "NavigationDrawerDivider"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <NavigationDrawerHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Choose drawer type based on screen size and navigation complexity.",
    columns: {
      emphasis: "Type",
      component: "Preview",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Standard",
        component: (
          <div className="w-32 h-16 bg-surface-container rounded-sm flex">
            <div className="w-10 border-r border-outline-variant/30 p-1u space-y-1u">
              <div className="h-2u rounded-sm bg-secondary-container" />
              <div className="h-2u rounded-sm bg-surface-container-high" />
            </div>
            <div className="flex-1 p-1u">
              <div className="h-2u bg-surface-container-high rounded-sm" />
            </div>
          </div>
        ),
        rationale: "Persistent navigation on large screens.",
        examples: "Desktop apps, Admin dashboards",
      },
      {
        emphasis: "Modal",
        component: (
          <div className="w-32 h-16 bg-surface-container rounded-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-scrim/30" />
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-surface rounded-r-xl shadow-2 p-1u space-y-1u z-10">
              <div className="h-2u rounded-sm bg-secondary-container" />
              <div className="h-2u rounded-sm bg-surface-container-high" />
            </div>
          </div>
        ),
        rationale: "Overlay navigation on mobile.",
        examples: "Mobile apps, Compact screens",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Navigation drawers appear from the left edge of the screen.",
    examples: [
      {
        title: "Standard drawer",
        visual: <NavigationDrawerBasicExample />,
        caption: "Navigation drawer with items and sections",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "open",
      type: "boolean",
      default: "true",
      description: "Controls drawer visibility.",
    },
    {
      name: "modal",
      type: "boolean",
      default: "false",
      description: "Whether drawer overlays content.",
    },
    {
      name: "onClose",
      type: "() => void",
      description: "Callback when drawer should close.",
    },
    {
      name: "children",
      type: "ReactNode",
      required: true,
      description: "Navigation items and content.",
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
      name: "NavigationDrawerItem",
      description: "Navigation item within the drawer.",
      props: [
        { name: "icon", type: "ReactNode | string", description: "Icon to display." },
        { name: "active", type: "boolean", description: "Whether item is active." },
        { name: "badge", type: "string | number", description: "Badge content." },
        { name: "href", type: "string", description: "Link URL." },
        { name: "asChild", type: "boolean", description: "Render as child element." },
      ],
    },
    {
      name: "NavigationDrawerHeadline",
      description: "Section headline within the drawer.",
      props: [
        { name: "children", type: "ReactNode", description: "Headline text." },
      ],
    },
    {
      name: "NavigationDrawerDivider",
      description: "Visual divider between sections.",
      props: [],
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Uses semantic <aside> element.",
      "Active item indicated via aria-current.",
      "Modal drawer manages focus properly.",
    ],
    keyboard: [
      { key: "Tab", description: "Navigate between items" },
      { key: "Enter/Space", description: "Activate focused item" },
      { key: "Escape", description: "Close modal drawer" },
    ],
    focus: [
      "Focus visible on navigation items.",
      "Focus trapped in modal drawer.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Use with state or router for navigation.",
    code: `import {
  NavigationDrawer,
  NavigationDrawerItem,
  NavigationDrawerHeadline,
} from "@unisane/ui";
import { usePathname } from "next/navigation";
import Link from "next/link";

function AppNavigation() {
  const pathname = usePathname();

  return (
    <NavigationDrawer>
      <NavigationDrawerHeadline>Main</NavigationDrawerHeadline>

      <NavigationDrawerItem
        icon="home"
        active={pathname === "/"}
        asChild
      >
        <Link href="/">Home</Link>
      </NavigationDrawerItem>

      <NavigationDrawerItem
        icon="inbox"
        badge={5}
        active={pathname === "/inbox"}
        asChild
      >
        <Link href="/inbox">Inbox</Link>
      </NavigationDrawerItem>

      <NavigationDrawerItem
        icon="settings"
        active={pathname === "/settings"}
        asChild
      >
        <Link href="/settings">Settings</Link>
      </NavigationDrawerItem>
    </NavigationDrawer>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "navigation-rail",
      reason: "Compact vertical navigation for larger screens.",
    },
    {
      slug: "navigation-bar",
      reason: "Bottom navigation for mobile.",
    },
    {
      slug: "sheet",
      reason: "Use for non-navigation content panels.",
    },
  ],
};
