"use client";

import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, Button, IconButton } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const DropdownMenuHeroVisual = () => (
  <HeroBackground tone="tertiary" align="start" justify="end">
    {/* Profile Menu Demo */}
    <div className="relative">
      <div className="relative">
        {/* Avatar trigger */}
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary text-title-medium cursor-pointer ring-2 ring-primary/20">
          JD
        </div>
        {/* Simulated profile menu */}
        <div className="absolute top-[calc(100%+4px)] right-0 bg-surface rounded-lg shadow-4 py-2 border border-outline-variant/20 min-w-56">
          {/* Profile header */}
          <div className="px-4 py-3 flex items-center gap-3 border-b border-outline-variant/20 mb-1">
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container text-title-medium">
              JD
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-body-medium text-on-surface font-medium truncate">John Doe</div>
              <div className="text-body-small text-on-surface-variant truncate">john@example.com</div>
            </div>
          </div>
          {/* Menu items */}
          <div className="px-3 py-2 text-body-medium text-on-surface hover:bg-on-surface/8 cursor-pointer flex items-center gap-3 rounded-md mx-1">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">person</span>
            View profile
          </div>
          <div className="px-3 py-2 text-body-medium text-on-surface hover:bg-on-surface/8 cursor-pointer flex items-center gap-3 rounded-md mx-1">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">settings</span>
            Settings
          </div>
          <div className="px-3 py-2 text-body-medium text-on-surface hover:bg-on-surface/8 cursor-pointer flex items-center gap-3 rounded-md mx-1">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">help</span>
            Help & support
          </div>
          <div className="h-px bg-outline-variant/20 my-1" />
          <div className="px-3 py-2 text-body-medium text-on-surface hover:bg-on-surface/8 cursor-pointer flex items-center gap-3 rounded-md mx-1">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">logout</span>
            Sign out
          </div>
        </div>
      </div>
    </div>
  </HeroBackground>
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
  exports: ["DropdownMenu", "DropdownMenuTrigger", "DropdownMenuContent", "DropdownMenuItem", "DropdownMenuSeparator", "DropdownMenuCheckboxItem", "DropdownMenuRadioItem", "DropdownMenuSub", "DropdownMenuSubTrigger", "DropdownMenuSubContent"],

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
          <div className="w-36 bg-surface rounded-sm shadow-2 py-1 border border-outline-variant/30">
            <div className="px-3 py-2 text-body-small text-on-surface hover:bg-on-surface/8">Edit</div>
          </div>
        ),
        rationale:
          "Standard menu items that perform actions.",
        examples: "Edit, Delete, Share, Copy",
      },
      {
        emphasis: "Checkbox Item",
        component: (
          <div className="w-36 bg-surface rounded-sm shadow-2 py-1 border border-outline-variant/30">
            <div className="px-3 py-2 text-body-small text-on-surface flex items-center gap-2">
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
          <div className="w-36 bg-surface rounded-sm shadow-2 py-1 border border-outline-variant/30">
            <div className="px-3 py-1 text-body-small text-on-surface">Action 1</div>
            <div className="h-px bg-outline-variant/20 my-1" />
            <div className="px-3 py-1 text-body-small text-error">Delete</div>
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
      {
        title: "Custom styling with submenu",
        visual: (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="tonal">
                File
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-lg px-2">
              <DropdownMenuItem className="rounded-md" icon={<span className="material-symbols-outlined text-[20px]">content_copy</span>}>Make a copy</DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="rounded-md" icon={<span className="material-symbols-outlined text-[20px]">add</span>}>
                  Create
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="rounded-lg px-2">
                  <DropdownMenuItem className="rounded-md" icon={<span className="material-symbols-outlined text-[20px]">description</span>}>Document</DropdownMenuItem>
                  <DropdownMenuItem className="rounded-md" icon={<span className="material-symbols-outlined text-[20px]">image</span>}>Image</DropdownMenuItem>
                  <DropdownMenuItem className="rounded-md" icon={<span className="material-symbols-outlined text-[20px]">slideshow</span>}>Slides</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="rounded-md" selected icon={<span className="material-symbols-outlined text-[20px]">cloud_off</span>}>Offline mode</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="rounded-md" icon={<span className="material-symbols-outlined text-[20px]">share</span>}>Share</DropdownMenuItem>
              <DropdownMenuItem className="rounded-md" icon={<span className="material-symbols-outlined text-[20px]">download</span>}>Download</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        caption: "Hover on 'Create' to see the submenu with nested items",
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
        { name: "className", type: "string", description: "Custom classes for padding, radius, etc." },
      ],
    },
    {
      name: "DropdownMenuItem",
      description: "A clickable menu item.",
      props: [
        { name: "children", type: "ReactNode", required: true, description: "Item content." },
        { name: "onClick", type: "() => void", description: "Click handler." },
        { name: "disabled", type: "boolean", description: "Disable the item." },
        { name: "className", type: "string", description: "Custom classes for padding, styling." },
      ],
    },
    {
      name: "DropdownMenuSeparator",
      description: "Visual divider between menu items.",
      props: [],
    },
    {
      name: "DropdownMenuSub",
      description: "Container for a submenu.",
      props: [
        { name: "children", type: "ReactNode", required: true, description: "SubTrigger and SubContent components." },
      ],
    },
    {
      name: "DropdownMenuSubTrigger",
      description: "Menu item that opens a submenu on hover.",
      props: [
        { name: "children", type: "ReactNode", required: true, description: "Trigger label." },
        { name: "icon", type: "ReactNode", description: "Leading icon." },
        { name: "disabled", type: "boolean", description: "Disable the trigger." },
        { name: "className", type: "string", description: "Custom classes for styling." },
      ],
    },
    {
      name: "DropdownMenuSubContent",
      description: "Container for submenu items.",
      props: [
        { name: "children", type: "ReactNode", required: true, description: "Submenu items." },
        { name: "className", type: "string", description: "Custom classes for padding, radius, etc." },
      ],
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
    description: "Compose dropdown menus with trigger and content components. Use className for custom styling.",
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
      <DropdownMenuTrigger asChild>
        <IconButton
          icon={<span className="material-symbols-outlined">more_vert</span>}
          ariaLabel="Item options"
        />
      </DropdownMenuTrigger>
      {/* px-2 adds horizontal padding, rounded-lg for container */}
      <DropdownMenuContent align="end" className="rounded-lg px-2">
        <DropdownMenuItem className="rounded-md" onClick={onEdit}>
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-md" onClick={onDuplicate}>
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="rounded-md" onClick={onDelete}>
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
