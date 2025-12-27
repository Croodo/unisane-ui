"use client";

import { ComponentDoc } from "../types";
import { ScrollArea } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const ScrollAreaHeroVisual = () => (
  <div className="relative w-full h-full bg-linear-to-br from-primary-container to-secondary-container flex items-center justify-center p-8 overflow-hidden isolate">
    {/* Decorative Circles */}
    <div className="absolute top-[-40px] left-[-40px] w-56 h-56 bg-primary/20 rounded-full blur-3xl" />
    <div className="absolute bottom-[-50px] right-[-30px] w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />

    {/* Mock Scrollable Content */}
    <div className="relative bg-surface w-[280px] h-[200px] rounded-3xl shadow-xl overflow-hidden border border-outline-variant/30 z-10">
      <div className="p-4u h-full relative">
        <div className="space-y-3u">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-3u">
              <div className="w-10u h-10u rounded-full bg-surface-container-high shrink-0" />
              <div className="flex-1 space-y-1u">
                <div className="h-3u bg-surface-container-high rounded-sm w-2/3" />
                <div className="h-2u bg-surface-container-high rounded-sm w-1/2" />
              </div>
            </div>
          ))}
        </div>
        {/* Scrollbar indicator */}
        <div className="absolute right-1u top-4u bottom-4u w-2u bg-outline-variant/20 rounded-full">
          <div className="w-full h-1/3 bg-outline-variant/60 rounded-full" />
        </div>
      </div>
    </div>
  </div>
);

// ─── EXAMPLES ────────────────────────────────────────────────────────────────
const ScrollAreaVerticalExample = () => (
  <ScrollArea className="h-[200px] w-full max-w-xs rounded-lg border border-outline-variant/30">
    <div className="p-4u space-y-4u">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="flex items-center gap-3u p-3u bg-surface-container rounded-lg">
          <div className="w-10u h-10u rounded-full bg-primary-container flex items-center justify-center">
            <span className="text-label-medium text-on-primary-container">{i + 1}</span>
          </div>
          <div>
            <div className="text-body-medium text-on-surface">Item {i + 1}</div>
            <div className="text-body-small text-on-surface-variant">Description text</div>
          </div>
        </div>
      ))}
    </div>
  </ScrollArea>
);

const ScrollAreaHorizontalExample = () => (
  <ScrollArea orientation="horizontal" className="w-full max-w-xs">
    <div className="flex gap-4u p-4u">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="w-32 h-24u shrink-0 rounded-lg bg-surface-container flex items-center justify-center border border-outline-variant/30"
        >
          <span className="text-title-medium text-on-surface">Card {i + 1}</span>
        </div>
      ))}
    </div>
  </ScrollArea>
);

export const scrollAreaDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "scroll-area",
  name: "Scroll Area",
  description:
    "Scroll area provides a styled scrollable container with customized scrollbars.",
  category: "containment",
  status: "stable",
  icon: "unfold_more",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["ScrollArea"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <ScrollAreaHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Choose scroll orientation based on content layout.",
    columns: {
      emphasis: "Orientation",
      component: "Preview",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Vertical",
        component: (
          <div className="w-20 h-16 bg-surface-container rounded-sm relative overflow-hidden">
            <div className="absolute right-1u top-1u bottom-1u w-1u bg-outline-variant/20 rounded-full">
              <div className="w-full h-1/3 bg-outline-variant/60 rounded-full" />
            </div>
          </div>
        ),
        rationale: "Default for lists and long content.",
        examples: "Lists, Chat messages, Feeds",
      },
      {
        emphasis: "Horizontal",
        component: (
          <div className="w-20 h-12 bg-surface-container rounded-sm relative overflow-hidden">
            <div className="absolute left-1u right-1u bottom-1u h-1u bg-outline-variant/20 rounded-full">
              <div className="h-full w-1/3 bg-outline-variant/60 rounded-full" />
            </div>
          </div>
        ),
        rationale: "For horizontally scrolling content.",
        examples: "Carousels, Tabs overflow, Chip groups",
      },
      {
        emphasis: "Both",
        component: (
          <div className="w-20 h-16 bg-surface-container rounded-sm relative overflow-hidden">
            <div className="absolute right-1u top-1u bottom-3u w-1u bg-outline-variant/20 rounded-full">
              <div className="w-full h-1/3 bg-outline-variant/60 rounded-full" />
            </div>
            <div className="absolute left-1u right-3u bottom-1u h-1u bg-outline-variant/20 rounded-full">
              <div className="h-full w-1/3 bg-outline-variant/60 rounded-full" />
            </div>
          </div>
        ),
        rationale: "For 2D scrollable content.",
        examples: "Code blocks, Large tables, Canvases",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Scroll areas contain content that exceeds the visible container.",
    examples: [
      {
        title: "Vertical scroll",
        visual: <ScrollAreaVerticalExample />,
        caption: "Scroll down to see more items",
      },
      {
        title: "Horizontal scroll",
        visual: <ScrollAreaHorizontalExample />,
        caption: "Scroll horizontally through cards",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "children",
      type: "ReactNode",
      required: true,
      description: "Content to display in the scroll area.",
    },
    {
      name: "orientation",
      type: '"vertical" | "horizontal" | "both"',
      default: '"vertical"',
      description: "Scroll direction.",
    },
    {
      name: "scrollbarClassName",
      type: "string",
      description: "Additional classes for scrollbar styling.",
    },
    {
      name: "className",
      type: "string",
      description: "Additional CSS classes for container.",
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Scrollable region is keyboard accessible.",
      "Content within is navigable with screen readers.",
    ],
    keyboard: [
      { key: "Arrow Keys", description: "Scroll content when focused" },
      { key: "Page Up/Down", description: "Scroll by page" },
      { key: "Home/End", description: "Scroll to start/end" },
    ],
    focus: [
      "Focusable elements within are reachable via Tab.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Wrap content that may overflow.",
    code: `import { ScrollArea } from "@unisane/ui";

function ChatMessages({ messages }) {
  return (
    <ScrollArea className="h-[400px]">
      <div className="p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="p-3 bg-surface-container rounded-lg">
            <p className="font-medium">{message.sender}</p>
            <p>{message.text}</p>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "list",
      reason: "Often used within scroll areas.",
    },
    {
      slug: "table",
      reason: "Tables may need horizontal scrolling.",
    },
  ],
};
