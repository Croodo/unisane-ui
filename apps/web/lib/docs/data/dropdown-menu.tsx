"use client";

import { ComponentDoc } from "../types";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, Button, IconButton } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const DropdownMenuHeroVisual = () => (
  <div className="relative w-full h-full bg-linear-to-br from-tertiary-container to-primary-container flex items-center justify-center p-8 overflow-hidden isolate">
    {/* Decorative Circles */}
    <div className="absolute top-[-40px] right-[-40px] w-56 h-56 bg-tertiary/20 rounded-full blur-3xl" />
    <div className="absolute bottom-[-50px] left-[-30px] w-64 h-64 bg-primary/20 rounded-full blur-3xl" />

    {/* Mock Dropdown Demo */}
    <div className="relative z-10">
      <div className="relative">
        <IconButton variant="filled" ariaLabel="Menu" icon={<span className="material-symbols-outlined">more_vert</span>} />
        {/* Simulated menu */}
        <div className="absolute top-[calc(100%+4px)] right-0 bg-surface rounded-xl shadow-4 py-2u border border-outline-variant/30 min-w-[160px]">
          <div className="px-4u py-2u text-body-medium text-on-surface hover:bg-on-surface/8 cursor-pointer flex items-center gap-3u">
            <span className="material-symbols-outlined text-[20px]">edit</span>
            Edit
          </div>
          <div className="px-4u py-2u text-body-medium text-on-surface hover:bg-on-surface/8 cursor-pointer flex items-center gap-3u">
            <span className="material-symbols-outlined text-[20px]">content_copy</span>
            Duplicate
          </div>
          <div className="h-px bg-outline-variant/20 my-1u" />
          <div className="px-4u py-2u text-body-medium text-error hover:bg-error/8 cursor-pointer flex items-center gap-3u">
            <span className="material-symbols-outlined text-[20px]">delete</span>
            Delete
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const dropdownMenuDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "dropdown-menu",
  name: "Dropdown Menu",
  description:
    "Dropdown menus display a list of choices on a temporary surface.",
  category: "containment",
  status: "stable",
  icon: "menu",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["DropdownMenu", "DropdownMenuTrigger", "DropdownMenuContent", "DropdownMenuItem", "DropdownMenuSeparator", "DropdownMenuCheckboxItem", "DropdownMenuRadioItem"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <DropdownMenuHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Dropdown menus can contain various item types for different interactions.",
    columns: {
      emphasis: "Item Type",
      component: "Example",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Action Item",
        component: (
          <div className="w-36 bg-surface rounded-sm shadow-2 py-1u border border-outline-variant/30">
            <div className="px-3u py-2u text-body-small text-on-surface hover:bg-on-surface/8">Edit</div>
          </div>
        ),
        rationale:
          "Standard menu items that perform actions.",
        examples: "Edit, Delete, Share, Copy",
      },
      {
        emphasis: "Checkbox Item",
        component: (
          <div className="w-36 bg-surface rounded-sm shadow-2 py-1u border border-outline-variant/30">
            <div className="px-3u py-2u text-body-small text-on-surface flex items-center gap-2u">
              <span className="material-symbols-outlined text-[16px] text-primary">check_box</span>
              Show Grid
            </div>
          </div>
        ),
        rationale:
          "Toggle options on/off.",
        examples: "Settings toggles, View options",
      },
      {
        emphasis: "Separator",
        component: (
          <div className="w-36 bg-surface rounded-sm shadow-2 py-1u border border-outline-variant/30">
            <div className="px-3u py-1u text-body-small text-on-surface">Action 1</div>
            <div className="h-px bg-outline-variant/20 my-1u" />
            <div className="px-3u py-1u text-body-small text-error">Delete</div>
          </div>
        ),
        rationale:
          "Group related items visually.",
        examples: "Before destructive actions, Section breaks",
      },
    ],
  },

  // ─── HIERARCHY SECTION ─────────────────────────────────────────────────────
  hierarchy: {
    description:
      "Menus can be aligned to different edges of the trigger.",
    items: [
      {
        component: (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outlined" size="sm">Start</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>Option 1</DropdownMenuItem>
              <DropdownMenuItem>Option 2</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        title: "Start Aligned",
        subtitle: "Opens to the left",
      },
      {
        component: (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outlined" size="sm">End</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Option 1</DropdownMenuItem>
              <DropdownMenuItem>Option 2</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        title: "End Aligned",
        subtitle: "Opens to the right",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Dropdown menus are commonly used for contextual actions and settings.",
    examples: [
      {
        title: "Actions menu",
        visual: (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton variant="tonal" ariaLabel="More options" icon={<span className="material-symbols-outlined">more_vert</span>} />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        caption: "Menu with action items and separator",
      },
      {
        title: "Button with menu",
        visual: (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="filled" trailingIcon={<span className="material-symbols-outlined text-[18px]">expand_more</span>}>
                Options
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>New File</DropdownMenuItem>
              <DropdownMenuItem>New Folder</DropdownMenuItem>
              <DropdownMenuItem>Import</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        caption: "Button that opens a dropdown menu",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "children",
      type: "ReactNode",
      required: true,
      description: "DropdownMenuTrigger and DropdownMenuContent components.",
    },
  ],

  // ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────
  subComponents: [
    {
      name: "DropdownMenuTrigger",
      description: "The element that opens the menu.",
      props: [
        { name: "children", type: "ReactNode", required: true, description: "Trigger element (button, icon button, etc.)." },
        { name: "asChild", type: "boolean", description: "Use child as trigger element." },
      ],
    },
    {
      name: "DropdownMenuContent",
      description: "Container for menu items.",
      props: [
        { name: "children", type: "ReactNode", required: true, description: "Menu items." },
        { name: "align", type: '"start" | "end"', default: '"start"', description: "Alignment relative to trigger." },
      ],
    },
    {
      name: "DropdownMenuItem",
      description: "A clickable menu item.",
      props: [
        { name: "children", type: "ReactNode", required: true, description: "Item content." },
        { name: "onClick", type: "() => void", description: "Click handler." },
        { name: "disabled", type: "boolean", description: "Disable the item." },
      ],
    },
    {
      name: "DropdownMenuSeparator",
      description: "Visual divider between menu items.",
      props: [],
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Trigger has aria-expanded and aria-haspopup='menu'.",
      "Menu content has role='menu' with proper structure.",
      "Items have role='menuitem' for proper navigation.",
    ],
    keyboard: [
      { key: "Enter / Space", description: "Opens menu or activates item" },
      { key: "Arrow Down", description: "Opens menu or moves to next item" },
      { key: "Arrow Up", description: "Moves to previous item" },
      { key: "Escape", description: "Closes the menu" },
    ],
    focus: [
      "Focus moves to first item when menu opens.",
      "Focus returns to trigger when menu closes.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Compose dropdown menus with trigger and content components.",
    code: `import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  IconButton,
} from "@unisane/ui";

function ItemActions({ onEdit, onDuplicate, onDelete }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <IconButton
          icon={<span className="material-symbols-outlined">more_vert</span>}
          ariaLabel="Item options"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDuplicate}>
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "popover",
      reason: "Use for rich content, not just menu items.",
    },
    {
      slug: "select",
      reason: "Use for form value selection.",
    },
    {
      slug: "icon-button",
      reason: "Common trigger for dropdown menus.",
    },
  ],
};
