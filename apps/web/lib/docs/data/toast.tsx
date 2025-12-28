"use client";

import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";
import { Button, toast, Toaster } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const ToastHeroVisual = () => (
  <HeroBackground tone="error">
    {/* Mock App Interface */}
    <div className="relative bg-surface w-80 h-56 rounded-xl shadow-xl overflow-hidden border border-outline-variant/30">
      {/* App Bar */}
      <div className="h-14 flex items-center px-4 bg-surface border-b border-outline-variant/20">
        <span className="text-title-medium text-on-surface">Dashboard</span>
      </div>
      {/* Content */}
      <div className="p-4 text-body-medium text-on-surface-variant">
        Your content here...
      </div>
      {/* Stacked Toasts */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <div className="bg-surface rounded-md px-4 py-3 flex items-center gap-3 shadow-4 border border-outline-variant/30">
          <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
          <span className="text-body-medium text-on-surface">Changes saved</span>
        </div>
        <div className="bg-inverse-surface rounded-md px-4 py-3 flex items-center gap-3 shadow-4">
          <span className="text-body-medium text-inverse-on-surface">New message received</span>
        </div>
      </div>
    </div>
  </HeroBackground>
);

// ─── INTERACTIVE EXAMPLES ────────────────────────────────────────────────────
const ToastDefaultExample = () => (
  <Button variant="tonal" onClick={() => toast.show({ message: "This is a default toast" })}>
    Show Default Toast
  </Button>
);

const ToastSuccessExample = () => (
  <Button variant="tonal" onClick={() => toast.success("Changes saved successfully")}>
    Show Success Toast
  </Button>
);

const ToastErrorExample = () => (
  <Button variant="tonal" onClick={() => toast.error("Failed to save changes")}>
    Show Error Toast
  </Button>
);

const ToastWarningExample = () => (
  <Button variant="tonal" onClick={() => toast.warning("Your session will expire soon")}>
    Show Warning Toast
  </Button>
);

const ToastInfoExample = () => (
  <Button variant="tonal" onClick={() => toast.info("New features available")}>
    Show Info Toast
  </Button>
);

const ToastWithActionExample = () => (
  <Button
    variant="tonal"
    onClick={() =>
      toast.show({
        message: "Item deleted",
        action: {
          label: "Undo",
          onClick: () => toast.success("Item restored"),
        },
      })
    }
  >
    Show Toast with Action
  </Button>
);

const ToastWithDescriptionExample = () => (
  <Button
    variant="tonal"
    onClick={() =>
      toast.success("File uploaded", {
        description: "document.pdf has been uploaded successfully",
      })
    }
  >
    Show Toast with Description
  </Button>
);

const ToastPersistentExample = () => (
  <Button
    variant="tonal"
    onClick={() =>
      toast.info("This toast won't auto-dismiss", {
        duration: 0,
        dismissible: true,
      })
    }
  >
    Show Persistent Toast
  </Button>
);

export const toastDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "toast",
  name: "Toast",
  description:
    "Toasts display brief, temporary notifications that stack and auto-dismiss.",
  category: "communication",
  status: "stable",
  icon: "notifications",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["toast", "useToast", "Toaster", "ToastProvider"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <ToastHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Choose the toast variant based on the type of message.",
    columns: {
      emphasis: "Variant",
      component: "Preview",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Default",
        component: (
          <div className="bg-inverse-surface rounded-md px-3 py-2">
            <span className="text-body-small text-inverse-on-surface">Message</span>
          </div>
        ),
        rationale: "General informational messages.",
        examples: "Status updates, Confirmations",
      },
      {
        emphasis: "Success",
        component: (
          <div className="bg-surface rounded-md px-3 py-2 flex items-center gap-2 border border-outline-variant/30">
            <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
            <span className="text-body-small text-on-surface">Success</span>
          </div>
        ),
        rationale: "Positive outcomes and completed actions.",
        examples: "Save complete, Upload done",
      },
      {
        emphasis: "Error",
        component: (
          <div className="bg-error-container rounded-md px-3 py-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-on-error-container text-[18px]">error</span>
            <span className="text-body-small text-on-error-container">Error</span>
          </div>
        ),
        rationale: "Failed operations or errors.",
        examples: "Save failed, Network error",
      },
      {
        emphasis: "Warning",
        component: (
          <div className="bg-surface rounded-md px-3 py-2 flex items-center gap-2 border border-outline-variant/30">
            <span className="material-symbols-outlined text-tertiary text-[18px]">warning</span>
            <span className="text-body-small text-on-surface">Warning</span>
          </div>
        ),
        rationale: "Cautionary messages or potential issues.",
        examples: "Session expiring, Unsaved changes",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Click the buttons below to see different toast variants in action. Toasts stack when multiple are shown.",
    examples: [
      {
        title: "Default toast",
        visual: <ToastDefaultExample />,
        caption: "Basic message toast",
      },
      {
        title: "Success toast",
        visual: <ToastSuccessExample />,
        caption: "For completed actions",
      },
      {
        title: "Error toast",
        visual: <ToastErrorExample />,
        caption: "For failed operations",
      },
      {
        title: "Warning toast",
        visual: <ToastWarningExample />,
        caption: "For cautionary messages",
      },
      {
        title: "Info toast",
        visual: <ToastInfoExample />,
        caption: "For informational messages",
      },
      {
        title: "With action",
        visual: <ToastWithActionExample />,
        caption: "Includes an action button",
      },
      {
        title: "With description",
        visual: <ToastWithDescriptionExample />,
        caption: "Additional context below message",
      },
      {
        title: "Persistent",
        visual: <ToastPersistentExample />,
        caption: "Requires manual dismiss",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "message",
      type: "string",
      required: true,
      description: "The main message to display.",
    },
    {
      name: "description",
      type: "string",
      description: "Optional description text below the message.",
    },
    {
      name: "variant",
      type: '"default" | "success" | "error" | "warning" | "info"',
      default: '"default"',
      description: "The visual style of the toast.",
    },
    {
      name: "icon",
      type: "ReactNode",
      description: "Custom icon. Defaults to variant-specific icon.",
    },
    {
      name: "action",
      type: "{ label: string; onClick: () => void }",
      description: "Optional action button configuration.",
    },
    {
      name: "duration",
      type: "number",
      default: "5000",
      description: "Auto-dismiss duration in ms. Set to 0 for persistent.",
    },
    {
      name: "dismissible",
      type: "boolean",
      default: "true",
      description: "Shows a close button to dismiss the toast.",
    },
  ],

  // ─── SUBCOMPONENTS ─────────────────────────────────────────────────────────
  subComponents: [
    {
      name: "Toaster",
      description: "Renders the toast container. Add once to your app root.",
      props: [
        {
          name: "position",
          type: '"bottom-right" | "bottom-left" | "bottom-center" | "top-right" | "top-left" | "top-center"',
          default: '"bottom-right"',
          description: "Position of the toast container.",
        },
        {
          name: "maxToasts",
          type: "number",
          default: "5",
          description: "Maximum number of visible toasts.",
        },
      ],
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Uses role=\"status\" and aria-live=\"polite\" for announcements.",
      "Messages are announced without interrupting current speech.",
      "Action buttons are focusable and announced.",
    ],
    keyboard: [
      { key: "Tab", description: "Moves focus to action/close button" },
      { key: "Enter / Space", description: "Activates focused button" },
    ],
    focus: [
      "Focus is not automatically moved to avoid disruption.",
      "Action and close buttons receive visible focus states.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Add Toaster to your app root, then use the toast API anywhere.",
    code: `// 1. Add Toaster to your app layout
import { Toaster } from "@unisane/ui";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}

// 2. Use the toast API in any component
import { toast, Button } from "@unisane/ui";

function SaveButton() {
  const handleSave = async () => {
    try {
      await saveData();
      toast.success("Changes saved successfully");
    } catch (error) {
      toast.error("Failed to save changes", {
        description: error.message,
        action: {
          label: "Retry",
          onClick: handleSave,
        },
      });
    }
  };

  return <Button onClick={handleSave}>Save</Button>;
}

// Available methods:
toast.show({ message: "...", variant: "default" });
toast.success("Success message");
toast.error("Error message");
toast.warning("Warning message");
toast.info("Info message");
toast.dismiss(toastId);
toast.dismissAll();`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "dialog",
      reason: "Use for important messages requiring user confirmation.",
    },
    {
      slug: "banner",
      reason: "Use for persistent messages at the top of content.",
    },
    {
      slug: "alert",
      reason: "Use for inline contextual messages.",
    },
  ],
};
