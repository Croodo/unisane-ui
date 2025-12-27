"use client";

import { ComponentDoc } from "../types";
import { TextField, Card } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const TextFieldHeroVisual = () => (
  <div className="relative w-full h-full bg-linear-to-br from-primary-container to-secondary-container flex items-center justify-center p-8 overflow-hidden isolate">
    {/* Decorative Circles */}
    <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
    <div className="absolute bottom-[-40px] left-[-40px] w-56 h-56 bg-secondary/20 rounded-full blur-3xl" />

    {/* Mock Login Form */}
    <div className="relative bg-surface w-[300px] rounded-3xl shadow-xl overflow-hidden border border-outline-variant/30 z-10">
      <div className="px-6u py-5u border-b border-outline-variant/20 text-center">
        <span className="text-headline-small text-on-surface">Welcome back</span>
      </div>
      <div className="p-6u space-y-4u">
        <TextField
          label="Email"
          placeholder="you@example.com"
          leadingIcon={<span className="material-symbols-outlined">mail</span>}
        />
        <TextField
          label="Password"
          type="password"
          placeholder="Enter password"
          leadingIcon={<span className="material-symbols-outlined">lock</span>}
        />
        <div className="pt-2u">
          <button className="w-full bg-primary text-on-primary py-3u rounded-full text-label-large font-medium">
            Sign in
          </button>
        </div>
      </div>
    </div>
  </div>
);

