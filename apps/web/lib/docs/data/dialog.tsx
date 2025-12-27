"use client";

import { ComponentDoc } from "../types";
import {
  DialogInteractiveExample,
  DialogHeroVisual,
  DialogPlacementBasic,
  DialogPlacementWithIcon,
  AlertDialogVisual,
  ConfirmDialogVisual,
  FormDialogVisual,
} from "./dialog-examples";

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
