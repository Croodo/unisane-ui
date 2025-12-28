"use client";

import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";
import { Pagination, Card, IconButton } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const PaginationHeroVisual = () => (
  <HeroBackground tone="surface">
    {/* Mock Pagination */}
    <div className="relative bg-surface px-4 py-3 rounded-lg shadow-xl border border-outline-variant/30">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-sm flex items-center justify-center text-on-surface-variant">
          <span className="material-symbols-outlined">chevron_left</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-10 h-10 rounded-sm flex items-center justify-center text-on-surface-variant hover:bg-on-surface/10">1</div>
          <div className="w-10 h-10 rounded-sm flex items-center justify-center text-on-surface-variant hover:bg-on-surface/10">2</div>
          <div className="w-10 h-10 rounded-sm flex items-center justify-center bg-primary text-on-primary">3</div>
          <div className="w-10 h-10 rounded-sm flex items-center justify-center text-on-surface-variant hover:bg-on-surface/10">4</div>
          <div className="w-10 h-10 rounded-sm flex items-center justify-center text-on-surface-variant">...</div>
          <div className="w-10 h-10 rounded-sm flex items-center justify-center text-on-surface-variant hover:bg-on-surface/10">12</div>
        </div>
        <div className="w-10 h-10 rounded-sm flex items-center justify-center text-on-surface-variant">
          <span className="material-symbols-outlined">chevron_right</span>
        </div>
      </div>
    </div>
  </HeroBackground>
);

export const paginationDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "pagination",
  name: "Pagination",
  description:
    "Pagination allows users to navigate through large sets of content split across multiple pages.",
  category: "navigation",
  status: "stable",
  icon: "more_horiz",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["Pagination"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <PaginationHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Pagination displays page numbers with smart ellipsis for large page counts.",
    columns: {
      emphasis: "Scenario",
      component: "Example",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Few pages",
        component: (
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 rounded-xs flex items-center justify-center bg-primary text-on-primary text-[10px]">1</div>
            <div className="w-6 h-6 rounded-xs flex items-center justify-center text-on-surface-variant text-[10px]">2</div>
            <div className="w-6 h-6 rounded-xs flex items-center justify-center text-on-surface-variant text-[10px]">3</div>
          </div>
        ),
        rationale:
          "Shows all pages when total is small.",
        examples: "Small data sets, Settings pages",
      },
      {
        emphasis: "Many pages",
        component: (
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 rounded-xs flex items-center justify-center text-on-surface-variant text-[10px]">1</div>
            <div className="text-[10px] text-on-surface-variant">...</div>
            <div className="w-6 h-6 rounded-xs flex items-center justify-center bg-primary text-on-primary text-[10px]">5</div>
            <div className="text-[10px] text-on-surface-variant">...</div>
            <div className="w-6 h-6 rounded-xs flex items-center justify-center text-on-surface-variant text-[10px]">10</div>
          </div>
        ),
        rationale:
          "Ellipsis collapses distant pages.",
        examples: "Search results, Large catalogs",
      },
    ],
  },

  // ─── HIERARCHY SECTION ─────────────────────────────────────────────────────
  hierarchy: {
    description:
      "Pagination consists of navigation arrows and page buttons.",
    items: [
      {
        component: (
          <div className="w-8 h-8 rounded-sm flex items-center justify-center text-on-surface-variant border border-outline-variant/30">
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          </div>
        ),
        title: "Previous",
        subtitle: "Navigate back",
      },
      {
        component: (
          <div className="w-8 h-8 rounded-sm flex items-center justify-center bg-primary text-on-primary text-body-small">3</div>
        ),
        title: "Current",
        subtitle: "Active page",
      },
      {
        component: (
          <div className="w-8 h-8 rounded-sm flex items-center justify-center text-on-surface-variant border border-outline-variant/30">
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </div>
        ),
        title: "Next",
        subtitle: "Navigate forward",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Pagination is typically placed below content or tables.",
    examples: [
      {
        title: "Below table",
        visual: (
          <Card variant="outlined" padding="md" className="max-w-80 mx-auto">
            <div className="text-label-small text-on-surface-variant mb-3">Showing 21-30 of 120 items</div>
            <Pagination
              currentPage={3}
              totalPages={12}
              onPageChange={() => {}}
            />
          </Card>
        ),
        caption: "Pagination with item count context",
      },
      {
        title: "Centered layout",
        visual: (
          <Card variant="outlined" padding="md" className="max-w-80 mx-auto">
            <div className="flex justify-center">
              <Pagination
                currentPage={1}
                totalPages={5}
                onPageChange={() => {}}
              />
            </div>
          </Card>
        ),
        caption: "Centered pagination for smaller page counts",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "currentPage",
      type: "number",
      required: true,
      description: "The currently active page (1-indexed).",
    },
    {
      name: "totalPages",
      type: "number",
      required: true,
      description: "Total number of pages.",
    },
    {
      name: "onPageChange",
      type: "(page: number) => void",
      required: true,
      description: "Callback fired when page changes.",
    },
    {
      name: "getPageHref",
      type: "(page: number) => string",
      description: "Function to generate href for each page (for SEO-friendly links).",
    },
    {
      name: "renderLink",
      type: "(page: number, children: ReactNode) => ReactNode",
      description: "Custom link renderer for framework routing (Next.js Link, etc.).",
    },
    {
      name: "className",
      type: "string",
      description: "Additional CSS classes.",
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Uses nav element with aria-label='Pagination'.",
      "Current page marked with aria-current='page'.",
      "Each button has aria-label describing the page number.",
    ],
    keyboard: [
      { key: "Tab", description: "Moves focus between page buttons" },
      { key: "Enter / Space", description: "Activates the focused page button" },
    ],
    focus: [
      "Page buttons have visible focus ring.",
      "Current page is visually distinct.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Use controlled state to manage current page.",
    code: `import { Pagination } from "@unisane/ui";
import { useState } from "react";

function PaginatedList({ items, itemsPerPage = 10 }) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(items.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = items.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      <ul>
        {currentItems.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-gray-500">
          Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, items.length)} of {items.length}
        </span>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}

// With Next.js Link for SEO
function SEOPagination() {
  return (
    <Pagination
      currentPage={3}
      totalPages={10}
      onPageChange={(page) => router.push(\`/items?page=\${page}\`)}
      getPageHref={(page) => \`/items?page=\${page}\`}
    />
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "table",
      reason: "Often used together for paginated data tables.",
    },
    {
      slug: "list",
      reason: "Use with lists for paginated content.",
    },
    {
      slug: "icon-button",
      reason: "Used for prev/next navigation buttons.",
    },
  ],
};