export const textFieldDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "text-field",
  name: "Text Field",
  description:
    "Text fields allow users to enter and edit text, with support for labels, validation, and icons.",
  category: "text-inputs",
  status: "stable",
  icon: "text_fields",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["TextField"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <TextFieldHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Text fields come in two variants. Choose based on the visual density and emphasis needed.",
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
          <TextField variant="filled" label="Label" placeholder="Input text" className="w-48 pointer-events-none" />
        ),
        rationale:
          "Default variant with a subtle background. Good for forms with multiple fields.",
        examples: "Registration forms, Search inputs, Settings",
      },
      {
        emphasis: "Outlined",
        component: (
          <TextField variant="outlined" label="Label" placeholder="Input text" className="w-48 pointer-events-none" />
        ),
        rationale:
          "Higher contrast with a visible border. Works well on colored backgrounds.",
        examples: "Contact forms, Login pages, Dialogs",
      },
      {
        emphasis: "With Icons",
        component: (
          <TextField
            label="Search"
            placeholder="Search..."
            leadingIcon={<span className="material-symbols-outlined">search</span>}
            className="w-48 pointer-events-none"
          />
        ),
        rationale:
          "Icons provide visual context about the expected input type.",
        examples: "Search, Email, Password, Phone",
      },
      {
        emphasis: "Error State",
        component: (
          <TextField
            label="Email"
            value="invalid"
            error
            helperText="Please enter a valid email"
            className="w-48 pointer-events-none"
          />
        ),
        rationale:
          "Shows validation feedback with error message and styling.",
        examples: "Form validation, Required fields",
      },
    ],
  },

  // ─── HIERARCHY SECTION ─────────────────────────────────────────────────────
  hierarchy: {
    description:
      "Text field variants help establish visual hierarchy and match different contexts.",
    items: [
      {
        component: <TextField variant="filled" label="Filled" placeholder="Filled input" className="w-48" />,
        title: "Filled",
        subtitle: "Default variant",
      },
      {
        component: <TextField variant="outlined" label="Outlined" placeholder="Outlined input" className="w-48" />,
        title: "Outlined",
        subtitle: "Higher contrast",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Text fields are commonly used in forms, search bars, and dialog inputs.",
    examples: [
      {
        title: "Contact form",
        visual: (
          <Card variant="outlined" padding="md" className="max-w-[280px] mx-auto">
            <div className="text-title-small text-on-surface mb-4u">Contact Us</div>
            <div className="space-y-4u">
              <TextField label="Name" placeholder="Your name" />
              <TextField label="Email" placeholder="you@example.com" />
              <TextField label="Message" placeholder="How can we help?" multiline rows={3} />
            </div>
          </Card>
        ),
        caption: "Stacked text fields in a contact form layout",
      },
      {
        title: "Inline with button",
        visual: (
          <Card variant="outlined" padding="md" className="max-w-[300px] mx-auto">
            <div className="text-title-small text-on-surface mb-3u">Subscribe</div>
            <div className="flex gap-2u">
              <TextField
                label="Email"
                placeholder="Enter email"
                leadingIcon={<span className="material-symbols-outlined">mail</span>}
                className="flex-1"
              />
              <button className="bg-primary text-on-primary px-4u rounded-full text-label-medium shrink-0">
                Join
              </button>
            </div>
          </Card>
        ),
        caption: "Text field with action button for inline forms",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "label",
      type: "string",
      description: "The label text displayed above or within the field.",
    },
    {
      name: "placeholder",
      type: "string",
      description: "Placeholder text shown when the field is empty.",
    },
    {
      name: "variant",
      type: '"filled" | "outlined"',
      default: '"outlined"',
      description: "The visual style of the text field.",
    },
    {
      name: "value",
      type: "string",
      description: "The controlled value of the input.",
    },
    {
      name: "defaultValue",
      type: "string",
      description: "The default value for uncontrolled usage.",
    },
    {
      name: "error",
      type: "boolean",
      description: "If true, shows error state with red border.",
    },
    {
      name: "helperText",
      type: "string",
      description: "Helper text displayed below the input.",
    },
    {
      name: "leadingIcon",
      type: "ReactNode",
      description: "Icon displayed at the start of the input.",
    },
    {
      name: "trailingIcon",
      type: "ReactNode",
      description: "Icon displayed at the end of the input.",
    },
    {
      name: "multiline",
      type: "boolean",
      default: "false",
      description: "If true, renders a textarea instead of input.",
    },
    {
      name: "rows",
      type: "number",
      description: "Number of rows for multiline text fields.",
    },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "If true, the field is disabled.",
    },
    {
      name: "required",
      type: "boolean",
      default: "false",
      description: "If true, marks the field as required.",
    },
    {
      name: "onChange",
      type: "(event: ChangeEvent) => void",
      description: "Callback fired when the value changes.",
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Label is associated with input via htmlFor/id for screen readers.",
      "Error messages are linked with aria-describedby.",
      "Required state is communicated via aria-required.",
      "Invalid state uses aria-invalid for form validation.",
    ],
    keyboard: [
      { key: "Tab", description: "Moves focus to the text field" },
      { key: "Type", description: "Enters text in the field" },
      { key: "Escape", description: "Clears focus (browser default)" },
    ],
    focus: [
      "Focus ring clearly indicates the active field.",
      "Label animates to indicate focus state.",
      "Error state is visually distinct with red border.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Use controlled or uncontrolled state with validation.",
    code: `import { TextField } from "@unisane/ui";
import { useState } from "react";

function ContactForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const validateEmail = (value: string) => {
    if (!value) {
      setError("Email is required");
    } else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value)) {
      setError("Please enter a valid email");
    } else {
      setError("");
    }
  };

  return (
    <form className="space-y-4">
      <TextField
        label="Name"
        placeholder="Enter your name"
        required
      />
      <TextField
        label="Email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          validateEmail(e.target.value);
        }}
        error={error}
        leadingIcon={<span className="material-symbols-outlined">mail</span>}
        required
      />
      <TextField
        label="Message"
        placeholder="Your message"
        multiline
        rows={4}
      />
    </form>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "select",
      reason: "Use when users need to choose from predefined options.",
    },
    {
      slug: "search-bar",
      reason: "Use for dedicated search functionality with suggestions.",
    },
    {
      slug: "combobox",
      reason: "Use when combining text input with dropdown selection.",
    },
  ],
};
