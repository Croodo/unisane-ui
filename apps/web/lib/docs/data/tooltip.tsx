"use client";

import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";
import { Tooltip, IconButton, Button } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const TooltipHeroVisual = () => (
  <HeroBackground tone="tertiary">
    {/* Mock Toolbar Card */}
    <div className="relative bg-surface w-80 rounded-xl shadow-xl overflow-hidden border border-outline-variant/30">
      <div className="px-5 py-4 border-b border-outline-variant/20">
        <span className="text-title-medium text-on-surface">Toolbar</span>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-center gap-2">
          <Tooltip label="Undo (Ctrl+Z)">
            <IconButton variant="standard" ariaLabel="Undo" icon={<span className="material-symbols-outlined">undo</span>} />
          </Tooltip>
          <Tooltip label="Redo (Ctrl+Y)">
            <IconButton variant="standard" ariaLabel="Redo" icon={<span className="material-symbols-outlined">redo</span>} />
          </Tooltip>
          <Tooltip label="Copy">
            <IconButton variant="standard" ariaLabel="Copy" icon={<span className="material-symbols-outlined">content_copy</span>} />
          </Tooltip>
          <Tooltip label="Paste">
            <IconButton variant="standard" ariaLabel="Paste" icon={<span className="material-symbols-outlined">content_paste</span>} />
          </Tooltip>
          <Tooltip label="Delete" variant="rich" subhead="Warning">
            <IconButton variant="standard" ariaLabel="Delete" icon={<span className="material-symbols-outlined">delete</span>} />
          </Tooltip>
        </div>
      </div>
    </div>
  </HeroBackground>
);

