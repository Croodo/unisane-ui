"use client";

import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const SidebarHeroVisual = () => (
  <HeroBackground tone="surface">
    {/* Mock App with Sidebar */}
    <div className="relative bg-surface w-80 h-56 rounded-xl shadow-xl overflow-hidden border border-outline-variant/30 flex">
      {/* Rail */}
      <div className="w-14 bg-surface-container border-r border-outline-variant/20 py-3 flex flex-col items-center gap-2 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-[18px]">home</span>
        </div>
        <div className="w-8 h-8 rounded-lg hover:bg-surface-container-high flex items-center justify-center">
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">inbox</span>
        </div>
        <div className="w-8 h-8 rounded-lg hover:bg-surface-container-high flex items-center justify-center">
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">settings</span>
        </div>
      </div>
      {/* Drawer */}
      <div className="w-44 bg-surface-container border-r border-outline-variant/20 p-3 shrink-0">
        <div className="text-title-small text-on-surface mb-4">Dashboard</div>
        <div className="space-y-1">
          <div className="p-2 rounded-lg bg-secondary-container text-label-medium text-primary">Overview</div>
          <div className="p-2 rounded-lg text-label-medium text-on-surface-variant">Analytics</div>
          <div className="p-2 rounded-lg text-label-medium text-on-surface-variant">Reports</div>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 p-4 bg-surface-container-lowest">
        <div className="h-3 bg-on-surface/15 rounded-sm w-1/3 mb-3" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-16 bg-surface-container rounded-lg" />
          <div className="h-16 bg-surface-container rounded-lg" />
        </div>
      </div>
    </div>
  </HeroBackground>
);

// ─── EXAMPLES ────────────────────────────────────────────────────────────────
const RailOnlyExample = () => (
  <div className="w-full max-w-xs h-56 bg-surface rounded-lg overflow-hidden border border-outline-variant/30 flex">
    {/* Rail */}
    <div className="w-16 bg-surface-container py-4 flex flex-col items-center gap-1 shrink-0">
      <div className="flex flex-col items-center gap-1 w-full px-2">
        <div className="w-12 h-7 rounded-xl bg-secondary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
        </div>
        <span className="text-[11px] text-primary font-bold">Home</span>
      </div>
      <div className="flex flex-col items-center gap-1 w-full px-2">
        <div className="w-12 h-7 rounded-xl flex items-center justify-center hover:bg-on-surface/8">
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
        </div>
        <span className="text-[11px] text-on-surface-variant">Search</span>
      </div>
      <div className="flex flex-col items-center gap-1 w-full px-2">
        <div className="w-12 h-7 rounded-xl flex items-center justify-center hover:bg-on-surface/8 relative">
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">notifications</span>
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-error text-on-error text-[10px] rounded-full flex items-center justify-center">3</span>
        </div>
        <span className="text-[11px] text-on-surface-variant">Alerts</span>
      </div>
    </div>
    {/* Content */}
    <div className="flex-1 p-4 bg-surface-container-lowest">
      <div className="h-4 bg-on-surface/15 rounded-sm w-1/2 mb-4" />
      <div className="space-y-2">
        <div className="h-3 bg-surface-container-high rounded-sm w-full" />
        <div className="h-3 bg-surface-container-high rounded-sm w-3/4" />
      </div>
    </div>
  </div>
);

