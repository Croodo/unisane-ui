"use client";

import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";
import { Button, Dialog, IconButton } from "@unisane/ui";
import { useState } from "react";

// ─── INTERACTIVE EXAMPLE ─────────────────────────────────────────────────────
const DialogInteractiveExample = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Open Dialog
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Delete item?"
        icon={<span className="material-symbols-outlined text-error">delete</span>}
        actions={
          <>
            <Button variant="text" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="filled" onClick={() => setOpen(false)}>
              Delete
            </Button>
          </>
        }
      >
        This action cannot be undone. Are you sure you want to permanently delete this item?
      </Dialog>
    </>
  );
};

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const DialogHeroVisual = () => (
  <HeroBackground tone="tertiary">
    {/* Background App (dimmed) */}
    <div className="absolute inset-8 bg-surface/40 rounded-lg" />

    {/* Dialog Mock */}
    <div className="bg-surface w-80 rounded-xl shadow-xl overflow-hidden border border-outline-variant/30">
      {/* Header */}
      <div className="px-6 py-5 border-b border-outline-variant/10 bg-surface-container-low/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">delete</span>
          <span className="text-title-medium text-on-surface">Delete file?</span>
        </div>
        <IconButton variant="standard" size="sm" ariaLabel="Close dialog">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </IconButton>
      </div>
      {/* Content */}
      <div className="px-6 py-5">
        <p className="text-body-medium text-on-surface-variant">
          This will permanently delete "document.pdf" from your drive. This action cannot be undone.
        </p>
      </div>
      {/* Actions */}
      <div className="flex justify-end gap-2 p-4 border-t border-outline-variant/10 bg-surface-container-low/30">
        <Button variant="text" size="sm">Cancel</Button>
        <Button variant="filled" size="sm">Delete</Button>
      </div>
    </div>
  </HeroBackground>
);

// ─── PLACEMENT VISUALS ─────────────────────────────────────────────────────────
const DialogPlacementBasic = () => (
  <div className="relative w-80 h-44 rounded-xl overflow-hidden mx-auto bg-surface-container-high">
    {/* Scrim overlay */}
    <div className="absolute inset-0 bg-black/30" />
    {/* Dialog */}
    <div className="absolute inset-4 rounded-xl shadow-lg p-4 flex flex-col bg-surface">
      <div className="text-title-small text-on-surface mb-2">Dialog Title</div>
      <div className="text-body-small text-on-surface-variant flex-1">
        Dialog content goes here...
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <Button variant="text" size="sm">Cancel</Button>
        <Button variant="filled" size="sm">Confirm</Button>
      </div>
    </div>
  </div>
);

const DialogPlacementWithIcon = () => (
  <div className="relative w-80 h-48 rounded-xl overflow-hidden mx-auto bg-surface-container-high">
    {/* Scrim overlay */}
    <div className="absolute inset-0 bg-black/30" />
    {/* Dialog */}
    <div className="absolute inset-4 rounded-xl shadow-lg overflow-hidden flex flex-col bg-surface">
      <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center gap-2">
        <span className="material-symbols-outlined text-error">warning</span>
        <span className="text-title-small text-on-surface">Warning</span>
      </div>
      <div className="p-4 text-body-small text-on-surface-variant flex-1">
        Are you sure you want to proceed?
      </div>
      <div className="flex justify-end gap-2 p-3 border-t border-outline-variant/20">
        <Button variant="text" size="sm">Cancel</Button>
        <Button variant="filled" size="sm">Continue</Button>
      </div>
    </div>
  </div>
);

// ─── CHOOSING VISUALS ─────────────────────────────────────────────────────────
const AlertDialogVisual = () => (
  <div className="bg-surface p-3 rounded-lg border border-outline-variant/30 text-center w-32">
    <span className="material-symbols-outlined text-error text-[24px]">warning</span>
    <div className="text-label-small mt-1">Alert</div>
  </div>
);

const ConfirmDialogVisual = () => (
  <div className="bg-surface p-3 rounded-lg border border-outline-variant/30 text-center w-32">
    <span className="material-symbols-outlined text-primary text-[24px]">help</span>
    <div className="text-label-small mt-1">Confirm</div>
  </div>
);

const FormDialogVisual = () => (
  <div className="bg-surface p-3 rounded-lg border border-outline-variant/30 text-center w-32">
    <span className="material-symbols-outlined text-secondary text-[24px]">edit_note</span>
    <div className="text-label-small mt-1">Form</div>
  </div>
);

