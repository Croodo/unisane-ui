"use client";

import { ComponentDoc } from "../types";
import { FabMenu } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const FabMenuHeroVisual = () => (
  <div className="relative w-full h-full bg-linear-to-br from-primary-container to-secondary-container flex items-center justify-center p-8 overflow-hidden isolate">
    {/* Decorative Circles */}
    <div className="absolute top-[-40px] left-[-40px] w-56 h-56 bg-primary/20 rounded-full blur-3xl" />
    <div className="absolute bottom-[-50px] right-[-30px] w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />

    {/* Mock FAB Menu */}
    <div className="relative bg-surface w-[280px] h-[240px] rounded-3xl shadow-xl overflow-hidden border border-outline-variant/30 z-10">
      {/* Content */}
      <div className="p-4u space-y-3u">
        <div className="h-4u bg-surface-container-high rounded-sm w-full" />
        <div className="h-4u bg-surface-container-high rounded-sm w-3/4" />
        <div className="h-4u bg-surface-container-high rounded-sm w-1/2" />
      </div>
      {/* FAB Menu */}
      <div className="absolute bottom-6u right-6u flex flex-col items-end gap-3u">
        {/* Mini FABs */}
        <div className="flex items-center gap-2u">
          <span className="bg-inverse-surface text-inverse-on-surface text-label-small px-2u py-1u rounded-sm">Edit</span>
          <div className="w-10u h-10u rounded-xl bg-secondary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-secondary-container text-[20px]">edit</span>
          </div>
        </div>
        <div className="flex items-center gap-2u">
          <span className="bg-inverse-surface text-inverse-on-surface text-label-small px-2u py-1u rounded-sm">Share</span>
          <div className="w-10u h-10u rounded-xl bg-secondary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-secondary-container text-[20px]">share</span>
          </div>
        </div>
        {/* Main FAB */}
        <div className="w-14u h-14u rounded-2xl bg-tertiary-container flex items-center justify-center shadow-2">
          <span className="material-symbols-outlined text-on-tertiary-container rotate-45">add</span>
        </div>
      </div>
    </div>
  </div>
);

// ─── INTERACTIVE EXAMPLES ────────────────────────────────────────────────────
const FabMenuBasicExample = () => (
  <div className="h-[200px] relative flex items-end justify-end p-4u">
    <FabMenu
      actions={[
        {
          label: "Edit",
          icon: <span className="material-symbols-outlined">edit</span>,
          onClick: () => console.log("Edit clicked"),
        },
        {
          label: "Share",
          icon: <span className="material-symbols-outlined">share</span>,
          onClick: () => console.log("Share clicked"),
        },
        {
          label: "Delete",
          icon: <span className="material-symbols-outlined">delete</span>,
          onClick: () => console.log("Delete clicked"),
        },
      ]}
    />
  </div>
);

export const fabMenuDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "fab-menu",
  name: "FAB Menu",
  description:
    "FAB menu expands from a floating action button to reveal additional actions.",
  category: "actions",
  status: "stable",
  icon: "add_circle",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["FabMenu"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <FabMenuHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Choose between FAB and FAB menu based on the number of actions.",
    columns: {
      emphasis: "Component",
      component: "Preview",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "FAB",
        component: (
          <div className="w-14u h-14u rounded-2xl bg-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary-container">add</span>
          </div>
        ),
        rationale: "Single primary action.",
        examples: "Create new, Compose, Add item",
      },
      {
        emphasis: "FAB Menu",
        component: (
          <div className="flex flex-col items-end gap-2u">
            <div className="w-10u h-10u rounded-xl bg-secondary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-on-secondary-container text-[18px]">edit</span>
            </div>
            <div className="w-14u h-14u rounded-2xl bg-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary-container">add</span>
            </div>
          </div>
        ),
        rationale: "Multiple related actions.",
        examples: "Create options, Quick actions, Context menu",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "FAB menus are typically positioned at the bottom right of the screen.",
    examples: [
      {
        title: "Expandable menu",
        visual: <FabMenuBasicExample />,
        caption: "Click the FAB to reveal actions",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "actions",
      type: "FabAction[]",
      required: true,
      description: "Array of actions with label, icon, and onClick.",
    },
    {
      name: "mainIcon",
      type: "ReactNode",
      default: '<Icon symbol="add" />',
      description: "Icon for the main FAB button.",
    },
    {
      name: "activeIcon",
      type: "ReactNode",
      default: '<Icon symbol="close" />',
      description: "Icon shown when menu is open.",
    },
    {
      name: "aria-label",
      type: "string",
      default: '"Actions menu"',
      description: "Accessible label for the menu.",
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
      "Main FAB has aria-haspopup and aria-expanded.",
      "Menu uses role='menu' with menuitem roles.",
      "Action labels are announced.",
    ],
    keyboard: [
      { key: "Enter/Space", description: "Toggle menu open/close" },
      { key: "Escape", description: "Close menu" },
      { key: "Tab", description: "Navigate between actions" },
    ],
    focus: [
      "Focus visible on FAB and action buttons.",
      "Focus managed when menu opens/closes.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Define actions array with icons and handlers.",
    code: `import { FabMenu } from "@unisane/ui";

function ContentActions() {
  return (
    <FabMenu
      actions={[
        {
          label: "New document",
          icon: <span className="material-symbols-outlined">description</span>,
          onClick: () => createDocument(),
        },
        {
          label: "Upload file",
          icon: <span className="material-symbols-outlined">upload</span>,
          onClick: () => openUpload(),
        },
        {
          label: "New folder",
          icon: <span className="material-symbols-outlined">create_new_folder</span>,
          onClick: () => createFolder(),
        },
      ]}
      aria-label="Create new item"
    />
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "fab",
      reason: "Use for single action.",
    },
    {
      slug: "dropdown-menu",
      reason: "Use for button-triggered menus.",
    },
    {
      slug: "bottom-app-bar",
      reason: "Often contains FAB buttons.",
    },
  ],
};
