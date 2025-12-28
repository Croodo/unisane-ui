"use client";

import { useState } from "react";
import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";
import { Sheet, Button } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const SheetHeroVisual = () => (
  <HeroBackground tone="tertiary">
    {/* Mock App with Sheet */}
    <div className="bg-surface w-[320px] h-[200px] rounded-3xl shadow-xl overflow-hidden border border-outline-variant/30 flex">
      {/* Main Content */}
      <div className="flex-1 p-4">
        <div className="text-title-small text-on-surface mb-3">Dashboard</div>
        <div className="space-y-2">
          <div className="h-4 bg-surface-container-high rounded-sm w-full" />
          <div className="h-4 bg-surface-container-high rounded-sm w-3/4" />
          <div className="h-4 bg-surface-container-high rounded-sm w-1/2" />
        </div>
      </div>
      {/* Sheet Panel */}
      <div className="w-[140px] bg-surface border-l border-outline-variant/20 shadow-3">
        <div className="p-3 border-b border-outline-variant/20 flex items-center justify-between">
          <span className="text-title-small text-on-surface">Details</span>
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">close</span>
        </div>
        <div className="p-3 space-y-3">
          <div className="h-3 bg-surface-container-high rounded-sm w-full" />
          <div className="h-3 bg-surface-container-high rounded-sm w-3/4" />
          <div className="h-8 bg-primary/20 rounded-sm w-full" />
        </div>
      </div>
    </div>
  </HeroBackground>
);

// ─── INTERACTIVE PLACEMENT EXAMPLES ────────────────────────────────────────────
const SheetBasicExample = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="tonal" onClick={() => setOpen(true)}>
        Open Sheet
      </Button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Details"
        size="sm"
      >
        <div className="p-6 space-y-4">
          <div className="text-body-medium text-on-surface">
            This is a basic sheet with a header and content area.
          </div>
          <div className="h-3 bg-surface-container-high rounded-sm w-full" />
          <div className="h-3 bg-surface-container-high rounded-sm w-3/4" />
        </div>
      </Sheet>
    </>
  );
};

const SheetWithFooterExample = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="filled" onClick={() => setOpen(true)}>
        Edit Item
      </Button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Edit Item"
        size="md"
        footerRight={
          <div className="flex gap-2">
            <Button variant="text" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="filled" onClick={() => setOpen(false)}>Save</Button>
          </div>
        }
      >
        <div className="p-6 space-y-4">
          <div className="text-body-medium text-on-surface">
            Edit the item details below. Changes will be saved when you click Save.
          </div>
          <div className="space-y-3">
            <div className="h-10 bg-surface-container-high rounded-lg w-full" />
            <div className="h-10 bg-surface-container-high rounded-lg w-full" />
            <div className="h-20 bg-surface-container-high rounded-lg w-full" />
          </div>
        </div>
      </Sheet>
    </>
  );
};

