"use client";

import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent, Card } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const AccordionHeroVisual = () => (
  <HeroBackground tone="tertiary">
    {/* Mock FAQ Card */}
    <div className="relative bg-surface w-80 rounded-xl shadow-xl overflow-hidden border border-outline-variant/30">
      <div className="px-5 py-4 border-b border-outline-variant/20">
        <span className="text-title-medium text-on-surface">FAQ</span>
      </div>
      <div className="p-4">
        <Accordion type="single" defaultValue={["item-1"]}>
          <AccordionItem value="item-1">
            <AccordionTrigger>How do I get started?</AccordionTrigger>
            <AccordionContent>
              Install the package using your preferred package manager and import the components you need.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Is it accessible?</AccordionTrigger>
            <AccordionContent>
              Yes! All components follow WAI-ARIA guidelines.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Can I customize it?</AccordionTrigger>
            <AccordionContent>
              Absolutely. Use Tailwind classes to style components.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  </HeroBackground>
);

export const accordionDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "accordion",
  name: "Accordion",
  description:
    "Accordions display collapsible content panels for presenting information in a limited amount of space.",
  category: "containment",
  status: "stable",
  icon: "expand_more",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["Accordion", "AccordionItem", "AccordionTrigger", "AccordionContent"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <AccordionHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Accordions can allow single or multiple panels to be open at once.",
    columns: {
      emphasis: "Type",
      component: "Example",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Single",
        component: (
          <div className="w-48 pointer-events-none">
            <Accordion type="single" defaultValue={["item-1"]}>
              <AccordionItem value="item-1">
                <AccordionTrigger>Section 1</AccordionTrigger>
                <AccordionContent>Content here...</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Section 2</AccordionTrigger>
                <AccordionContent>More content...</AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        ),
        rationale:
          "Only one panel can be open at a time, focusing attention.",
        examples: "FAQ, Settings, Navigation",
      },
      {
        emphasis: "Multiple",
        component: (
          <div className="w-48 pointer-events-none">
            <Accordion type="multiple" defaultValue={["item-1", "item-2"]}>
              <AccordionItem value="item-1">
                <AccordionTrigger>Section 1</AccordionTrigger>
                <AccordionContent>Content here...</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Section 2</AccordionTrigger>
                <AccordionContent>More content...</AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        ),
        rationale:
          "Multiple panels can be open simultaneously for comparison.",
        examples: "Product details, Filters, Documentation",
      },
    ],
  },

  // ─── HIERARCHY SECTION ─────────────────────────────────────────────────────
  hierarchy: {
    description:
      "Accordions consist of items with triggers and expandable content areas.",
    items: [
      {
        component: (
          <div className="w-40">
            <Accordion type="single" defaultValue={["collapsed"]}>
              <AccordionItem value="expanded">
                <AccordionTrigger>Collapsed</AccordionTrigger>
                <AccordionContent>Hidden</AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        ),
        title: "Collapsed",
        subtitle: "Default closed state",
      },
      {
        component: (
          <div className="w-40">
            <Accordion type="single" defaultValue={["expanded"]}>
              <AccordionItem value="expanded">
                <AccordionTrigger>Expanded</AccordionTrigger>
                <AccordionContent>Visible content</AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        ),
        title: "Expanded",
        subtitle: "Open with content visible",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Accordions are commonly used in FAQ sections, settings panels, and navigation menus.",
    examples: [
      {
        title: "FAQ section",
        visual: (
          <Card variant="outlined" padding="md" className="max-w-72 mx-auto">
            <div className="text-title-small text-on-surface mb-3">Frequently Asked</div>
            <Accordion type="single" defaultValue={["faq-1"]}>
              <AccordionItem value="faq-1">
                <AccordionTrigger>What is included?</AccordionTrigger>
                <AccordionContent>
                  All components, hooks, and utilities are included.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-2">
                <AccordionTrigger>How do updates work?</AccordionTrigger>
                <AccordionContent>
                  Updates are automatic via npm or pnpm.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        ),
        caption: "Accordion for frequently asked questions",
      },
      {
        title: "Settings groups",
        visual: (
          <Card variant="outlined" padding="md" className="max-w-72 mx-auto">
            <div className="text-title-small text-on-surface mb-3">Settings</div>
            <Accordion type="multiple" defaultValue={["notifications"]}>
              <AccordionItem value="notifications">
                <AccordionTrigger>Notifications</AccordionTrigger>
                <AccordionContent>
                  Email, push, and SMS notification preferences.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="privacy">
                <AccordionTrigger>Privacy</AccordionTrigger>
                <AccordionContent>
                  Data sharing and visibility settings.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        ),
        caption: "Collapsible settings categories",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "type",
      type: '"single" | "multiple"',
      default: '"single"',
      description: "Whether one or multiple items can be open at once.",
    },
    {
      name: "defaultValue",
      type: "string[]",
      default: "[]",
      description: "Initially expanded item values.",
    },
    {
      name: "children",
      type: "ReactNode",
      required: true,
      description: "AccordionItem components to render.",
    },
    {
      name: "className",
      type: "string",
      description: "Additional CSS classes to apply.",
    },
  ],

  // ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────
  subComponents: [
    {
      name: "AccordionItem",
      description: "Wrapper for each expandable section.",
      props: [
        { name: "value", type: "string", required: true, description: "Unique identifier for the item." },
        { name: "children", type: "ReactNode", required: true, description: "Trigger and Content components." },
      ],
    },
    {
      name: "AccordionTrigger",
      description: "Clickable header that toggles the content.",
      props: [
        { name: "children", type: "ReactNode", required: true, description: "Trigger label text." },
      ],
    },
    {
      name: "AccordionContent",
      description: "Expandable content area.",
      props: [
        { name: "children", type: "ReactNode", required: true, description: "Content to display when expanded." },
      ],
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Triggers use button role with aria-expanded state.",
      "Content regions are associated with triggers via aria-controls.",
      "Hidden content uses aria-hidden for screen readers.",
    ],
    keyboard: [
      { key: "Enter / Space", description: "Toggles the focused accordion item" },
      { key: "Tab", description: "Moves focus between accordion triggers" },
    ],
    focus: [
      "Focus ring is visible on accordion triggers.",
      "Expanded items have distinct visual styling.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Create collapsible sections with Accordion components.",
    code: `import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@unisane/ui";

function FAQ() {
  return (
    <Accordion type="single" defaultValue={["getting-started"]}>
      <AccordionItem value="getting-started">
        <AccordionTrigger>How do I get started?</AccordionTrigger>
        <AccordionContent>
          Install the package and import the components you need.
          Check out the documentation for examples.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="customization">
        <AccordionTrigger>Can I customize the styles?</AccordionTrigger>
        <AccordionContent>
          Yes! All components support Tailwind classes for
          customization. You can also override the default theme.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="accessibility">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>
          All components follow WAI-ARIA guidelines and support
          keyboard navigation out of the box.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "card",
      reason: "Use for standalone content containers.",
    },
    {
      slug: "tabs",
      reason: "Use for content that should be visible simultaneously.",
    },
    {
      slug: "dialog",
      reason: "Use for modal content that requires user attention.",
    },
  ],
};
