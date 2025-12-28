"use client";

import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";
import { IconButton } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const IconButtonHeroVisual = () => (
  <HeroBackground tone="primary">
    {/* Mock App Bar */}
    <div className="bg-surface w-[320px] rounded-3xl shadow-xl overflow-hidden border border-outline-variant/30">
      {/* Top App Bar */}
      <div className="h-16 flex items-center justify-between px-4 bg-surface border-b border-outline-variant/20">
        <IconButton variant="standard" ariaLabel="Menu">
          <span className="material-symbols-outlined">menu</span>
        </IconButton>
        <span className="text-title-medium text-on-surface">Photo Gallery</span>
        <div className="flex gap-1">
          <IconButton variant="standard" ariaLabel="Search">
            <span className="material-symbols-outlined">search</span>
          </IconButton>
          <IconButton variant="standard" ariaLabel="More options">
            <span className="material-symbols-outlined">more_vert</span>
          </IconButton>
        </div>
      </div>
      {/* Content */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square bg-surface-container-high rounded-lg relative group">
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <IconButton variant="filled" size="sm" ariaLabel="Favorite">
                  <span className="material-symbols-outlined text-[16px]">favorite</span>
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </HeroBackground>
);

export const iconButtonDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "icon-button",
  name: "Icon Button",
  description:
    "Icon buttons display actions in a compact form, often used in toolbars and app bars.",
  category: "actions",
  status: "stable",
  icon: "touch_app",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["IconButton"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <IconButtonHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Icon buttons come in four variants. Choose based on the level of emphasis needed for the action.",
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
          <IconButton variant="filled" ariaLabel="Add" className="pointer-events-none">
            <span className="material-symbols-outlined">add</span>
          </IconButton>
        ),
        rationale:
          "High emphasis for primary actions. Use sparingly as the main action in a group.",
        examples: "Primary action, Featured toggle",
      },
      {
        emphasis: "Tonal",
        component: (
          <IconButton variant="tonal" ariaLabel="Bookmark" className="pointer-events-none">
            <span className="material-symbols-outlined">bookmark</span>
          </IconButton>
        ),
        rationale:
          "Medium emphasis with a softer appearance. Good for secondary actions that still need visibility.",
        examples: "Bookmark, Share, Download",
      },
      {
        emphasis: "Outlined",
        component: (
          <IconButton variant="outlined" ariaLabel="Edit" className="pointer-events-none">
            <span className="material-symbols-outlined">edit</span>
          </IconButton>
        ),
        rationale:
          "Medium-low emphasis with a clear boundary. Works well in dense UIs where definition helps.",
        examples: "Edit, Settings, Refresh",
      },
      {
        emphasis: "Standard",
        component: (
          <IconButton variant="standard" ariaLabel="Close" className="pointer-events-none">
            <span className="material-symbols-outlined">close</span>
          </IconButton>
        ),
        rationale:
          "Lowest emphasis for utility actions. The most common variant for toolbars and app bars.",
        examples: "Close, Menu, Navigation",
      },
    ],
  },

  // ─── HIERARCHY SECTION ─────────────────────────────────────────────────────
  hierarchy: {
    description:
      "Icon button sizes help establish visual hierarchy and adapt to different contexts.",
    items: [
      {
        component: (
          <IconButton variant="filled" size="lg" ariaLabel="Add">
            <span className="material-symbols-outlined">add</span>
          </IconButton>
        ),
        title: "Large",
        subtitle: "48px touch target",
      },
      {
        component: (
          <IconButton variant="filled" size="md" ariaLabel="Add">
            <span className="material-symbols-outlined">add</span>
          </IconButton>
        ),
        title: "Medium",
        subtitle: "40px touch target",
      },
      {
        component: (
          <IconButton variant="filled" size="sm" ariaLabel="Add">
            <span className="material-symbols-outlined">add</span>
          </IconButton>
        ),
        title: "Small",
        subtitle: "32px touch target",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Icon buttons are commonly placed in app bars, toolbars, and alongside content.",
    examples: [
      {
        title: "App bar actions",
        visual: (
          <div className="bg-surface rounded-xl border border-outline-variant/30 overflow-hidden max-w-[320px] mx-auto">
            <div className="h-14 flex items-center justify-between px-4">
              <IconButton variant="standard" ariaLabel="Back">
                <span className="material-symbols-outlined">arrow_back</span>
              </IconButton>
              <span className="text-title-medium text-on-surface">Settings</span>
              <IconButton variant="standard" ariaLabel="Help">
                <span className="material-symbols-outlined">help</span>
              </IconButton>
            </div>
          </div>
        ),
        caption: "Standard icon buttons in app bar for navigation and help",
      },
      {
        title: "Content actions",
        visual: (
          <div className="flex items-start gap-3 p-4 border border-outline-variant/20 rounded-xl w-full max-w-xs bg-surface">
            <div className="w-12 h-12 rounded-full bg-primary-container shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-title-small text-on-surface">John Doe</div>
              <div className="text-body-small text-on-surface-variant truncate">
                Just shared a new photo with you
              </div>
            </div>
            <IconButton variant="standard" ariaLabel="More options">
              <span className="material-symbols-outlined">more_vert</span>
            </IconButton>
          </div>
        ),
        caption: "Standard icon button for overflow menu in list items",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "children",
      type: "ReactNode",
      description: "The icon element to display inside the button.",
    },
    {
      name: "ariaLabel",
      type: "string",
      required: true,
      description: "Accessible label for the button (required for icon-only buttons).",
    },
    {
      name: "variant",
      type: '"filled" | "tonal" | "outlined" | "standard"',
      default: '"standard"',
      description: "The visual style of the icon button.",
    },
    {
      name: "size",
      type: '"sm" | "md" | "lg"',
      default: '"md"',
      description: "The size of the icon button.",
    },
    {
      name: "selected",
      type: "boolean",
      default: "false",
      description: "If true, shows the button in a selected state.",
    },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "If true, the button is disabled and cannot be clicked.",
    },
    {
      name: "loading",
      type: "boolean",
      default: "false",
      description: "If true, shows a loading spinner and disables the button.",
    },
    {
      name: "onClick",
      type: "() => void",
      description: "Callback fired when the button is clicked.",
    },
    {
      name: "className",
      type: "string",
      description: "Additional CSS classes to apply to the button.",
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "The ariaLabel prop is required and provides the accessible name for screen readers.",
      "Icons are treated as decorative; the ariaLabel describes the button's action.",
      "Disabled buttons receive both disabled attribute and aria-disabled=\"true\".",
      "Focus states are clearly visible with an outline ring.",
    ],
    keyboard: [
      { key: "Enter / Space", description: "Activates the button" },
      { key: "Tab", description: "Moves focus to the next focusable element" },
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Import the component and provide an ariaLabel for accessibility.",
    code: `import { IconButton } from "@unisane/ui";

function Toolbar() {
  return (
    <div className="flex items-center gap-2">
      <IconButton
        variant="standard"
        ariaLabel="Go back"
        onClick={() => navigate(-1)}
      >
        <span className="material-symbols-outlined">arrow_back</span>
      </IconButton>

      <IconButton
        variant="filled"
        ariaLabel="Add new item"
        onClick={() => setOpen(true)}
      >
        <span className="material-symbols-outlined">add</span>
      </IconButton>

      <IconButton
        variant="tonal"
        ariaLabel="Toggle favorite"
        selected={isFavorite}
        onClick={() => setFavorite(!isFavorite)}
      >
        <span className="material-symbols-outlined">
          {isFavorite ? "favorite" : "favorite_border"}
        </span>
      </IconButton>
    </div>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "button",
      reason: "Use when you need a text label with the action.",
    },
    {
      slug: "fab",
      reason: "Use for the primary floating action on a screen.",
    },
    {
      slug: "dropdown-menu",
      reason: "Combine with icon button for menu triggers.",
    },
  ],
};
