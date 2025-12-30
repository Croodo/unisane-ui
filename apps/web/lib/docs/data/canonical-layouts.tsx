"use client";

import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const CanonicalLayoutsHeroVisual = () => (
  <HeroBackground tone="surface">
    {/* Mock App with List-Detail Layout */}
    <div className="relative bg-surface w-80 h-56 rounded-xl shadow-xl overflow-hidden border border-outline-variant/30 flex">
      {/* List Pane */}
      <div className="w-28 bg-surface border-r border-outline-variant/30 p-3 space-y-2">
        <div className="h-3 bg-primary/20 rounded-sm w-full" />
        <div className="h-8 bg-secondary-container rounded-lg flex items-center gap-2 px-2">
          <div className="w-4 h-4 rounded-full bg-primary/30" />
          <div className="h-2 bg-primary/40 rounded-sm flex-1" />
        </div>
        <div className="h-8 bg-surface-container-high rounded-lg flex items-center gap-2 px-2">
          <div className="w-4 h-4 rounded-full bg-on-surface-variant/20" />
          <div className="h-2 bg-on-surface-variant/20 rounded-sm flex-1" />
        </div>
        <div className="h-8 bg-surface-container-high rounded-lg flex items-center gap-2 px-2">
          <div className="w-4 h-4 rounded-full bg-on-surface-variant/20" />
          <div className="h-2 bg-on-surface-variant/20 rounded-sm flex-1" />
        </div>
      </div>
      {/* Detail Pane */}
      <div className="flex-1 bg-surface-container-low p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/20" />
          <div className="flex-1 space-y-1">
            <div className="h-3 bg-on-surface/20 rounded-sm w-3/4" />
            <div className="h-2 bg-on-surface-variant/20 rounded-sm w-1/2" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-surface-container-high rounded-sm w-full" />
          <div className="h-2 bg-surface-container-high rounded-sm w-full" />
          <div className="h-2 bg-surface-container-high rounded-sm w-3/4" />
        </div>
      </div>
    </div>
  </HeroBackground>
);

// ─── EXAMPLES ────────────────────────────────────────────────────────────────
const ListDetailExample = () => (
  <div className="w-full max-w-md h-64 bg-surface rounded-lg overflow-hidden border border-outline-variant/30 flex">
    {/* List Side */}
    <div className="w-40 border-r border-outline-variant/30 p-3 space-y-2 shrink-0">
      <div className="text-label-small text-on-surface-variant mb-2">Messages</div>
      <div className="p-2 rounded-lg bg-secondary-container">
        <div className="text-label-medium text-primary">Alice</div>
        <div className="text-body-small text-on-surface-variant truncate">Hey, how are you?</div>
      </div>
      <div className="p-2 rounded-lg hover:bg-surface-container-high">
        <div className="text-label-medium text-on-surface">Bob</div>
        <div className="text-body-small text-on-surface-variant truncate">Meeting at 3pm</div>
      </div>
    </div>
    {/* Detail Side */}
    <div className="flex-1 p-4 bg-surface-container-low">
      <div className="flex items-center gap-3 pb-3 border-b border-outline-variant/30 mb-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-label-medium">A</div>
        <div>
          <div className="text-title-small text-on-surface">Alice</div>
          <div className="text-body-small text-on-surface-variant">Online</div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="bg-surface-container rounded-lg p-2 max-w-[80%] text-body-small text-on-surface">
          Hey, how are you?
        </div>
      </div>
    </div>
  </div>
);

const SupportingPaneExample = () => (
  <div className="w-full max-w-md h-64 bg-surface rounded-lg overflow-hidden border border-outline-variant/30 flex">
    {/* Main Content */}
    <div className="flex-1 p-4">
      <div className="text-title-medium text-on-surface mb-3">Document Editor</div>
      <div className="space-y-2">
        <div className="h-3 bg-surface-container-high rounded-sm w-full" />
        <div className="h-3 bg-surface-container-high rounded-sm w-full" />
        <div className="h-3 bg-surface-container-high rounded-sm w-3/4" />
        <div className="h-3 bg-surface-container-high rounded-sm w-full" />
        <div className="h-3 bg-surface-container-high rounded-sm w-1/2" />
      </div>
    </div>
    {/* Supporting Pane */}
    <div className="w-36 border-l border-outline-variant/30 bg-surface-container-low p-3 shrink-0">
      <div className="text-label-small text-primary mb-3">Properties</div>
      <div className="space-y-3">
        <div>
          <div className="text-body-small text-on-surface-variant">Author</div>
          <div className="text-body-small text-on-surface">John Doe</div>
        </div>
        <div>
          <div className="text-body-small text-on-surface-variant">Modified</div>
          <div className="text-body-small text-on-surface">Today</div>
        </div>
        <div>
          <div className="text-body-small text-on-surface-variant">Size</div>
          <div className="text-body-small text-on-surface">2.4 KB</div>
        </div>
      </div>
    </div>
  </div>
);