export const tooltipDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "tooltip",
  name: "Tooltip",
  description:
    "Tooltips display informative text when users hover over, focus on, or tap an element.",
  category: "containment",
  status: "stable",
  icon: "help",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["Tooltip"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <TooltipHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Tooltips come in plain and rich variants for different information density.",
    columns: {
      emphasis: "Variant",
      component: "Example",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Plain",
        component: (
          <Tooltip label="Save changes">
            <Button variant="filled" size="sm">Hover me</Button>
          </Tooltip>
        ),
        rationale:
          "Simple, single-line hints for buttons and icons.",
        examples: "Icon buttons, Truncated text, Keyboard shortcuts",
      },
      {
        emphasis: "Rich",
        component: (
          <Tooltip variant="rich" label="This action cannot be undone. Make sure you have saved your work." subhead="Warning">
            <Button variant="tonal" size="sm">Hover me</Button>
          </Tooltip>
        ),
        rationale:
          "Detailed information with subheading for context.",
        examples: "Complex actions, Feature explanations, Warnings",
      },
    ],
  },

  // ─── HIERARCHY SECTION ─────────────────────────────────────────────────────
  hierarchy: {
    description:
      "Tooltips can appear on different sides of the trigger element.",
    items: [
      {
        component: (
          <Tooltip label="Top" side="top">
            <Button variant="outlined" size="sm">Top</Button>
          </Tooltip>
        ),
        title: "Top",
        subtitle: "Default position",
      },
      {
        component: (
          <Tooltip label="Bottom" side="bottom">
            <Button variant="outlined" size="sm">Bottom</Button>
          </Tooltip>
        ),
        title: "Bottom",
        subtitle: "Below trigger",
      },
      {
        component: (
          <Tooltip label="Left" side="left">
            <Button variant="outlined" size="sm">Left</Button>
          </Tooltip>
        ),
        title: "Left",
        subtitle: "Left side",
      },
      {
        component: (
          <Tooltip label="Right" side="right">
            <Button variant="outlined" size="sm">Right</Button>
          </Tooltip>
        ),
        title: "Right",
        subtitle: "Right side",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Tooltips are commonly used on icon buttons, truncated text, and interactive elements that need explanation.",
    examples: [
      {
        title: "Toolbar icons",
        visual: (
          <div className="flex items-center gap-1">
            <Tooltip label="Bold (Ctrl+B)">
              <IconButton variant="standard" ariaLabel="Bold" icon={<span className="material-symbols-outlined">format_bold</span>} />
            </Tooltip>
            <Tooltip label="Italic (Ctrl+I)">
              <IconButton variant="standard" ariaLabel="Italic" icon={<span className="material-symbols-outlined">format_italic</span>} />
            </Tooltip>
            <Tooltip label="Underline (Ctrl+U)">
              <IconButton variant="standard" ariaLabel="Underline" icon={<span className="material-symbols-outlined">format_underlined</span>} />
            </Tooltip>
          </div>
        ),
        caption: "Tooltips on formatting toolbar buttons",
      },
      {
        title: "Action buttons",
        visual: (
          <div className="flex items-center gap-2">
            <Tooltip label="Edit item">
              <IconButton variant="tonal" ariaLabel="Edit" icon={<span className="material-symbols-outlined">edit</span>} />
            </Tooltip>
            <Tooltip label="Share item">
              <IconButton variant="tonal" ariaLabel="Share" icon={<span className="material-symbols-outlined">share</span>} />
            </Tooltip>
            <Tooltip variant="rich" label="This will permanently remove the item" subhead="Delete">
              <IconButton variant="tonal" ariaLabel="Delete" icon={<span className="material-symbols-outlined">delete</span>} />
            </Tooltip>
          </div>
        ),
        caption: "Tooltips explaining button actions",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "label",
      type: "string",
      required: true,
      description: "The tooltip text content.",
    },
    {
      name: "children",
      type: "ReactNode",
      required: true,
      description: "The trigger element that shows the tooltip.",
    },
    {
      name: "variant",
      type: '"plain" | "rich"',
      default: '"plain"',
      description: "Visual style of the tooltip.",
    },
    {
      name: "subhead",
      type: "string",
      description: "Subheading for rich tooltips.",
    },
    {
      name: "side",
      type: '"top" | "bottom" | "left" | "right"',
      default: '"top"',
      description: "Position relative to the trigger.",
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
      "Tooltips use aria-describedby to associate content with trigger.",
      "role='tooltip' is applied for proper semantics.",
      "Content is announced when trigger is focused.",
    ],
    keyboard: [
      { key: "Focus", description: "Shows tooltip on keyboard focus" },
      { key: "Tab", description: "Moves focus, hiding tooltip on blur" },
    ],
    focus: [
      "Tooltips appear on both hover and keyboard focus.",
      "Tooltips do not block keyboard navigation.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Wrap any element with Tooltip to add hover hints.",
    code: `import { Tooltip, IconButton, Button } from "@unisane/ui";

function Toolbar() {
  return (
    <div className="flex gap-2">
      {/* Plain tooltips for icons */}
      <Tooltip label="Save (Ctrl+S)">
        <IconButton
          icon={<span className="material-symbols-outlined">save</span>}
          onClick={() => handleSave()}
        />
      </Tooltip>

      <Tooltip label="Undo (Ctrl+Z)">
        <IconButton
          icon={<span className="material-symbols-outlined">undo</span>}
          onClick={() => handleUndo()}
        />
      </Tooltip>

      {/* Rich tooltip for destructive action */}
      <Tooltip
        variant="rich"
        label="This will permanently delete all selected items and cannot be undone."
        subhead="Delete Items"
        side="bottom"
      >
        <Button variant="tonal" color="error">
          Delete Selected
        </Button>
      </Tooltip>
    </div>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "popover",
      reason: "Use for interactive content, not just informational.",
    },
    {
      slug: "icon-button",
      reason: "Commonly paired with tooltips for accessibility.",
    },
    {
      slug: "dropdown-menu",
      reason: "Use for actionable menus rather than informational tips.",
    },
  ],
};
