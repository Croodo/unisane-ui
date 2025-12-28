"use client";

import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";
import { Alert, Card } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const AlertHeroVisual = () => (
  <HeroBackground tone="error">
    {/* Mock Alerts Stack */}
    <div className="relative w-[300px] space-y-3">
      <Alert variant="success" title="Success">
        Your changes have been saved successfully.
      </Alert>
      <Alert variant="error" title="Error">
        Failed to connect to the server.
      </Alert>
      <Alert variant="warning" title="Warning">
        Your session will expire in 5 minutes.
      </Alert>
      <Alert variant="info" title="Info">
        A new version is available.
      </Alert>
    </div>
  </HeroBackground>
);

export const alertDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "alert",
  name: "Alert",
  description:
    "Alerts display brief messages with different severity levels.",
  category: "communication",
  status: "stable",
  icon: "error",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["Alert"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <AlertHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Alerts come in different variants to convey the severity and type of message.",
    columns: {
      emphasis: "Variant",
      component: "Example",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Success",
        component: (
          <Alert variant="success" title="Success" className="max-w-[200px]">
            Operation completed
          </Alert>
        ),
        rationale:
          "Confirm successful actions or positive outcomes.",
        examples: "Form submitted, Item saved, Payment complete",
      },
      {
        emphasis: "Error",
        component: (
          <Alert variant="error" title="Error" className="max-w-[200px]">
            Something went wrong
          </Alert>
        ),
        rationale:
          "Communicate failures or critical problems.",
        examples: "Validation errors, Connection failed, Access denied",
      },
      {
        emphasis: "Warning",
        component: (
          <Alert variant="warning" title="Warning" className="max-w-[200px]">
            Please review this
          </Alert>
        ),
        rationale:
          "Alert users to potential issues or required attention.",
        examples: "Session expiring, Unsaved changes, Deprecated feature",
      },
      {
        emphasis: "Info",
        component: (
          <Alert variant="info" title="Info" className="max-w-[200px]">
            New update available
          </Alert>
        ),
        rationale:
          "Provide neutral information or announcements.",
        examples: "Updates available, Tips, Announcements",
      },
    ],
  },

  // ─── HIERARCHY SECTION ─────────────────────────────────────────────────────
  hierarchy: {
    description:
      "Alerts can include titles, custom icons, and detailed descriptions.",
    items: [
      {
        component: <Alert variant="info" className="w-40">Simple message</Alert>,
        title: "Simple",
        subtitle: "Message only",
      },
      {
        component: <Alert variant="info" title="Title" className="w-40">With description</Alert>,
        title: "With Title",
        subtitle: "Title + message",
      },
      {
        component: <Alert variant="info" icon="lightbulb" className="w-40">Custom icon</Alert>,
        title: "Custom Icon",
        subtitle: "Override default",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Alerts are typically placed at the top of the content area or inline with forms.",
    examples: [
      {
        title: "Form validation",
        visual: (
          <Card variant="outlined" padding="md" className="max-w-[280px] mx-auto">
            <div className="text-title-small text-on-surface mb-3">Create Account</div>
            <Alert variant="error" title="Validation Error" className="mb-4">
              Please correct the errors below.
            </Alert>
            <div className="space-y-3">
              <div className="h-10 bg-error-container/30 border border-error/50 rounded-sm" />
              <div className="h-10 bg-surface-container-high rounded-sm" />
            </div>
          </Card>
        ),
        caption: "Alert showing form validation errors",
      },
      {
        title: "Status messages",
        visual: (
          <Card variant="outlined" padding="md" className="max-w-[280px] mx-auto">
            <div className="text-title-small text-on-surface mb-3">System Status</div>
            <div className="space-y-2">
              <Alert variant="success" title="Database">
                Connected and synced
              </Alert>
              <Alert variant="warning" title="API">
                High latency detected
              </Alert>
            </div>
          </Card>
        ),
        caption: "Multiple alerts for system status",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "variant",
      type: '"info" | "success" | "warning" | "error"',
      default: '"info"',
      description: "The severity/type of the alert.",
    },
    {
      name: "title",
      type: "string",
      description: "Optional title displayed above the message.",
    },
    {
      name: "icon",
      type: "ReactNode | string",
      description: "Custom icon to display. Defaults based on variant.",
    },
    {
      name: "children",
      type: "ReactNode",
      required: true,
      description: "The alert message content.",
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
      "Uses role='alert' for important announcements.",
      "Screen readers announce alert content immediately.",
      "Title and message are read in sequence.",
    ],
    keyboard: [
      { key: "N/A", description: "Alerts are not interactive by default" },
    ],
    focus: [
      "Alerts do not receive focus unless interactive.",
      "Consider using live regions for dynamic alerts.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Use alerts to communicate status and feedback to users.",
    code: `import { Alert } from "@unisane/ui";

function FormWithValidation() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (data: FormData) => {
    try {
      await submitForm(data);
      setSuccess(true);
      setError(null);
    } catch (err) {
      setError(err.message);
      setSuccess(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {success && (
        <Alert variant="success" title="Success!">
          Your form has been submitted successfully.
        </Alert>
      )}

      {error && (
        <Alert variant="error" title="Error">
          {error}
        </Alert>
      )}

      {/* Form fields... */}
    </form>
  );
}

function SystemStatus() {
  return (
    <div className="space-y-3">
      <Alert variant="success" title="Database">
        All systems operational
      </Alert>
      <Alert variant="warning" title="API" icon="warning">
        Experiencing high latency
      </Alert>
      <Alert variant="info" title="Maintenance">
        Scheduled maintenance tomorrow at 2:00 AM
      </Alert>
    </div>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "snackbar",
      reason: "Use for temporary, non-blocking notifications.",
    },
    {
      slug: "banner",
      reason: "Use for persistent, page-level announcements.",
    },
    {
      slug: "dialog",
      reason: "Use when user acknowledgment is required.",
    },
  ],
};