const FeedLayoutExample = () => (
  <div className="w-full max-w-md h-64 bg-surface-container-low rounded-lg overflow-hidden border border-outline-variant/30 p-4">
    <div className="grid grid-cols-2 gap-3 h-full">
      <div className="bg-surface rounded-lg p-3 border border-outline-variant/20">
        <div className="h-16 bg-surface-container-high rounded-sm mb-2" />
        <div className="h-2 bg-on-surface/20 rounded-sm w-3/4 mb-1" />
        <div className="h-2 bg-on-surface-variant/20 rounded-sm w-1/2" />
      </div>
      <div className="bg-surface rounded-lg p-3 border border-outline-variant/20">
        <div className="h-16 bg-surface-container-high rounded-sm mb-2" />
        <div className="h-2 bg-on-surface/20 rounded-sm w-3/4 mb-1" />
        <div className="h-2 bg-on-surface-variant/20 rounded-sm w-1/2" />
      </div>
      <div className="bg-surface rounded-lg p-3 border border-outline-variant/20">
        <div className="h-16 bg-surface-container-high rounded-sm mb-2" />
        <div className="h-2 bg-on-surface/20 rounded-sm w-3/4 mb-1" />
        <div className="h-2 bg-on-surface-variant/20 rounded-sm w-1/2" />
      </div>
      <div className="bg-surface rounded-lg p-3 border border-outline-variant/20">
        <div className="h-16 bg-surface-container-high rounded-sm mb-2" />
        <div className="h-2 bg-on-surface/20 rounded-sm w-3/4 mb-1" />
        <div className="h-2 bg-on-surface-variant/20 rounded-sm w-1/2" />
      </div>
    </div>
  </div>
);

