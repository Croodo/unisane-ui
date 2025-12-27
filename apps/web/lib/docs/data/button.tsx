"use client";

import { ComponentDoc } from "../types";
import { Button, Card } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const ButtonHeroVisual = () => (
  <div className="relative w-full h-full bg-linear-to-br from-primary-container to-secondary-container flex items-center justify-center p-8 overflow-hidden isolate">
    {/* Decorative Circles */}
    <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
    <div className="absolute bottom-[-50px] left-[-50px] w-80 h-80 bg-secondary/20 rounded-full blur-3xl" />

    {/* Mock Screen */}
    <div className="relative bg-surface w-[280px] h-[340px] rounded-3xl shadow-xl overflow-hidden flex flex-col border border-outline-variant/30 z-10">
      {/* Mock Image Header */}
      <div className="h-36 bg-surface-container-high relative">
        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
        <div className="absolute bottom-4 right-4">
          <Button variant="filled" size="sm">
            <span className="material-symbols-outlined text-[16px]!">edit</span>
            Edit
          </Button>
        </div>
      </div>
      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="h-2 w-14 bg-outline-variant/30 rounded mb-3" />
        <h3 className="text-title-medium font-medium text-on-surface mb-2">Top 5 tea houses</h3>
        <p className="text-body-small text-on-surface-variant mb-auto line-clamp-2">
          Seattle is full of amazing tea spots. Here are 5 of the coziest ones.
        </p>
        <div className="flex gap-2 pt-4">
          <Button variant="tonal" size="sm" className="flex-1">
            Read entry
          </Button>
          <Button variant="text" size="sm">
            Share
          </Button>
        </div>
      </div>
    </div>
  </div>
);

export const buttonDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "button",
  name: "Button",
  description:
    "Buttons help people take action, such as sending an email, sharing a document, or liking a comment.",
  category: "actions",
  status: "stable",
  icon: "smart_button",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["Button"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <ButtonHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "When choosing the right button for an action, consider the level of emphasis each button type provides.",
    columns: {
      emphasis: "Level of emphasis",
      component: "Component",
      rationale: "Rationale",
      examples: "Example actions",
    },
    rows: [
      {
        emphasis: "High emphasis",
        component: (
          <Button variant="filled" className="pointer-events-none">
            Filled button
          </Button>
        ),
        rationale:
          "The filled button's primary color palette makes it the most prominent button after the FAB. It's used for final or unblocking actions in a flow.",
        examples: "Save, Confirm, Done",
      },
      {
        emphasis: "Medium emphasis",
        component: (
          <Button variant="tonal" className="pointer-events-none">
            Tonal button
          </Button>
        ),
        rationale:
          "The tonal button has a secondary color palette, making it less visually prominent than a regular, filled button. It can be used for final or unblocking actions.",
        examples: "Next, Add, Reply",
      },
      {
        emphasis: "Low emphasis",
        component: (
          <Button variant="outlined" className="pointer-events-none">
            Outlined button
          </Button>
        ),
        rationale:
          'Use an outlined button for actions that need attention but aren\'t the primary action, such as "See all" or "Add to cart".',
        examples: "Back, See all",
      },
      {
        emphasis: "Lowest emphasis",
        component: (
          <Button variant="text" className="pointer-events-none">
            Text button
          </Button>
        ),
        rationale:
          'Text buttons are used for low-priority actions, such as "Cancel" or "Learn more". They are often used in dialogs and cards.',
        examples: "Cancel, Learn more",
      },
    ],
  },

  // ─── HIERARCHY SECTION ─────────────────────────────────────────────────────
  hierarchy: {
    description:
      "Button hierarchy helps users understand the importance of actions. The more important an action is, the more emphasis it should have.",
    items: [
      {
        component: <Button variant="filled">Primary</Button>,
        title: "High emphasis",
        subtitle: "Filled button",
      },
      {
        component: <Button variant="tonal">Secondary</Button>,
        title: "Medium emphasis",
        subtitle: "Tonal button",
      },
      {
        component: <Button variant="text">Tertiary</Button>,
        title: "Low emphasis",
        subtitle: "Text button",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Buttons can be placed in a variety of containers, such as cards, dialogs, and app bars.",
    examples: [
      {
        title: "Dialog placement",
        visual: (
          <div className="bg-surface rounded-3xl p-6 shadow-sm max-w-[320px] mx-auto border border-outline-variant/30">
            <div className="mb-4">
              <h4 className="text-title-large text-on-surface">Discard draft?</h4>
              <p className="text-body-medium text-on-surface-variant mt-2">
                This will permanently delete your current draft.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="text" size="sm">
                Cancel
              </Button>
              <Button variant="text" size="sm">
                Discard
              </Button>
            </div>
          </div>
        ),
        caption: "Text buttons on the right side of dialogs",
      },
      {
        title: "Card placement",
        visual: (
          <Card variant="elevated" padding="none" className="max-w-[320px] mx-auto overflow-hidden">
            <div className="h-28 bg-surface-container-high w-full" />
            <div className="p-4">
              <div className="h-5 bg-outline-variant/30 rounded w-3/4 mb-3" />
              <div className="h-4 bg-outline-variant/20 rounded w-full mb-2" />
              <div className="h-4 bg-outline-variant/20 rounded w-2/3 mb-5" />
              <div className="flex gap-2">
                <Button variant="filled" size="sm">
                  Buy
                </Button>
                <Button variant="outlined" size="sm">
                  Info
                </Button>
              </div>
            </div>
          </Card>
        ),
        caption: "Buttons aligned to start of content in cards",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "children",
      type: "ReactNode",
      required: true,
      description: "The content displayed inside the button.",
    },
    {
      name: "variant",
      type: '"filled" | "tonal" | "outlined" | "text" | "elevated"',
      default: '"filled"',
      description: "The visual style of the button.",
    },
    {
      name: "size",
      type: '"sm" | "md" | "lg"',
      default: '"md"',
      description: "The size of the button.",
    },
    {
      name: "fullWidth",
      type: "boolean",
      default: "false",
      description: "If true, the button expands to full width.",
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
      name: "icon",
      type: "ReactNode",
      description: "Icon element to display before the button text.",
    },
    {
      name: "trailingIcon",
      type: "ReactNode",
      description: "Icon element to display after the button text.",
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
      "The Button component renders a native button element, ensuring standard keyboard navigation and screen reader support out of the box.",
      "Focus states are managed automatically with a visible ring.",
      "Disabled buttons receive the disabled attribute and aria-disabled=\"true\".",
      "Icons are purely decorative by default; if using an icon-only button, ensure you provide an aria-label.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Import the component and specify the variant.",
    code: `import { Button } from "@unisane/ui";

function MyComponent() {
  return (
    <div className="flex gap-4">
      <Button variant="filled" onClick={handleSubmit}>
        Submit
      </Button>
      <Button variant="text" onClick={handleCancel}>
        Cancel
      </Button>
    </div>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "icon-button",
      reason: "Use when you only need an icon without text label.",
    },
    {
      slug: "fab",
      reason: "Use for the primary floating action on a screen.",
    },
    {
      slug: "segmented-button",
      reason: "Use when users need to select from multiple options.",
    },
  ],
};
