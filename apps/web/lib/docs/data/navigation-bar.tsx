"use client";

import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";
import { NavigationBar } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const NavigationBarHeroVisual = () => (
  <HeroBackground tone="surface">
    {/* Mock Phone with Nav Bar */}
    <div className="relative bg-surface w-[280px] h-[200px] rounded-3xl shadow-xl overflow-hidden border border-outline-variant/30">
      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="h-4 bg-surface-container-high rounded-sm w-full" />
        <div className="h-4 bg-surface-container-high rounded-sm w-3/4" />
        <div className="h-4 bg-surface-container-high rounded-sm w-1/2" />
      </div>
      {/* Navigation Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-surface-container border-t border-outline-variant/30 flex items-center justify-around px-4 pb-4">
        <div className="flex flex-col items-center gap-1">
          <div className="w-16 h-8 rounded-sm bg-secondary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-secondary-container">home</span>
          </div>
          <span className="text-label-medium text-on-surface">Home</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-16 h-8 flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant">search</span>
          </div>
          <span className="text-label-medium text-on-surface-variant">Search</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-16 h-8 flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant">person</span>
          </div>
          <span className="text-label-medium text-on-surface-variant">Profile</span>
        </div>
      </div>
    </div>
  </HeroBackground>
);

// ─── EXAMPLES ────────────────────────────────────────────────────────────────
const NavigationBarBasicExample = () => (
  <div className="w-full max-w-sm relative h-24 bg-surface-container rounded-lg overflow-hidden">
    <NavigationBar className="relative h-20">
      <NavigationBar.Item
        icon={<span className="material-symbols-outlined">home</span>}
        label="Home"
        active
      />
      <NavigationBar.Item
        icon={<span className="material-symbols-outlined">explore</span>}
        label="Explore"
      />
      <NavigationBar.Item
        icon={<span className="material-symbols-outlined">bookmark</span>}
        label="Saved"
      />
      <NavigationBar.Item
        icon={<span className="material-symbols-outlined">person</span>}
        label="Profile"
      />
    </NavigationBar>
  </div>
);

export const navigationBarDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "navigation-bar",
  name: "Navigation Bar",
  description:
    "Navigation bars provide access to primary destinations in an app on mobile devices.",
  category: "navigation",
  status: "stable",
  icon: "bottom_navigation",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["NavigationBar"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <NavigationBarHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Use navigation bar for primary app destinations (3-5 items).",
    columns: {
      emphasis: "Items",
      component: "Preview",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "3 items",
        component: (
          <div className="w-32 h-10 bg-surface-container rounded-sm flex items-center justify-around px-2">
            {["home", "search", "person"].map((icon, i) => (
              <div key={icon} className="flex flex-col items-center">
                <span className={`material-symbols-outlined text-[14px] ${i === 0 ? "text-primary" : "text-on-surface-variant"}`}>{icon}</span>
              </div>
            ))}
          </div>
        ),
        rationale: "Minimal navigation for focused apps.",
        examples: "Simple apps, Single-purpose tools",
      },
      {
        emphasis: "4-5 items",
        component: (
          <div className="w-32 h-10 bg-surface-container rounded-sm flex items-center justify-around px-1">
            {["home", "search", "add_box", "notifications", "person"].map((icon, i) => (
              <div key={icon} className="flex flex-col items-center">
                <span className={`material-symbols-outlined text-[12px] ${i === 0 ? "text-primary" : "text-on-surface-variant"}`}>{icon}</span>
              </div>
            ))}
          </div>
        ),
        rationale: "Standard navigation for most apps.",
        examples: "Social media, E-commerce, Content apps",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Navigation bar is fixed at the bottom of mobile screens.",
    examples: [
      {
        title: "Basic navigation",
        visual: <NavigationBarBasicExample />,
        caption: "Click items to navigate between sections",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "children",
      type: "ReactNode",
      required: true,
      description: "NavigationBar.Item components.",
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
      name: "NavigationBar.Item",
      description: "Individual navigation item.",
      props: [
        { name: "icon", type: "ReactNode", required: true, description: "Icon to display." },
        { name: "label", type: "string", required: true, description: "Label text below icon." },
        { name: "active", type: "boolean", description: "Whether this item is active." },
        { name: "onClick", type: "() => void", description: "Click handler." },
        { name: "href", type: "string", description: "Link URL if using as anchor." },
        { name: "asChild", type: "boolean", description: "Render as child element (for Next.js Link)." },
      ],
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Uses semantic <nav> element.",
      "aria-current indicates active page.",
      "Labels provide context for each destination.",
    ],
    keyboard: [
      { key: "Tab", description: "Navigate between items" },
      { key: "Enter/Space", description: "Activate focused item" },
    ],
    focus: [
      "Focus ring visible on focused items.",
      "Active state clearly distinguished visually.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Use with state or router for active tracking.",
    code: `import { NavigationBar } from "@unisane/ui";
import { usePathname } from "next/navigation";
import Link from "next/link";

function MobileNav() {
  const pathname = usePathname();

  return (
    <NavigationBar>
      <NavigationBar.Item
        icon={<span className="material-symbols-outlined">home</span>}
        label="Home"
        active={pathname === "/"}
        asChild
      >
        <Link href="/" />
      </NavigationBar.Item>

      <NavigationBar.Item
        icon={<span className="material-symbols-outlined">search</span>}
        label="Search"
        active={pathname === "/search"}
        asChild
      >
        <Link href="/search" />
      </NavigationBar.Item>

      <NavigationBar.Item
        icon={<span className="material-symbols-outlined">person</span>}
        label="Profile"
        active={pathname === "/profile"}
        asChild
      >
        <Link href="/profile" />
      </NavigationBar.Item>
    </NavigationBar>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "navigation-rail",
      reason: "Use for larger screens (tablet/desktop).",
    },
    {
      slug: "navigation-drawer",
      reason: "Use for many destinations or secondary navigation.",
    },
    {
      slug: "bottom-app-bar",
      reason: "Use for contextual actions instead of navigation.",
    },
  ],
};