export const canonicalLayoutsDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "canonical-layouts",
  name: "Canonical Layouts",
  description:
    "Canonical layouts provide responsive, adaptive patterns for common app structures. These layouts automatically adjust to different screen sizes following Material Design 3 guidelines.",
  category: "layout",
  status: "stable",
  icon: "dashboard",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["ListDetailLayout", "SupportingPaneLayout", "FeedLayout"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <CanonicalLayoutsHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Choose the layout pattern based on your content structure and user interaction patterns.",
    columns: {
      emphasis: "Layout",
      component: "Preview",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "List-Detail",
        component: (
          <div className="w-32 h-16 bg-surface-container rounded-sm flex overflow-hidden">
            <div className="w-10 border-r border-outline-variant/30 p-1 space-y-1">
              <div className="h-2 rounded-sm bg-secondary-container" />
              <div className="h-2 rounded-sm bg-surface-container-high" />
              <div className="h-2 rounded-sm bg-surface-container-high" />
            </div>
            <div className="flex-1 p-1">
              <div className="h-2 bg-surface-container-high rounded-sm mb-1" />
              <div className="h-2 bg-surface-container-high rounded-sm w-3/4" />
            </div>
          </div>
        ),
        rationale: "List on one side, detail view on the other.",
        examples: "Email, Chat, File browser",
      },
      {
        emphasis: "Supporting Pane",
        component: (
          <div className="w-32 h-16 bg-surface-container rounded-sm flex overflow-hidden">
            <div className="flex-1 p-1 space-y-1">
              <div className="h-2 bg-surface-container-high rounded-sm" />
              <div className="h-2 bg-surface-container-high rounded-sm" />
              <div className="h-2 bg-surface-container-high rounded-sm w-3/4" />
            </div>
            <div className="w-8 border-l border-outline-variant/30 bg-surface-container-low p-1 space-y-1">
              <div className="h-2 rounded-sm bg-primary/30" />
              <div className="h-1 rounded-sm bg-surface-container-high" />
              <div className="h-1 rounded-sm bg-surface-container-high" />
            </div>
          </div>
        ),
        rationale: "Main content with collapsible side panel.",
        examples: "Document properties, Settings panel",
      },
      {
        emphasis: "Feed",
        component: (
          <div className="w-32 h-16 bg-surface-container-low rounded-sm p-1">
            <div className="grid grid-cols-2 gap-1 h-full">
              <div className="bg-surface rounded-sm" />
              <div className="bg-surface rounded-sm" />
              <div className="bg-surface rounded-sm" />
              <div className="bg-surface rounded-sm" />
            </div>
          </div>
        ),
        rationale: "Grid of cards that reflows responsively.",
        examples: "Gallery, News feed, Dashboard",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Canonical layouts adapt to screen size. On compact screens, they typically stack or show one pane at a time.",
    examples: [
      {
        title: "List-Detail Layout",
        visual: <ListDetailExample />,
        caption: "Two-pane layout with list and detail views",
      },
      {
        title: "Supporting Pane Layout",
        visual: <SupportingPaneExample />,
        caption: "Main content with collapsible supporting panel",
      },
      {
        title: "Feed Layout",
        visual: <FeedLayoutExample />,
        caption: "Responsive grid that adapts to available width",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "className",
      type: "string",
      description: "Additional CSS classes for the layout container.",
    },
    {
      name: "isRoot",
      type: "boolean",
      default: "false",
      description: "When true, removes default border and rounded corners for root-level usage.",
    },
  ],

  // ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────
  subComponents: [
    {
      name: "ListDetailLayout",
      description: "Two-pane layout with a list on one side and detail view on the other.",
      props: [
        { name: "list", type: "ReactNode", required: true, description: "Content for the list pane." },
        { name: "detail", type: "ReactNode", required: true, description: "Content for the detail pane." },
        { name: "showDetailMobile", type: "boolean", default: "false", description: "Show detail pane on mobile (hides list)." },
        { name: "onBackClick", type: "() => void", description: "Callback for back button on mobile detail view." },
      ],
    },
    {
      name: "SupportingPaneLayout",
      description: "Main content area with a collapsible supporting side panel.",
      props: [
        { name: "main", type: "ReactNode", required: true, description: "Main content area." },
        { name: "supporting", type: "ReactNode", required: true, description: "Content for the supporting pane." },
        { name: "open", type: "boolean", description: "Controls supporting pane visibility." },
        { name: "onClose", type: "() => void", description: "Callback when pane should close." },
        { name: "title", type: "string", default: '"Audit Protocol"', description: "Title shown in the supporting pane header." },
        { name: "mainRef", type: "RefObject<HTMLDivElement>", description: "Ref for the main content container." },
      ],
    },
    {
      name: "FeedLayout",
      description: "Responsive grid layout for card-based content.",
      props: [
        { name: "children", type: "ReactNode", required: true, description: "Grid items to display." },
      ],
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "List pane uses role=\"list\" for proper semantics.",
      "Main content area uses role=\"main\".",
      "Supporting pane uses <aside> element.",
      "Back button includes aria-label on mobile.",
    ],
    keyboard: [
      { key: "Tab", description: "Navigate between panes and interactive elements" },
      { key: "Escape", description: "Close supporting pane on mobile" },
    ],
    focus: [
      "Focus is managed when switching between list and detail on mobile.",
      "Supporting pane traps focus when open on mobile.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Use layouts with state management for responsive behavior.",
    code: `import { ListDetailLayout, SupportingPaneLayout, FeedLayout } from "@unisane/ui";
import { useState } from "react";

// List-Detail Example (Email-like)
function EmailApp() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const showDetail = selectedId !== null;

  return (
    <ListDetailLayout
      list={
        <EmailList
          onSelect={setSelectedId}
          selectedId={selectedId}
        />
      }
      detail={
        selectedId ? (
          <EmailDetail id={selectedId} />
        ) : (
          <EmptyState message="Select an email" />
        )
      }
      showDetailMobile={showDetail}
      onBackClick={() => setSelectedId(null)}
      isRoot
    />
  );
}

// Supporting Pane Example (Document properties)
function DocumentEditor() {
  const [showProperties, setShowProperties] = useState(false);

  return (
    <SupportingPaneLayout
      main={<Editor />}
      supporting={<DocumentProperties />}
      open={showProperties}
      onClose={() => setShowProperties(false)}
      title="Properties"
      isRoot
    />
  );
}

// Feed Example (Gallery)
function Gallery() {
  return (
    <FeedLayout isRoot>
      {images.map((image) => (
        <ImageCard key={image.id} image={image} />
      ))}
    </FeedLayout>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "pane-group",
      reason: "Simpler two-pane layout without built-in mobile behavior.",
    },
    {
      slug: "sidebar",
      reason: "Use for app-level navigation alongside layouts.",
    },
    {
      slug: "card",
      reason: "Common content container within Feed layouts.",
    },
  ],
};