const ExpandedSidebarExample = () => (
  <div className="w-full max-w-md h-64 bg-surface rounded-lg overflow-hidden border border-outline-variant/30 flex">
    {/* Rail */}
    <div className="w-16 bg-surface-container border-r border-outline-variant/10 py-4 flex flex-col items-center gap-1 shrink-0">
      <div className="flex flex-col items-center gap-1 w-full px-2">
        <div className="w-12 h-7 rounded-xl bg-secondary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>folder</span>
        </div>
        <span className="text-[11px] text-primary font-bold">Files</span>
      </div>
      <div className="flex flex-col items-center gap-1 w-full px-2">
        <div className="w-12 h-7 rounded-xl flex items-center justify-center hover:bg-on-surface/8">
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">star</span>
        </div>
        <span className="text-[11px] text-on-surface-variant">Starred</span>
      </div>
    </div>
    {/* Drawer */}
    <div className="w-48 bg-surface-container p-3 shrink-0">
      <div className="text-label-small text-on-surface-variant mb-3 px-2">FILES</div>
      <div className="space-y-1">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-secondary-container">
          <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>folder</span>
          <span className="text-body-medium text-primary font-semibold">Documents</span>
        </div>
        <div className="flex items-center gap-3 p-2 rounded-xl text-on-surface-variant hover:bg-on-surface/8">
          <span className="material-symbols-outlined text-[20px]">folder</span>
          <span className="text-body-medium">Images</span>
        </div>
        <div className="flex items-center gap-3 p-2 rounded-xl text-on-surface-variant hover:bg-on-surface/8">
          <span className="material-symbols-outlined text-[20px]">folder</span>
          <span className="text-body-medium">Downloads</span>
        </div>
      </div>
    </div>
    {/* Content */}
    <div className="flex-1 p-4 bg-surface-container-lowest border-l border-outline-variant/10">
      <div className="text-title-medium text-on-surface mb-3">Documents</div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-surface border border-outline-variant/20">
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">description</span>
          <span className="text-body-small text-on-surface">Report.pdf</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-surface border border-outline-variant/20">
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">description</span>
          <span className="text-body-small text-on-surface">Notes.txt</span>
        </div>
      </div>
    </div>
  </div>
);