export const sheetDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "sheet",
  name: "Sheet",
  description:
    "Sheets are surfaces containing supplementary content anchored to the edge of the screen.",
  category: "containment",
  status: "stable",
  icon: "view_sidebar",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["Sheet"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <SheetHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Sheets come in different sizes for various content needs.",
    columns: {
      emphasis: "Size",
      component: "Example",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Small (sm)",
        component: (
          <div className="w-32 h-20 bg-surface-container rounded-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-surface shadow-2 p-1">
              <div className="h-1 bg-surface-container-high rounded-full w-full mb-1" />
              <div className="h-1 bg-surface-container-high rounded-full w-3/4" />
            </div>
          </div>
        ),
        rationale:
          "Minimal content like quick actions or simple forms.",
        examples: "Filters, Quick edit, Settings toggle",
      },
      {
        emphasis: "Medium (md)",
        component: (
          <div className="w-32 h-20 bg-surface-container rounded-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-surface shadow-2 p-1">
              <div className="h-1 bg-surface-container-high rounded-full w-full mb-1" />
              <div className="h-1 bg-surface-container-high rounded-full w-3/4" />
            </div>
          </div>
        ),
        rationale:
          "Default size for most detail views and forms.",
        examples: "Item details, Edit forms, Preview panels",
      },
      {
        emphasis: "Large (lg)",
        component: (
          <div className="w-32 h-20 bg-surface-container rounded-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-surface shadow-2 p-1">
              <div className="h-1 bg-surface-container-high rounded-full w-full mb-1" />
              <div className="h-1 bg-surface-container-high rounded-full w-3/4" />
            </div>
          </div>
        ),
        rationale:
          "Complex forms or rich content requiring more space.",
        examples: "Complex forms, Rich editors, Data tables",
      },
    ],
  },

  // ─── HIERARCHY SECTION ─────────────────────────────────────────────────────
  hierarchy: {
    description:
      "Sheets slide in from the edge and can include headers, content, and footers.",
    items: [
      {
        component: (
          <div className="w-24 h-16 bg-surface-container rounded-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-10 bg-surface shadow-2 p-1">
              <div className="h-1 bg-on-surface/10 rounded-full w-full mb-1" />
            </div>
          </div>
        ),
        title: "Basic",
        subtitle: "Header and content",
      },
      {
        component: (
          <div className="w-24 h-16 bg-surface-container rounded-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-10 bg-surface shadow-2 p-1 flex flex-col">
              <div className="h-2 border-b border-outline-variant/20" />
              <div className="flex-1" />
              <div className="h-2 border-t border-outline-variant/20" />
            </div>
          </div>
        ),
        title: "With Footer",
        subtitle: "Actions at bottom",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Sheets slide in from the right edge of the screen, overlaying the main content.",
    examples: [
      {
        title: "Basic sheet",
        visual: <SheetBasicExample />,
        caption: "Click to open a basic sheet",
      },
      {
        title: "Sheet with footer",
        visual: <SheetWithFooterExample />,
        caption: "Sheet with header, content, and action footer",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "open",
      type: "boolean",
      required: true,
      description: "Controls whether the sheet is visible.",
    },
    {
      name: "onClose",
      type: "() => void",
      required: true,
      description: "Callback fired when the sheet should close.",
    },
    {
      name: "title",
      type: "string",
      required: true,
      description: "Title displayed in the sheet header.",
    },
    {
      name: "children",
      type: "ReactNode",
      required: true,
      description: "Content to display in the sheet body.",
    },
    {
      name: "size",
      type: '"sm" | "md" | "lg" | "xl" | "full"',
      default: '"md"',
      description: "Width of the sheet panel.",
    },
    {
      name: "icon",
      type: "ReactNode",
      description: "Icon displayed in the header.",
    },
    {
      name: "footerLeft",
      type: "ReactNode",
      description: "Content for the left side of the footer.",
    },
    {
      name: "footerRight",
      type: "ReactNode",
      description: "Content for the right side of the footer (typically actions).",
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Uses role='dialog' with aria-modal for modal behavior.",
      "Sheet title is announced when opened.",
      "Focus is trapped within the sheet while open.",
    ],
    keyboard: [
      { key: "Escape", description: "Closes the sheet" },
      { key: "Tab", description: "Moves focus within the sheet" },
    ],
    focus: [
      "Focus is moved to the sheet when opened.",
      "Focus returns to trigger element when closed.",
      "Close button has clear focus indication.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Use controlled state to manage sheet visibility.",
    code: `import { Sheet, Button } from "@unisane/ui";
import { useState } from "react";

function ItemDetails() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        View Details
      </Button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Item Details"
        size="md"
        icon={<span className="material-symbols-outlined">info</span>}
        footerRight={
          <>
            <Button variant="text" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>
              Save
            </Button>
          </>
        }
      >
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4">Item Information</h3>
          <p className="text-gray-600">
            This is the content of your sheet. You can put any
            content here including forms, details, or other UI.
          </p>
        </div>
      </Sheet>
    </>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "dialog",
      reason: "Use for focused modal content requiring attention.",
    },
    {
      slug: "navigation-drawer",
      reason: "Use for navigation links instead of content.",
    },
    {
      slug: "card",
      reason: "Use for inline content containers.",
    },
  ],
};
