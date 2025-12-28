"use client";

import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis, Card } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const BreadcrumbHeroVisual = () => (
  <HeroBackground tone="surface">
    {/* Mock Breadcrumb */}
    <div className="relative bg-surface px-5 py-3 rounded-lg shadow-xl border border-outline-variant/30">
      <div className="flex items-center gap-2">
        <span className="text-label-medium font-medium text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Home</span>
        <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
        <span className="text-label-medium font-medium text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Products</span>
        <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
        <span className="text-label-medium font-medium text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Electronics</span>
        <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
        <span className="text-label-medium font-medium text-on-surface">Headphones</span>
      </div>
    </div>
  </HeroBackground>
);

export const breadcrumbDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "breadcrumb",
  name: "Breadcrumb",
  description:
    "Breadcrumbs show the user's location within a navigation hierarchy and allow quick navigation to parent pages.",
  category: "navigation",
  status: "stable",
  icon: "chevron_right",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["Breadcrumb", "BreadcrumbItem", "BreadcrumbLink", "BreadcrumbPage", "BreadcrumbSeparator", "BreadcrumbEllipsis"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <BreadcrumbHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Breadcrumbs can include links, the current page, and ellipsis for long paths.",
    columns: {
      emphasis: "Element",
      component: "Example",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Link",
        component: (
          <span className="text-label-medium font-medium text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Products</span>
        ),
        rationale:
          "Clickable ancestor pages in the hierarchy.",
        examples: "Parent categories, Sections",
      },
      {
        emphasis: "Current",
        component: (
          <span className="text-label-medium font-medium text-on-surface">Current Page</span>
        ),
        rationale:
          "The current page (not clickable).",
        examples: "Active page, Detail view",
      },
      {
        emphasis: "Ellipsis",
        component: (
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 rounded-xs flex items-center justify-center text-on-surface-variant hover:bg-on-surface/10 cursor-pointer">
              <span className="text-[12px]">•••</span>
            </div>
            <span className="material-symbols-outlined text-[12px] text-outline">chevron_right</span>
          </div>
        ),
        rationale:
          "Collapses middle items in long paths.",
        examples: "Deep hierarchies, Long paths",
      },
    ],
  },

  // ─── HIERARCHY SECTION ─────────────────────────────────────────────────────
  hierarchy: {
    description:
      "Breadcrumbs are composed of items, links, separators, and the current page.",
    items: [
      {
        component: (
          <div className="flex items-center gap-2">
            <span className="text-label-small text-on-surface-variant">Home</span>
            <span className="material-symbols-outlined text-[12px] text-outline">chevron_right</span>
            <span className="text-label-small text-on-surface">Page</span>
          </div>
        ),
        title: "Simple",
        subtitle: "Two levels",
      },
      {
        component: (
          <div className="flex items-center gap-2">
            <span className="text-label-small text-on-surface-variant">Home</span>
            <span className="material-symbols-outlined text-[12px] text-outline">chevron_right</span>
            <span className="text-[10px] text-on-surface-variant">•••</span>
            <span className="material-symbols-outlined text-[12px] text-outline">chevron_right</span>
            <span className="text-label-small text-on-surface">Page</span>
          </div>
        ),
        title: "Collapsed",
        subtitle: "With ellipsis",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Breadcrumbs are typically placed at the top of the page content area.",
    examples: [
      {
        title: "Standard breadcrumb",
        visual: (
          <Card variant="outlined" padding="md" className="max-w-80 mx-auto">
            <Breadcrumb>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
                <BreadcrumbSeparator />
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink href="/products">Products</BreadcrumbLink>
                <BreadcrumbSeparator />
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbPage>Details</BreadcrumbPage>
              </BreadcrumbItem>
            </Breadcrumb>
          </Card>
        ),
        caption: "Three-level navigation path",
      },
      {
        title: "With ellipsis",
        visual: (
          <Card variant="outlined" padding="md" className="max-w-80 mx-auto">
            <Breadcrumb>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
                <BreadcrumbSeparator />
              </BreadcrumbItem>
              <BreadcrumbEllipsis />
              <BreadcrumbItem>
                <BreadcrumbLink href="/category">Category</BreadcrumbLink>
                <BreadcrumbSeparator />
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbPage>Item</BreadcrumbPage>
              </BreadcrumbItem>
            </Breadcrumb>
          </Card>
        ),
        caption: "Collapsed middle sections",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "children",
      type: "ReactNode",
      required: true,
      description: "BreadcrumbItem components.",
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
      name: "BreadcrumbItem",
      description: "Container for a breadcrumb link or page.",
      props: [
        { name: "children", type: "ReactNode", required: true, description: "Link and separator elements." },
      ],
    },
    {
      name: "BreadcrumbLink",
      description: "Clickable link to an ancestor page.",
      props: [
        { name: "children", type: "ReactNode", required: true, description: "Link text." },
        { name: "href", type: "string", description: "Link URL." },
        { name: "onClick", type: "() => void", description: "Click handler for programmatic navigation." },
        { name: "asChild", type: "boolean", description: "Use child as link element (e.g., Next.js Link)." },
      ],
    },
    {
      name: "BreadcrumbPage",
      description: "The current page (non-clickable).",
      props: [
        { name: "children", type: "ReactNode", required: true, description: "Current page title." },
      ],
    },
    {
      name: "BreadcrumbSeparator",
      description: "Visual separator between items (chevron icon).",
      props: [],
    },
    {
      name: "BreadcrumbEllipsis",
      description: "Collapsible ellipsis for long breadcrumb paths.",
      props: [
        { name: "onClick", type: "() => void", description: "Handler to expand collapsed items." },
      ],
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Uses nav element with aria-label='breadcrumb'.",
      "Links are properly announced with their text.",
      "Current page is indicated to screen readers.",
    ],
    keyboard: [
      { key: "Tab", description: "Moves focus between breadcrumb links" },
      { key: "Enter", description: "Activates the focused link" },
    ],
    focus: [
      "Links have visible focus ring on keyboard navigation.",
      "Focus follows natural reading order.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Compose breadcrumbs with items, links, and separators.",
    code: `import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@unisane/ui";

function ProductBreadcrumb({ category, product }) {
  return (
    <Breadcrumb>
      <BreadcrumbItem>
        <BreadcrumbLink href="/">Home</BreadcrumbLink>
        <BreadcrumbSeparator />
      </BreadcrumbItem>
      <BreadcrumbItem>
        <BreadcrumbLink href="/products">Products</BreadcrumbLink>
        <BreadcrumbSeparator />
      </BreadcrumbItem>
      <BreadcrumbItem>
        <BreadcrumbLink href={\`/products/\${category.slug}\`}>
          {category.name}
        </BreadcrumbLink>
        <BreadcrumbSeparator />
      </BreadcrumbItem>
      <BreadcrumbItem>
        <BreadcrumbPage>{product.name}</BreadcrumbPage>
      </BreadcrumbItem>
    </Breadcrumb>
  );
}

// With Next.js Link
import Link from "next/link";

function NextBreadcrumb() {
  return (
    <Breadcrumb>
      <BreadcrumbItem>
        <BreadcrumbLink asChild>
          <Link href="/">Home</Link>
        </BreadcrumbLink>
        <BreadcrumbSeparator />
      </BreadcrumbItem>
      <BreadcrumbItem>
        <BreadcrumbPage>Current</BreadcrumbPage>
      </BreadcrumbItem>
    </Breadcrumb>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "navigation-drawer",
      reason: "Use for primary navigation structure.",
    },
    {
      slug: "tabs",
      reason: "Use for sibling-level navigation.",
    },
    {
      slug: "top-app-bar",
      reason: "Breadcrumbs often appear below app bars.",
    },
  ],
};