export const sidebarDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "sidebar",
  name: "Sidebar",
  description:
    "A comprehensive app-level navigation system with a collapsible rail and expandable drawer. Follows Material Design 3 navigation patterns with responsive behavior across all screen sizes.",
  category: "navigation",
  status: "stable",
  icon: "dock_to_left",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: [
    "Sidebar",
    "SidebarProvider",
    "SidebarRail",
    "SidebarRailItem",
    "SidebarDrawer",
    "SidebarHeader",
    "SidebarFooter",
    "SidebarContent",
    "SidebarGroup",
    "SidebarGroupLabel",
    "SidebarMenu",
    "SidebarMenuItem",
    "SidebarTrigger",
    "SidebarBackdrop",
    "SidebarInset",
    "SidebarCollapsibleGroup",
    "useSidebar",
  ],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <SidebarHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Choose the right navigation pattern based on your app structure and screen requirements.",
    columns: {
      emphasis: "Pattern",
      component: "Preview",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Rail + Drawer",
        component: (
          <div className="w-32 h-16 bg-surface-container rounded-sm flex overflow-hidden">
            <div className="w-6 border-r border-outline-variant/10 py-1 flex flex-col items-center gap-1">
              <div className="w-4 h-2 rounded-sm bg-secondary-container" />
              <div className="w-4 h-2 rounded-sm bg-surface-container-high" />
            </div>
            <div className="w-12 border-r border-outline-variant/10 p-1 space-y-1">
              <div className="h-2 rounded-sm bg-secondary-container" />
              <div className="h-2 rounded-sm bg-surface-container-high" />
            </div>
            <div className="flex-1 p-1 bg-surface-container-lowest">
              <div className="h-2 bg-surface-container-high rounded-sm" />
            </div>
          </div>
        ),
        rationale: "Full navigation with icons and expandable menu.",
        examples: "Admin dashboards, Complex apps",
      },
      {
        emphasis: "Rail Only",
        component: (
          <div className="w-32 h-16 bg-surface-container rounded-sm flex overflow-hidden">
            <div className="w-8 border-r border-outline-variant/10 py-1 flex flex-col items-center gap-1">
              <div className="w-5 h-3 rounded-md bg-secondary-container" />
              <div className="w-5 h-3 rounded-md bg-surface-container-high" />
              <div className="w-5 h-3 rounded-md bg-surface-container-high" />
            </div>
            <div className="flex-1 p-1 bg-surface-container-lowest">
              <div className="h-2 bg-surface-container-high rounded-sm" />
            </div>
          </div>
        ),
        rationale: "Compact icon-based navigation.",
        examples: "Simple apps, Limited nav items",
      },
      {
        emphasis: "Mobile Drawer",
        component: (
          <div className="w-32 h-16 bg-surface-container rounded-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-scrim/20" />
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-surface-container shadow-3 p-1 space-y-1 z-10">
              <div className="h-2 rounded-sm bg-secondary-container" />
              <div className="h-2 rounded-sm bg-surface-container-high" />
              <div className="h-2 rounded-sm bg-surface-container-high" />
            </div>
          </div>
        ),
        rationale: "Overlay navigation for mobile screens.",
        examples: "Mobile views, Tablet compact",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Sidebar adapts to screen size automatically. Rail shows on expanded screens, overlay drawer on mobile/tablet.",
    examples: [
      {
        title: "Rail navigation",
        visual: <RailOnlyExample />,
        caption: "Icon-based rail with labels, badges, and active states",
      },
      {
        title: "Expanded with drawer",
        visual: <ExpandedSidebarExample />,
        caption: "Rail plus drawer showing full navigation menu",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "items",
      type: "NavigationItem[]",
      description: "Navigation items configuration for the SidebarProvider.",
    },
    {
      name: "defaultActiveId",
      type: "string | null",
      default: "null",
      description: "Initially active navigation item ID.",
    },
    {
      name: "defaultExpanded",
      type: "boolean",
      default: "false",
      description: "Whether drawer is expanded by default on desktop.",
    },
    {
      name: "persist",
      type: "boolean",
      default: "false",
      description: "Persist sidebar state to localStorage.",
    },
    {
      name: "storageKey",
      type: "string",
      default: '"unisane-sidebar"',
      description: "Key for localStorage persistence.",
    },
    {
      name: "hoverDelay",
      type: "number",
      default: "150",
      description: "Delay before showing drawer on hover (ms).",
    },
    {
      name: "exitDelay",
      type: "number",
      default: "300",
      description: "Delay before hiding drawer after mouse leaves (ms).",
    },
    {
      name: "railWidth",
      type: "number",
      default: "96",
      description: "Width of the rail in pixels.",
    },
    {
      name: "drawerWidth",
      type: "number",
      default: "220",
      description: "Width of the drawer in pixels.",
    },
    {
      name: "mobileDrawerWidth",
      type: "number",
      default: "280",
      description: "Width of the drawer on mobile in pixels.",
    },
    {
      name: "onActiveChange",
      type: "(id: string | null) => void",
      description: "Callback when active item changes.",
    },
    {
      name: "onExpandedChange",
      type: "(expanded: boolean) => void",
      description: "Callback when drawer expanded state changes.",
    },
  ],

  // ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────
  subComponents: [
    {
      name: "SidebarProvider",
      description: "Context provider that manages sidebar state. Wrap your app layout with this.",
      props: [
        { name: "children", type: "ReactNode", required: true, description: "App content." },
        { name: "items", type: "NavigationItem[]", description: "Navigation items for state management." },
      ],
    },
    {
      name: "SidebarRail",
      description: "Vertical icon navigation bar on the left side.",
      props: [
        { name: "children", type: "ReactNode", description: "Rail items." },
      ],
    },
    {
      name: "SidebarRailItem",
      description: "Individual navigation item in the rail.",
      props: [
        { name: "id", type: "string", required: true, description: "Unique identifier." },
        { name: "label", type: "string", required: true, description: "Text label below icon." },
        { name: "icon", type: "ReactNode | string", required: true, description: "Icon to display." },
        { name: "activeIcon", type: "ReactNode | string", description: "Icon when active." },
        { name: "badge", type: "string | number", description: "Badge content." },
        { name: "disabled", type: "boolean", description: "Disable the item." },
        { name: "href", type: "string", description: "Link URL." },
        { name: "asChild", type: "boolean", description: "Render as child element." },
        { name: "childIds", type: "string[]", description: "IDs of child items for active state." },
      ],
    },
    {
      name: "SidebarDrawer",
      description: "Expandable navigation panel that slides out from the rail.",
      props: [
        { name: "children", type: "ReactNode", description: "Drawer content." },
      ],
    },
    {
      name: "SidebarMenuItem",
      description: "Navigation item within the drawer menu.",
      props: [
        { name: "id", type: "string", description: "Unique identifier for state management." },
        { name: "label", type: "string", required: true, description: "Item text." },
        { name: "icon", type: "ReactNode | string", description: "Leading icon." },
        { name: "active", type: "boolean", description: "Controlled active state." },
        { name: "disabled", type: "boolean", description: "Disable the item." },
        { name: "href", type: "string", description: "Link URL." },
        { name: "onClick", type: "() => void", description: "Click handler." },
        { name: "asChild", type: "boolean", description: "Render as child element." },
      ],
    },
    {
      name: "SidebarCollapsibleGroup",
      description: "Collapsible group of menu items with expand/collapse behavior.",
      props: [
        { name: "id", type: "string", required: true, description: "Unique group identifier." },
        { name: "label", type: "string", required: true, description: "Group heading text." },
        { name: "icon", type: "ReactNode | string", description: "Leading icon." },
        { name: "defaultOpen", type: "boolean", description: "Initially expanded." },
        { name: "childIds", type: "string[]", description: "IDs of child items." },
      ],
    },
    {
      name: "SidebarInset",
      description: "Main content area that adjusts margin based on sidebar state.",
      props: [
        { name: "children", type: "ReactNode", required: true, description: "Page content." },
      ],
    },
    {
      name: "SidebarTrigger",
      description: "Button to toggle sidebar open/closed state.",
      props: [
        { name: "children", type: "ReactNode", description: "Custom trigger content." },
      ],
    },
    {
      name: "SidebarBackdrop",
      description: "Overlay backdrop for mobile drawer.",
      props: [],
    },
    {
      name: "useSidebar",
      description: "Hook to access sidebar state and methods.",
      props: [],
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Rail uses nav element with aria-label.",
      "Active items marked with aria-current=\"page\".",
      "Disabled items have aria-disabled attribute.",
      "Drawer hidden state communicated via aria-hidden.",
      "Collapsible groups use aria-expanded and aria-controls.",
    ],
    keyboard: [
      { key: "Tab", description: "Navigate between rail items and menu items" },
      { key: "Enter/Space", description: "Activate focused item" },
      { key: "Escape", description: "Close mobile drawer" },
    ],
    focus: [
      "Focus visible ring on all interactive items.",
      "Focus trapped in mobile drawer when open.",
      "Drawer respects prefers-reduced-motion.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Wrap your app with SidebarProvider and compose the sidebar structure.",
    code: `import {
  Sidebar,
  SidebarProvider,
  SidebarRail,
  SidebarRailItem,
  SidebarDrawer,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarBackdrop,
  SidebarInset,
} from "@unisane/ui";
import { usePathname } from "next/navigation";
import Link from "next/link";

const navItems = [
  { id: "home", label: "Home", icon: "home", href: "/" },
  { id: "inbox", label: "Inbox", icon: "inbox", href: "/inbox" },
  { id: "settings", label: "Settings", icon: "settings", href: "/settings" },
];

function AppLayout({ children }) {
  const pathname = usePathname();
  const activeId = navItems.find(item => item.href === pathname)?.id || null;

  return (
    <SidebarProvider defaultActiveId={activeId} persist>
      <Sidebar>
        <SidebarRail>
          {navItems.map((item) => (
            <SidebarRailItem
              key={item.id}
              id={item.id}
              label={item.label}
              icon={item.icon}
              asChild
            >
              <Link href={item.href}>{item.label}</Link>
            </SidebarRailItem>
          ))}
        </SidebarRail>

        <SidebarDrawer>
          <SidebarHeader>
            <h2 className="text-title-medium">My App</h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  icon={item.icon}
                  href={item.href}
                  asChild
                >
                  <Link href={item.href}>{item.label}</Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </SidebarDrawer>

        <SidebarBackdrop />
      </Sidebar>

      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "navigation-drawer",
      reason: "Simpler navigation drawer without rail pattern.",
    },
    {
      slug: "navigation-rail",
      reason: "Standalone rail component without drawer integration.",
    },
    {
      slug: "navigation-bar",
      reason: "Bottom navigation for mobile primary destinations.",
    },
  ],
};