export const dialogDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "dialog",
  name: "Dialog",
  description:
    "Dialogs provide important prompts in a user flow, requiring user input or confirmation.",
  category: "containment",
  status: "stable",
  icon: "chat_bubble",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["Dialog"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <DialogHeroVisual />,

  // ─── INTERACTIVE EXAMPLES ─────────────────────────────────────────────────
  examples: [
    {
      id: "basic",
      title: "Basic Dialog",
      description: "Click the button to open an interactive dialog.",
      component: <DialogInteractiveExample />,
      code: `const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>Open Dialog</Button>

<Dialog
  open={open}
  onClose={() => setOpen(false)}
  title="Delete item?"
  icon={<span className="material-symbols-outlined">delete</span>}
  actions={
    <>
      <Button variant="text" onClick={() => setOpen(false)}>Cancel</Button>
      <Button variant="filled" onClick={() => setOpen(false)}>Delete</Button>
    </>
  }
>
  This action cannot be undone.
</Dialog>`,
    },
  ],

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Dialogs interrupt the user experience to deliver important information or request input. Use them sparingly for critical moments.",
    columns: {
      emphasis: "Type",
      component: "Visual",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Alert Dialog",
        component: <AlertDialogVisual />,
        rationale:
          "Requires immediate attention and acknowledgment. User must respond before continuing.",
        examples: "Delete confirmation, Error messages, Permission requests",
      },
      {
        emphasis: "Confirmation Dialog",
        component: <ConfirmDialogVisual />,
        rationale:
          "Asks user to confirm an action. Provides cancel and confirm options.",
        examples: "Save changes, Discard draft, Log out",
      },
      {
        emphasis: "Form Dialog",
        component: <FormDialogVisual />,
        rationale:
          "Collects user input in a focused context. Use when input is required before proceeding.",
        examples: "Create item, Edit details, Add comment",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Dialogs appear centered on the screen with a scrim overlay that dims the background content.",
    examples: [
      {
        title: "Basic dialog",
        visual: <DialogPlacementBasic />,
        caption: "Centered with scrim overlay blocking interaction with background",
      },
      {
        title: "With icon",
        visual: <DialogPlacementWithIcon />,
        caption: "Icon in header emphasizes the dialog's purpose",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "open",
      type: "boolean",
      required: true,
      description: "Controls whether the dialog is visible.",
    },
    {
      name: "onClose",
      type: "() => void",
      required: true,
      description: "Callback fired when the dialog should close (clicking scrim, pressing Escape, or close button).",
    },
    {
      name: "title",
      type: "string",
      description: "The title displayed in the dialog header.",
    },
    {
      name: "children",
      type: "ReactNode",
      required: true,
      description: "The content displayed in the dialog body.",
    },
    {
      name: "actions",
      type: "ReactNode",
      description: "Action buttons displayed in the dialog footer.",
    },
    {
      name: "icon",
      type: "ReactNode",
      description: "Icon displayed next to the title in the header.",
    },
    {
      name: "contentClassName",
      type: "string",
      description: "Additional CSS classes for the content container.",
    },
    {
      name: "className",
      type: "string",
      description: "Additional CSS classes for the dialog surface.",
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Dialog uses role=\"dialog\" and aria-modal=\"true\" for proper screen reader announcement.",
      "Title is linked with aria-labelledby and content with aria-describedby.",
      "Focus is trapped within the dialog while open.",
      "Pressing Escape closes the dialog.",
    ],
    keyboard: [
      { key: "Escape", description: "Closes the dialog" },
      { key: "Tab", description: "Moves focus to next focusable element within dialog" },
      { key: "Shift + Tab", description: "Moves focus to previous focusable element within dialog" },
    ],
    focus: [
      "Focus is automatically moved to the first focusable element when dialog opens.",
      "Focus is restored to the previously focused element when dialog closes.",
      "Focus is trapped within the dialog (Tab cycles through dialog elements only).",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Control the dialog with React state and provide action handlers.",
    code: `import { Dialog, Button } from "@unisane/ui";
import { useState } from "react";

function DeleteConfirmation() {
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    // Perform delete action
    deleteItem();
    setOpen(false);
  };

  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Delete
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Delete item?"
        icon={<span className="material-symbols-outlined">delete</span>}
        actions={
          <>
            <Button variant="text" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="filled" onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        This action cannot be undone. Are you sure you want to
        permanently delete this item?
      </Dialog>
    </>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "sheet",
      reason: "Use for supplementary content that slides in from the edge.",
    },
    {
      slug: "snackbar",
      reason: "Use for brief, non-blocking notifications.",
    },
    {
      slug: "popover",
      reason: "Use for contextual information without blocking the page.",
    },
  ],
};
